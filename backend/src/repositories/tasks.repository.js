import { getClient, query } from '../config/db.js';

const TASK_COLUMNS = `
  t.id,
  t.user_id,
  t.title,
  t.description,
  t.status,
  t.priority,
  to_char(t.due_date, 'YYYY-MM-DD') AS due_date,
  t.parent_task_id,
  t.created_at,
  t.updated_at
`;

/**
 * SELECT base con las categorías agregadas como JSON.
 * El LEFT JOIN + FILTER permite devolver `[]` cuando la tarea no tiene categorías.
 */
const TASK_SELECT = `
  SELECT
    ${TASK_COLUMNS},
    COALESCE(
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'color', c.color
        )
        ORDER BY c.name
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::json
    ) AS categories
  FROM tasks t
  LEFT JOIN task_categories tc ON tc.task_id = t.id
  LEFT JOIN categories c ON c.id = tc.category_id
`;

const FIELD_COLUMNS = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
  parentTaskId: 'parent_task_id',
};

/** Traduce una fila snake_case de PostgreSQL al modelo camelCase de la API. */
function mapRow(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    parentTaskId: row.parent_task_id === null ? null : Number(row.parent_task_id),
    categories: row.categories ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Acceso a datos de `tasks`. Única capa que conoce SQL.
 * Todas las consultas filtran por `user_id` y usan parámetros ($1, $2, ...).
 */
export const tasksRepository = {
  async findAll({
    userId,
    statuses = [],
    priorities = [],
    categoryIds = [],
    search,
  } = {}) {
    const conditions = ['t.user_id = $1'];
    const values = [userId];

    if (statuses.length > 0) {
      values.push(statuses);
      conditions.push(`t.status = ANY($${values.length}::varchar[])`);
    }

    if (priorities.length > 0) {
      values.push(priorities);
      conditions.push(`t.priority = ANY($${values.length}::varchar[])`);
    }

    if (categoryIds.length > 0) {
      values.push(categoryIds);
      conditions.push(
        `EXISTS (
           SELECT 1 FROM task_categories tc_filter
           WHERE tc_filter.task_id = t.id
             AND tc_filter.category_id = ANY($${values.length}::bigint[])
         )`,
      );
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`,
      );
    }

    const { rows } = await query(
      `${TASK_SELECT}
       WHERE ${conditions.join(' AND ')}
       GROUP BY t.id
       ORDER BY t.created_at DESC, t.id DESC`,
      values,
    );
    return rows.map(mapRow);
  },

  async findById(id, userId) {
    const { rows } = await query(
      `${TASK_SELECT}
       WHERE t.id = $1 AND t.user_id = $2
       GROUP BY t.id`,
      [id, userId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async existsForUser(id, userId) {
    const { rowCount } = await query(
      'SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return rowCount > 0;
  },

  async create({
    userId,
    title,
    description = null,
    status = 'pending',
    priority = 'medium',
    dueDate = null,
    parentTaskId = null,
    categoryIds = [],
  }) {
    const client = await getClient();
    let id;

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO tasks
           (user_id, title, description, status, priority, due_date, parent_task_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [userId, title, description, status, priority, dueDate, parentTaskId],
      );

      id = Number(rows[0].id);

      if (categoryIds.length > 0) {
        await client.query(
          `INSERT INTO task_categories (task_id, category_id)
           SELECT $1, unnest($2::bigint[])
           ON CONFLICT DO NOTHING`,
          [id, categoryIds],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.findById(id, userId);
  },

  /**
   * Actualiza campos y, si `categoryIds` viene definido, reemplaza por completo
   * las categorías de la tarea. Todo ocurre en una transacción.
   */
  async update(id, userId, data) {
    const { categoryIds, ...fields } = data;
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const assignments = [];
      const values = [];

      for (const [key, column] of Object.entries(FIELD_COLUMNS)) {
        if (fields[key] === undefined) continue;
        values.push(fields[key]);
        assignments.push(`${column} = $${values.length}`);
      }

      if (assignments.length > 0) {
        values.push(id, userId);
        const { rowCount } = await client.query(
          `UPDATE tasks
           SET ${assignments.join(', ')}
           WHERE id = $${values.length - 1} AND user_id = $${values.length}`,
          values,
        );

        if (rowCount === 0) {
          await client.query('ROLLBACK');
          return null;
        }
      } else {
        // Solo cambian las categorías: verificar que la tarea sea del usuario.
        const { rowCount } = await client.query(
          'SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2',
          [id, userId],
        );

        if (rowCount === 0) {
          await client.query('ROLLBACK');
          return null;
        }
      }

      if (categoryIds !== undefined) {
        await client.query('DELETE FROM task_categories WHERE task_id = $1', [id]);

        if (categoryIds.length > 0) {
          await client.query(
            `INSERT INTO task_categories (task_id, category_id)
             SELECT $1, unnest($2::bigint[])
             ON CONFLICT DO NOTHING`,
            [id, categoryIds],
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.findById(id, userId);
  },

  async remove(id, userId) {
    const { rowCount } = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return rowCount > 0;
  },
};

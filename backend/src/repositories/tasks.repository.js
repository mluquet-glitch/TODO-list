import { query } from '../config/db.js';

/** Columnas expuestas por la API. */
const SELECT_COLUMNS = `
  id,
  user_id,
  title,
  description,
  status,
  priority,
  parent_task_id,
  created_at,
  updated_at
`;

const FIELD_COLUMNS = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
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
    parentTaskId: row.parent_task_id === null ? null : Number(row.parent_task_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Acceso a datos de `tasks`. Única capa que conoce SQL.
 * Todas las consultas filtran por `user_id` para aislar los datos de cada
 * usuario y usan parámetros ($1, $2, ...) para evitar inyección SQL.
 */
export const tasksRepository = {
  async findAll({ userId, status, search, priority } = {}) {
    const conditions = ['user_id = $1'];
    const values = [userId];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (priority) {
      values.push(priority);
      conditions.push(`priority = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    const { rows } = await query(
      `SELECT ${SELECT_COLUMNS}
       FROM tasks
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC, id DESC`,
      values,
    );
    return rows.map(mapRow);
  },

  async findById(id, userId) {
    const { rows } = await query(
      `SELECT ${SELECT_COLUMNS} FROM tasks WHERE id = $1 AND user_id = $2`,
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
    parentTaskId = null,
  }) {
    const { rows } = await query(
      `INSERT INTO tasks (user_id, title, description, status, priority, parent_task_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${SELECT_COLUMNS}`,
      [userId, title, description, status, priority, parentTaskId],
    );
    return mapRow(rows[0]);
  },

  async update(id, userId, data) {
    const assignments = [];
    const values = [];

    for (const [key, column] of Object.entries(FIELD_COLUMNS)) {
      if (data[key] === undefined) continue;
      values.push(data[key]);
      assignments.push(`${column} = $${values.length}`);
    }

    if (assignments.length === 0) return null;

    values.push(id, userId);
    const { rows } = await query(
      `UPDATE tasks
       SET ${assignments.join(', ')}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING ${SELECT_COLUMNS}`,
      values,
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async remove(id, userId) {
    const { rowCount } = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return rowCount > 0;
  },
};

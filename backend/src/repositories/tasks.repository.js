import { query } from '../config/db.js';

/** Columnas expuestas por la API (due_date se formatea como YYYY-MM-DD, sin zona horaria). */
const SELECT_COLUMNS = `
  id,
  title,
  description,
  status,
  to_char(due_date, 'YYYY-MM-DD') AS due_date,
  created_at,
  updated_at
`;

const FIELD_COLUMNS = {
  title: 'title',
  description: 'description',
  status: 'status',
  dueDate: 'due_date',
};

/** Traduce una fila snake_case de PostgreSQL al modelo camelCase de la API. */
function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Acceso a datos de `tasks`. Única capa que conoce SQL.
 * Todas las consultas usan parámetros ($1, $2, ...) para evitar inyección SQL.
 */
export const tasksRepository = {
  async findAll({ status, search } = {}) {
    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT ${SELECT_COLUMNS} FROM tasks ${where} ORDER BY created_at DESC`,
      values,
    );
    return rows.map(mapRow);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${SELECT_COLUMNS} FROM tasks WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create({ title, description = null, status = 'pending', dueDate = null }) {
    const { rows } = await query(
      `INSERT INTO tasks (title, description, status, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SELECT_COLUMNS}`,
      [title, description, status, dueDate],
    );
    return mapRow(rows[0]);
  },

  async update(id, data) {
    const assignments = [];
    const values = [];

    for (const [key, column] of Object.entries(FIELD_COLUMNS)) {
      if (data[key] === undefined) continue;
      values.push(data[key]);
      assignments.push(`${column} = $${values.length}`);
    }

    if (assignments.length === 0) return null;

    values.push(id);
    const { rows } = await query(
      `UPDATE tasks
       SET ${assignments.join(', ')}
       WHERE id = $${values.length}
       RETURNING ${SELECT_COLUMNS}`,
      values,
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM tasks WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

import { query } from '../config/db.js';

const PUBLIC_COLUMNS = 'id, name, email, role, created_at, updated_at';

/** Fila de PostgreSQL → objeto de dominio (id numérico, camelCase). */
function mapUser(row, { withPassword = false } = {}) {
  const user = {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Solo se incluye en consultas internas de autenticación.
  if (withPassword) user.passwordHash = row.password_hash;

  return user;
}

export const usersRepository = {
  async create({ name, email, passwordHash, role = 'user' }) {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_COLUMNS}`,
      [name, email, passwordHash, role],
    );
    return mapUser(rows[0]);
  },

  async findByEmail(email) {
    const { rows } = await query(
      `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] ? mapUser(rows[0], { withPassword: true }) : null;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapUser(rows[0]) : null;
  },
};

import { query } from '../config/db.js';

const COLUMNS = 'id, name, slug, color';

function mapRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    color: row.color,
  };
}

export const categoriesRepository = {
  async findAll() {
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM categories ORDER BY name ASC`,
    );
    return rows.map(mapRow);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM categories WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByIds(ids) {
    if (ids.length === 0) return [];

    const { rows } = await query(
      `SELECT ${COLUMNS}
       FROM categories
       WHERE id = ANY($1::bigint[])
       ORDER BY name ASC`,
      [ids],
    );
    return rows.map(mapRow);
  },

  /** Busca por nombre sin distinguir mayúsculas; excluye un id al actualizar. */
  async findByName(name, excludeId = null) {
    const { rows } = await query(
      `SELECT ${COLUMNS}
       FROM categories
       WHERE LOWER(name) = LOWER($1)
         AND ($2::bigint IS NULL OR id <> $2)
       LIMIT 1`,
      [name, excludeId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async slugExists(slug, excludeId = null) {
    const { rowCount } = await query(
      `SELECT 1
       FROM categories
       WHERE slug = $1
         AND ($2::bigint IS NULL OR id <> $2)`,
      [slug, excludeId],
    );
    return rowCount > 0;
  },

  async create({ name, slug, color }) {
    const { rows } = await query(
      `INSERT INTO categories (name, slug, color)
       VALUES ($1, $2, $3)
       RETURNING ${COLUMNS}`,
      [name, slug, color],
    );
    return mapRow(rows[0]);
  },

  async update(id, { name, slug, color }) {
    const { rows } = await query(
      `UPDATE categories
       SET name = $1, slug = $2, color = $3
       WHERE id = $4
       RETURNING ${COLUMNS}`,
      [name, slug, color, id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

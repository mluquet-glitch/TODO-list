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
};

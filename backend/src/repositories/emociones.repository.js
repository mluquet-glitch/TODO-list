import { query } from '../config/db.js';

const COLUMNS = 'id, nombre';

function mapRow(row) {
  return {
    id: Number(row.id),
    nombre: row.nombre,
  };
}

/** Acceso a datos del catálogo de emociones. */
export const emocionesRepository = {
  async findAll() {
    const { rows } = await query(
      `SELECT ${COLUMNS}
       FROM emociones
       ORDER BY LOWER(nombre) ASC, id ASC`,
    );
    return rows.map(mapRow);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM emociones WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByIds(ids) {
    if (ids.length === 0) return [];

    const { rows } = await query(
      `SELECT ${COLUMNS}
       FROM emociones
       WHERE id = ANY($1::bigint[])
       ORDER BY LOWER(nombre) ASC, id ASC`,
      [ids],
    );
    return rows.map(mapRow);
  },

  /** Busca por nombre sin distinguir mayúsculas; excluye un id al actualizar. */
  async findByName(nombre, excludeId = null) {
    const { rows } = await query(
      `SELECT ${COLUMNS}
       FROM emociones
       WHERE LOWER(nombre) = LOWER($1)
         AND ($2::bigint IS NULL OR id <> $2)
       LIMIT 1`,
      [nombre, excludeId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create({ nombre }) {
    const { rows } = await query(
      `INSERT INTO emociones (nombre)
       VALUES ($1)
       RETURNING ${COLUMNS}`,
      [nombre],
    );
    return mapRow(rows[0]);
  },

  async update(id, { nombre }) {
    const { rows } = await query(
      `UPDATE emociones
       SET nombre = $1
       WHERE id = $2
       RETURNING ${COLUMNS}`,
      [nombre, id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM emociones WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

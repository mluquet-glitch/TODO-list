import { query } from '../config/db.js';

const PROTOCOLO_SELECT = `
  SELECT
    p.id,
    p.nombre,
    p.disparador,
    COALESCE(
      json_agg(
        json_build_object(
          'id', pa.id,
          'protocoloId', pa.protocolo_id,
          'nombre', pa.nombre,
          'descripcion', pa.descripcion
        )
        ORDER BY pa.id
      ) FILTER (WHERE pa.id IS NOT NULL),
      '[]'::json
    ) AS pasos
  FROM protocolos p
  LEFT JOIN pasos pa ON pa.protocolo_id = p.id
`;

function mapProtocolo(row) {
  return {
    id: Number(row.id),
    nombre: row.nombre,
    disparador: row.disparador,
    pasos: row.pasos ?? [],
  };
}

function mapPaso(row) {
  return {
    id: Number(row.id),
    protocoloId: Number(row.protocolo_id),
    nombre: row.nombre,
    descripcion: row.descripcion,
  };
}

/** Acceso a datos de protocolos y sus pasos. */
export const protocolosRepository = {
  async findAll() {
    const { rows } = await query(
      `${PROTOCOLO_SELECT}
       GROUP BY p.id
       ORDER BY LOWER(p.nombre) ASC, p.id ASC`,
    );
    return rows.map(mapProtocolo);
  },

  async findById(id) {
    const { rows } = await query(
      `${PROTOCOLO_SELECT}
       WHERE p.id = $1
       GROUP BY p.id`,
      [id],
    );
    return rows[0] ? mapProtocolo(rows[0]) : null;
  },

  async create({ nombre, disparador = null }) {
    const { rows } = await query(
      `INSERT INTO protocolos (nombre, disparador)
       VALUES ($1, $2)
       RETURNING id, nombre, disparador`,
      [nombre, disparador],
    );
    return {
      id: Number(rows[0].id),
      nombre: rows[0].nombre,
      disparador: rows[0].disparador,
      pasos: [],
    };
  },

  async update(id, { nombre, disparador }) {
    const { rows } = await query(
      `UPDATE protocolos
       SET nombre = $1, disparador = $2
       WHERE id = $3
       RETURNING id, nombre, disparador`,
      [nombre, disparador, id],
    );
    return rows[0]
      ? {
          id: Number(rows[0].id),
          nombre: rows[0].nombre,
          disparador: rows[0].disparador,
        }
      : null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM protocolos WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async findPasoById(id, protocoloId) {
    const { rows } = await query(
      `SELECT id, protocolo_id, nombre, descripcion
       FROM pasos
       WHERE id = $1 AND protocolo_id = $2`,
      [id, protocoloId],
    );
    return rows[0] ? mapPaso(rows[0]) : null;
  },

  async createPaso({ protocoloId, nombre, descripcion = null }) {
    const { rows } = await query(
      `INSERT INTO pasos (protocolo_id, nombre, descripcion)
       VALUES ($1, $2, $3)
       RETURNING id, protocolo_id, nombre, descripcion`,
      [protocoloId, nombre, descripcion],
    );
    return mapPaso(rows[0]);
  },

  async updatePaso(id, protocoloId, { nombre, descripcion }) {
    const { rows } = await query(
      `UPDATE pasos
       SET nombre = $1, descripcion = $2
       WHERE id = $3 AND protocolo_id = $4
       RETURNING id, protocolo_id, nombre, descripcion`,
      [nombre, descripcion, id, protocoloId],
    );
    return rows[0] ? mapPaso(rows[0]) : null;
  },

  async removePaso(id, protocoloId) {
    const { rowCount } = await query(
      'DELETE FROM pasos WHERE id = $1 AND protocolo_id = $2',
      [id, protocoloId],
    );
    return rowCount > 0;
  },
};

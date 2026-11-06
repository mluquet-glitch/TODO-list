import { query } from '../config/db.js';

const EJECUCION_SELECT = `
  SELECT
    e.id,
    e.protocolo_id,
    e.fecha_hora,
    p.nombre AS protocolo_nombre,
    p.disparador AS protocolo_disparador,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', pa.id,
            'protocoloId', pa.protocolo_id,
            'nombre', pa.nombre,
            'descripcion', pa.descripcion
          )
          ORDER BY pa.id
        )
        FROM pasos pa
        WHERE pa.protocolo_id = p.id
      ),
      '[]'::json
    ) AS pasos
  FROM ejecuciones e
  JOIN protocolos p ON p.id = e.protocolo_id
`;

function mapRow(row) {
  return {
    id: Number(row.id),
    protocoloId: Number(row.protocolo_id),
    fechaHora: row.fecha_hora,
    protocolo: {
      id: Number(row.protocolo_id),
      nombre: row.protocolo_nombre,
      disparador: row.protocolo_disparador,
      pasos: row.pasos ?? [],
    },
  };
}

/** Acceso a datos de las ejecuciones de protocolos. */
export const ejecucionesRepository = {
  async findAll() {
    const { rows } = await query(
      `${EJECUCION_SELECT}
       ORDER BY e.fecha_hora DESC, e.id DESC`,
    );
    return rows.map(mapRow);
  },

  async findById(id) {
    const { rows } = await query(
      `${EJECUCION_SELECT}
       WHERE e.id = $1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create({ protocoloId }) {
    const { rows } = await query(
      `INSERT INTO ejecuciones (protocolo_id)
       VALUES ($1)
       RETURNING id`,
      [protocoloId],
    );
    return Number(rows[0].id);
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM ejecuciones WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

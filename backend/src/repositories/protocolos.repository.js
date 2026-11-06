import { getClient, query } from '../config/db.js';

const PROTOCOLO_SELECT = `
  SELECT
    p.id,
    p.nombre,
    p.disparador,
    p.activo,
    (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', pa.id,
            'protocoloId', pa.protocolo_id,
            'nombre', pa.nombre,
            'descripcion', pa.descripcion,
            'orden', pa.orden
          )
          ORDER BY pa.orden ASC, pa.id ASC
        ),
        '[]'::json
      )
      FROM pasos pa
      WHERE pa.protocolo_id = p.id
    ) AS pasos,
    (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', e.id,
            'nombre', e.nombre
          )
          ORDER BY LOWER(e.nombre) ASC, e.id ASC
        ),
        '[]'::json
      )
      FROM emociones e
      INNER JOIN protocolo_emociones pe ON pe.emocion_id = e.id
      WHERE pe.protocolo_id = p.id
    ) AS emociones
  FROM protocolos p
`;

function mapProtocolo(row) {
  return {
    id: Number(row.id),
    nombre: row.nombre,
    disparador: row.disparador,
    activo: row.activo,
    pasos: row.pasos ?? [],
    emociones: row.emociones ?? [],
  };
}

function mapPaso(row) {
  return {
    id: Number(row.id),
    protocoloId: Number(row.protocolo_id),
    nombre: row.nombre,
    descripcion: row.descripcion,
    orden: row.orden === null ? null : Number(row.orden),
  };
}

/** Reemplaza los vínculos de un protocolo con emociones dentro de una transacción. */
async function replaceEmociones(client, protocoloId, emocionIds) {
  await client.query(
    'DELETE FROM protocolo_emociones WHERE protocolo_id = $1',
    [protocoloId],
  );

  if (emocionIds.length > 0) {
    await client.query(
      `INSERT INTO protocolo_emociones (protocolo_id, emocion_id)
       SELECT $1, t.emocion_id
       FROM unnest($2::bigint[]) AS t(emocion_id)`,
      [protocoloId, emocionIds],
    );
  }
}

/** Acceso a datos de protocolos, sus pasos y sus emociones. */
export const protocolosRepository = {
  async findAll({ activo = true, emocionIds = [] } = {}) {
    const conditions = [];
    const values = [];

    if (typeof activo === 'boolean') {
      values.push(activo);
      conditions.push(`p.activo = $${values.length}`);
    }

    if (emocionIds.length > 0) {
      values.push(emocionIds);
      conditions.push(
        `EXISTS (
          SELECT 1
          FROM protocolo_emociones pe_filtro
          WHERE pe_filtro.protocolo_id = p.id
            AND pe_filtro.emocion_id = ANY($${values.length}::bigint[])
        )`,
      );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `${PROTOCOLO_SELECT}
       ${where}
       ORDER BY LOWER(p.nombre) ASC, p.id ASC`,
      values,
    );
    return rows.map(mapProtocolo);
  },

  async findById(id) {
    const { rows } = await query(
      `${PROTOCOLO_SELECT}
       WHERE p.id = $1`,
      [id],
    );
    return rows[0] ? mapProtocolo(rows[0]) : null;
  },

  async create({ nombre, disparador = null, activo = true, emocionIds = [] }) {
    const client = await getClient();
    let createdId;

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO protocolos (nombre, disparador, activo)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [nombre, disparador, activo],
      );

      createdId = Number(rows[0].id);
      if (emocionIds.length > 0) {
        await client.query(
          `INSERT INTO protocolo_emociones (protocolo_id, emocion_id)
           SELECT $1, t.emocion_id
           FROM unnest($2::bigint[]) AS t(emocion_id)`,
          [createdId, emocionIds],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    return this.findById(createdId);
  },

  async update(id, { nombre, disparador, activo, emocionIds }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { rowCount } = await client.query(
        `UPDATE protocolos
         SET nombre = $1, disparador = $2, activo = $3
         WHERE id = $4`,
        [nombre, disparador, activo, id],
      );

      if (rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      if (emocionIds !== undefined) {
        await replaceEmociones(client, id, emocionIds);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    return this.findById(id);
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

  async createPaso({ protocoloId, nombre, descripcion = null, orden = null }) {
    const ordenFinal =
      orden !== null && orden !== undefined
        ? orden
        : (
            await query(
              `SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente
               FROM pasos
               WHERE protocolo_id = $1`,
              [protocoloId],
            )
          ).rows[0].siguiente;

    const { rows } = await query(
      `INSERT INTO pasos (protocolo_id, nombre, descripcion, orden)
       VALUES ($1, $2, $3, $4)
       RETURNING id, protocolo_id, nombre, descripcion, orden`,
      [protocoloId, nombre, descripcion, ordenFinal],
    );
    return mapPaso(rows[0]);
  },

  async updatePaso(id, protocoloId, { nombre, descripcion, orden }) {
    const assignments = [];
    const values = [];

    if (nombre !== undefined) {
      values.push(nombre);
      assignments.push(`nombre = $${values.length}`);
    }
    if (descripcion !== undefined) {
      values.push(descripcion);
      assignments.push(`descripcion = $${values.length}`);
    }
    if (orden !== undefined) {
      values.push(orden);
      assignments.push(`orden = $${values.length}`);
    }

    if (assignments.length === 0) {
      return this.findPasoById(id, protocoloId);
    }

    values.push(id, protocoloId);

    const { rows } = await query(
      `UPDATE pasos
       SET ${assignments.join(', ')}
       WHERE id = $${values.length - 1} AND protocolo_id = $${values.length}
       RETURNING id, protocolo_id, nombre, descripcion, orden`,
      values,
    );
    return rows[0] ? mapPaso(rows[0]) : null;
  },

  /** Reasigna el orden de los pasos de un protocolo según la lista de ids recibida. */
  async reordenarPasos(protocoloId, pasoIds) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Verifica que todos los pasos pertenecen al protocolo.
      const { rows: existentes } = await client.query(
        `SELECT id FROM pasos WHERE protocolo_id = $1`,
        [protocoloId],
      );
      const existentesIds = new Set(existentes.map((r) => Number(r.id)));
      const invalidos = pasoIds.filter((id) => !existentesIds.has(id));
      if (invalidos.length > 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // Asigna orden secuencial según la posición en la lista.
      for (let i = 0; i < pasoIds.length; i += 1) {
        await client.query(
          `UPDATE pasos SET orden = $1 WHERE id = $2 AND protocolo_id = $3`,
          [i + 1, pasoIds[i], protocoloId],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    return this.findById(protocoloId);
  },

  async removePaso(id, protocoloId) {
    const { rowCount } = await query(
      'DELETE FROM pasos WHERE id = $1 AND protocolo_id = $2',
      [id, protocoloId],
    );
    return rowCount > 0;
  },
};

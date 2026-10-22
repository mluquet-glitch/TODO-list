import { getClient, query } from '../config/db.js';

function mapToken(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export const refreshTokensRepository = {
  async create({ userId, tokenHash, expiresAt, userAgent = null }) {
    const { rows } = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at`,
      [userId, tokenHash, expiresAt, userAgent],
    );
    return mapToken(rows[0]);
  },

  async findByHash(tokenHash) {
    const { rows } = await query(
      `SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
       FROM refresh_tokens
       WHERE token_hash = $1`,
      [tokenHash],
    );
    return rows[0] ? mapToken(rows[0]) : null;
  },

  /**
   * Rotación atómica: revoca el token usado e inserta el nuevo en la misma
   * transacción. Devuelve false si otro proceso ya lo había revocado.
   */
  async rotate({ id, userId, tokenHash, expiresAt, userAgent = null }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const revoked = await client.query(
        `UPDATE refresh_tokens
         SET revoked_at = now()
         WHERE id = $1 AND revoked_at IS NULL`,
        [id],
      );

      if (revoked.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent)
         VALUES ($1, $2, $3, $4)`,
        [userId, tokenHash, expiresAt, userAgent],
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async revokeByHash(tokenHash) {
    await query(
      `UPDATE refresh_tokens
       SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
  },

  /** Revoca todas las sesiones de un usuario (reutilización de token, logout global). */
  async revokeAllForUser(userId) {
    await query(
      `UPDATE refresh_tokens
       SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  },
};

-- 012_create_emociones.sql
-- Catálogo de emociones y relación muchos-a-muchos con protocolos.
-- Un protocolo puede tener varias emociones y una emoción varios protocolos.

CREATE TABLE emociones (
  id     BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,

  CONSTRAINT uq_emociones_nombre UNIQUE (nombre)
);

COMMENT ON TABLE emociones IS 'Emociones que pueden vincularse a los protocolos';

CREATE TABLE protocolo_emociones (
  protocolo_id BIGINT NOT NULL,
  emocion_id   BIGINT NOT NULL,

  PRIMARY KEY (protocolo_id, emocion_id),

  CONSTRAINT fk_protocolo_emociones_protocolo
    FOREIGN KEY (protocolo_id)
    REFERENCES protocolos(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_protocolo_emociones_emocion
    FOREIGN KEY (emocion_id)
    REFERENCES emociones(id)
    ON DELETE CASCADE
);

-- La PK cubre las búsquedas por protocolo; este índice cubre las de emoción.
CREATE INDEX idx_protocolo_emociones_emocion
  ON protocolo_emociones (emocion_id);

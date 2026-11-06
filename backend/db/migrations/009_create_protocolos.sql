-- 009_create_protocolos.sql
-- Protocolos con sus pasos y sus ejecuciones.
-- Relaciones:
--   protocolos 1:N pasos
--   protocolos 1:N ejecuciones

CREATE TABLE protocolos (
  id     BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL
);

COMMENT ON TABLE protocolos IS 'Protocolos que agrupan una secuencia de pasos';

CREATE TABLE pasos (
  id           BIGSERIAL PRIMARY KEY,
  protocolo_id BIGINT NOT NULL,
  nombre       VARCHAR(255) NOT NULL,
  descripcion  TEXT,

  CONSTRAINT fk_pasos_protocolo
    FOREIGN KEY (protocolo_id)
    REFERENCES protocolos(id)
    ON DELETE CASCADE
);

COMMENT ON TABLE pasos IS 'Pasos que pertenecen a un protocolo';

CREATE TABLE ejecuciones (
  id           BIGSERIAL PRIMARY KEY,
  protocolo_id BIGINT NOT NULL,
  fecha_hora   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ejecuciones_protocolo
    FOREIGN KEY (protocolo_id)
    REFERENCES protocolos(id)
    ON DELETE CASCADE
);

COMMENT ON TABLE ejecuciones IS 'Ejecuciones realizadas de un protocolo';

-- Índices para consultar los pasos y ejecuciones de cada protocolo.
CREATE INDEX idx_pasos_protocolo ON pasos (protocolo_id);
CREATE INDEX idx_ejecuciones_protocolo ON ejecuciones (protocolo_id);
CREATE INDEX idx_ejecuciones_fecha_hora ON ejecuciones (fecha_hora DESC);

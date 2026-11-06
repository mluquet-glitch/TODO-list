import { useState } from 'react';

/** Vista central de un protocolo: datos, acciones y CRUD de sus pasos. */
export default function ProtocolDetail({
  protocolo,
  saving = false,
  onEdit,
  onDelete,
  onExecute,
  onAddPaso,
  onUpdatePaso,
  onRemovePaso,
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [stepError, setStepError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editError, setEditError] = useState('');

  async function handleAddStep(event) {
    event.preventDefault();

    const value = nombre.trim();
    if (!value) {
      setStepError('El nombre del paso es obligatorio.');
      return;
    }

    const updated = await onAddPaso(protocolo.id, {
      nombre: value,
      descripcion: descripcion.trim() || null,
    });

    if (updated) {
      setNombre('');
      setDescripcion('');
      setStepError('');
    }
  }

  function startEdit(paso) {
    setEditingId(paso.id);
    setEditNombre(paso.nombre);
    setEditDescripcion(paso.descripcion ?? '');
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNombre('');
    setEditDescripcion('');
    setEditError('');
  }

  async function handleUpdateStep(event) {
    event.preventDefault();

    const value = editNombre.trim();
    if (!value) {
      setEditError('El nombre del paso es obligatorio.');
      return;
    }

    const updated = await onUpdatePaso(protocolo.id, editingId, {
      nombre: value,
      descripcion: editDescripcion.trim() || null,
    });

    if (updated) cancelEdit();
  }

  async function handleDeleteStep(paso) {
    if (
      !window.confirm(
        `¿Eliminar el paso “${paso.nombre}” del protocolo “${protocolo.nombre}”?`,
      )
    ) {
      return;
    }

    await onRemovePaso(protocolo.id, paso.id);
  }

  return (
    <article className="card protocol-detail">
      <header className="protocol-detail__header">
        <div>
          <h2 className="protocol-detail__title">{protocolo.nombre}</h2>
          <p className="muted protocol-detail__meta">
            {protocolo.pasos.length}{' '}
            {protocolo.pasos.length === 1 ? 'paso' : 'pasos'}
          </p>
          {protocolo.disparador && (
            <p className="protocol-detail__trigger">
              <span>Disparador:</span> {protocolo.disparador}
            </p>
          )}
        </div>

        <div className="protocol-detail__actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onEdit(protocolo)}
            disabled={saving}
          >
            Editar
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => onExecute(protocolo.id)}
            disabled={saving}
          >
            {saving ? 'Procesando…' : 'Ejecutar'}
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={() => onDelete(protocolo)}
            disabled={saving}
          >
            Eliminar
          </button>
        </div>
      </header>

      <section className="protocol-detail__steps">
        <h3 className="protocol-detail__subtitle">
          Pasos ({protocolo.pasos.length})
        </h3>

        {protocolo.pasos.length === 0 ? (
          <p className="muted">
            Este protocolo todavía no tiene pasos. Añade el primero abajo.
          </p>
        ) : (
          <ol className="step-list">
            {protocolo.pasos.map((paso, index) => (
              <li key={paso.id} className="step-card">
                {editingId === paso.id ? (
                  <form
                    className="step-card__edit"
                    onSubmit={handleUpdateStep}
                    noValidate
                  >
                    <div className="field">
                      <label htmlFor={`step-name-${paso.id}`}>Nombre</label>
                      <input
                        id={`step-name-${paso.id}`}
                        type="text"
                        value={editNombre}
                        onChange={(event) => {
                          setEditNombre(event.target.value);
                          if (editError) setEditError('');
                        }}
                        maxLength={255}
                        aria-invalid={Boolean(editError)}
                      />
                      {editError && (
                        <span className="field__error">{editError}</span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor={`step-description-${paso.id}`}>
                        Descripción
                      </label>
                      <textarea
                        id={`step-description-${paso.id}`}
                        rows={2}
                        value={editDescripcion}
                        onChange={(event) =>
                          setEditDescripcion(event.target.value)
                        }
                        maxLength={2000}
                      />
                    </div>

                    <div className="step-card__actions">
                      <button
                        type="submit"
                        className="button button--primary"
                        disabled={saving}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span className="step-card__number" aria-hidden="true">
                      {index + 1}
                    </span>

                    <div className="step-card__body">
                      <h4 className="step-card__name">{paso.nombre}</h4>
                      {paso.descripcion && (
                        <p className="step-card__description">
                          {paso.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="step-card__actions">
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => startEdit(paso)}
                        disabled={saving}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="button button--danger"
                        onClick={() => handleDeleteStep(paso)}
                        disabled={saving}
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}

        <form className="step-form" onSubmit={handleAddStep} noValidate>
          <h4 className="step-form__title">Nuevo paso</h4>

          <div className="field">
            <label htmlFor="new-step-name">Nombre del paso</label>
            <input
              id="new-step-name"
              type="text"
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);
                if (stepError) setStepError('');
              }}
              maxLength={255}
              placeholder="Ej. Verificar credenciales"
              autoComplete="off"
              aria-invalid={Boolean(stepError)}
            />
            {stepError && <span className="field__error">{stepError}</span>}
          </div>

          <div className="field">
            <label htmlFor="new-step-description">Descripción</label>
            <textarea
              id="new-step-description"
              rows={2}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              maxLength={2000}
              placeholder="Detalles opcionales del paso"
            />
          </div>

          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Añadir paso'}
          </button>
        </form>
      </section>
    </article>
  );
}

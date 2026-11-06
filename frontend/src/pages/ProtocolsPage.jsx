import { useEffect, useMemo, useState } from 'react';
import Alert from '../components/Alert.jsx';
import ExecutionDetail from '../components/ExecutionDetail.jsx';
import ExecutionList from '../components/ExecutionList.jsx';
import ProtocolDetail from '../components/ProtocolDetail.jsx';
import ProtocolForm from '../components/ProtocolForm.jsx';
import ProtocolList from '../components/ProtocolList.jsx';
import { useEjecuciones } from '../hooks/useEjecuciones.js';
import { useProtocolos } from '../hooks/useProtocolos.js';

/** Pantalla de protocolos: CRUD en el sidebar y detalle en el área central. */
export default function ProtocolsPage() {
  const {
    protocolos,
    loading: protocolosLoading,
    saving: protocolosSaving,
    error: protocolosError,
    createProtocolo,
    updateProtocolo,
    removeProtocolo,
    createPaso,
    updatePaso,
    removePaso,
    refresh: refreshProtocolos,
    clearError: clearProtocolosError,
  } = useProtocolos();

  const {
    ejecuciones,
    loading: ejecucionesLoading,
    saving: ejecucionesSaving,
    error: ejecucionesError,
    createEjecucion,
    removeEjecucion,
    refresh: refreshEjecuciones,
    clearError: clearEjecucionesError,
  } = useEjecuciones();

  const [selectedProtocolId, setSelectedProtocolId] = useState(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState(null);
  const [editingProtocol, setEditingProtocol] = useState(null);

  const selectedProtocol = useMemo(
    () => protocolos.find((item) => item.id === selectedProtocolId) ?? null,
    [protocolos, selectedProtocolId],
  );

  const selectedExecution = useMemo(
    () => ejecuciones.find((item) => item.id === selectedExecutionId) ?? null,
    [ejecuciones, selectedExecutionId],
  );

  // Si el protocolo abierto se elimina, volvemos a la vista vacía.
  useEffect(() => {
    if (
      selectedProtocolId !== null &&
      !protocolosLoading &&
      !selectedProtocol
    ) {
      setSelectedProtocolId(null);
    }
  }, [selectedProtocolId, selectedProtocol, protocolosLoading]);

  // Lo mismo para una ejecución eliminada o cuyo protocolo fue eliminado.
  useEffect(() => {
    if (
      selectedExecutionId !== null &&
      !ejecucionesLoading &&
      !selectedExecution
    ) {
      setSelectedExecutionId(null);
    }
  }, [selectedExecutionId, selectedExecution, ejecucionesLoading]);

  function selectProtocol(id) {
    setSelectedProtocolId(id);
    setSelectedExecutionId(null);
  }

  function selectExecution(id) {
    setSelectedExecutionId(id);
    setSelectedProtocolId(null);
  }

  async function handleCreateProtocol(payload) {
    const created = await createProtocolo(payload);
    if (created) selectProtocol(created.id);
    return created;
  }

  async function handleUpdateProtocol(id, changes) {
    const updated = await updateProtocolo(id, changes);
    if (updated) {
      setEditingProtocol(null);
    }
    return updated;
  }

  async function handleDeleteProtocol(protocolo) {
    if (
      !window.confirm(
        `¿Eliminar el protocolo “${protocolo.nombre}”? También se eliminarán sus pasos y ejecuciones.`,
      )
    ) {
      return false;
    }

    const deleted = await removeProtocolo(protocolo.id);

    if (deleted) {
      if (selectedProtocolId === protocolo.id) {
        setSelectedProtocolId(null);
      }
      if (editingProtocol?.id === protocolo.id) {
        setEditingProtocol(null);
      }
      await refreshEjecuciones();
    }

    return deleted;
  }

  async function handleExecute(protocoloId) {
    const created = await createEjecucion(protocoloId);

    if (created) {
      setSelectedExecutionId(created.id);
      setSelectedProtocolId(null);
    }

    return created;
  }

  async function handleDeleteExecution(ejecucion) {
    if (
      !window.confirm(
        `¿Eliminar la ejecución de “${ejecucion.protocolo.nombre}”?`,
      )
    ) {
      return false;
    }

    const deleted = await removeEjecucion(ejecucion.id);

    if (deleted) {
      setSelectedExecutionId(null);
      setSelectedProtocolId(ejecucion.protocoloId);
    }

    return deleted;
  }

  const busy = protocolosSaving || ejecucionesSaving;

  return (
    <div className="protocols-page">
      <aside className="protocols-page__sidebar">
        <ProtocolForm
          editingProtocol={editingProtocol}
          saving={busy}
          onCreate={handleCreateProtocol}
          onUpdate={handleUpdateProtocol}
          onCancelEdit={() => setEditingProtocol(null)}
        />

        <ProtocolList
          protocolos={protocolos}
          selectedId={selectedProtocolId}
          loading={protocolosLoading}
          onSelect={selectProtocol}
          onEdit={(protocolo) => setEditingProtocol(protocolo)}
        />

        <ExecutionList
          ejecuciones={ejecuciones}
          selectedId={selectedExecutionId}
          loading={ejecucionesLoading}
          onSelect={selectExecution}
        />
      </aside>

      <section className="protocols-page__content">
        <Alert
          type="error"
          message={protocolosError}
          onRetry={refreshProtocolos}
          onClose={clearProtocolosError}
        />
        <Alert
          type="error"
          message={ejecucionesError}
          onRetry={refreshEjecuciones}
          onClose={clearEjecucionesError}
        />

        {selectedProtocol ? (
          <ProtocolDetail
            key={selectedProtocol.id}
            protocolo={selectedProtocol}
            saving={busy}
            onEdit={(protocolo) => setEditingProtocol(protocolo)}
            onDelete={handleDeleteProtocol}
            onExecute={handleExecute}
            onAddPaso={createPaso}
            onUpdatePaso={updatePaso}
            onRemovePaso={removePaso}
          />
        ) : selectedExecution ? (
          <ExecutionDetail
            key={selectedExecution.id}
            ejecucion={selectedExecution}
            saving={busy}
            onDelete={handleDeleteExecution}
            onOpenProtocol={selectProtocol}
          />
        ) : (
          <div className="empty-state protocols-page__empty">
            <h2>Protocolos</h2>
            <p>
              Crea o selecciona un protocolo en el sidebar para ver sus pasos.
            </p>
            <p className="muted">
              También puedes seleccionar una ejecución para consultar cuándo se
              realizó.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

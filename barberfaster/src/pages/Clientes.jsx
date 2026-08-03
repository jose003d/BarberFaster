import { useEffect, useState } from "react";
import { desactivarCliente, obtenerClientes } from "../services/api";
import ClienteModal from "../components/ClienteModal";
import ConfirmModal from "../components/ConfirmModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faToggleOff, faToggleOn, faTrashCanArrowUp, faTrashCan } from "@fortawesome/free-solid-svg-icons";

function Clientes() {
  // ==========================
  // Estados principales
  // ==========================
  const [clientes, setClientes]             = useState([]);
  const [confirmModal, setConfirmModal]     = useState({ open: false, item: null });
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarPapelera, setMostrarPapelera] = useState(false);

  // ==========================
  // Cargar clientes al montar
  // ==========================
  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const data = await obtenerClientes();
      if (Array.isArray(data)) setClientes(data);
      else setFetchError("Formato de datos inesperado.");
    } catch (err) {
      setFetchError("No hay conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Acciones de usuario
  // ==========================
  const handleAgregar = () => {
    setClienteSeleccionado(null);
    setIsModalOpen(true);
  };

  const openConfirmModal = (cliente) => {
    setConfirmModal({ open: true, item: cliente });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, item: null });
  };

  const handleEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setIsModalOpen(true);
  };

  // ==========================
  // Manejo de éxito en modal
  // ==========================
  const handleModalSuccess = (clienteData, esEdicion) => {
    if (esEdicion) {
      setClientes((prev) =>
        prev.map((c) => (c.dni === clienteData.dni ? clienteData : c))
      );
      setSuccessMessage("Cliente actualizado con éxito.");
    } else {
      setClientes((prev) => [clienteData, ...prev]);
      setSuccessMessage("Cliente registrado con éxito.");
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ==========================
  // Desactivar / Reactivar cliente
  // ==========================
  const handleDesactivar = async (cliente, skipConfirm = false) => {
    if (!skipConfirm) {
      openConfirmModal(cliente);
      return;
    }

    try {
      const response = await desactivarCliente(cliente.dni);
      if (response.success) {
        setClientes((prev) =>
          prev.map((c) =>
            c.dni === cliente.dni ? { ...c, estado: Number(c.estado) === 1 ? 0 : 1 } : c
          )
        );
        setSuccessMessage(`Cliente ${Number(cliente.estado) === 1 ? "movido a papelera" : "reactivado"} con éxito.`);
      }
    } catch (err) {
      setFetchError(err?.message || "No se pudo cambiar el estado del cliente.");
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const confirmDesactivar = () => {
    if (confirmModal.item) {
      handleDesactivar(confirmModal.item, true);
      closeConfirmModal();
    }
  };

  // ==========================
  // Filtrar clientes activos e inactivos
  // ==========================
  const clientesActivos = clientes.filter((c) => Number(c.estado) !== 0);
  const clientesPapelera = clientes.filter((c) => Number(c.estado) === 0);

  // ==========================
  // Renderizado principal
  // ==========================
  return (
    <div className="page-section">
      {/* Encabezado con acciones */}
      <div className="heading-row">
        <div>
          <h2>Gestión de Clientes</h2>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-secondary" onClick={() => setMostrarPapelera((prev) => !prev)}>
            <FontAwesomeIcon icon={faTrashCan} style={{ marginRight: "0.35rem" }} />
            {mostrarPapelera ? "Ver activos" : "Papelera"}
          </button>
          <button className="btn" onClick={handleAgregar}>
            + Agregar cliente
          </button>
        </div>
      </div>

      {/* Mensajes de éxito */}
      {successMessage && <p className="status success">{successMessage}</p>}

      {/* Modal de creación/edición */}
      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        clienteSeleccionado={clienteSeleccionado}
      />

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.item?.estado === 1 ? "Confirmar envío a papelera" : "Confirmar reactivación"}
        message={
          confirmModal.item?.estado === 1
            ? `¿Estás seguro de enviar "${confirmModal.item?.nombre}" a la papelera?`
            : `¿Estás seguro de reactivar "${confirmModal.item?.nombre}"?`
        }
        confirmText={confirmModal.item?.estado === 1 ? "Sí, enviar" : "Sí, reactivar"}
        cancelText="Cancelar"
        onConfirm={confirmDesactivar}
        onCancel={closeConfirmModal}
      />

      {/* Tabla de clientes */}
      {loading ? (
        <p>Cargando clientes...</p>
      ) : fetchError ? (
        <p className="status error">{fetchError}</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(!mostrarPapelera ? clientesActivos : clientesPapelera).length === 0 ? (
                <tr><td colSpan="5">{mostrarPapelera ? "No hay clientes en la papelera." : "No hay clientes registrados."}</td></tr>
              ) : (
                (!mostrarPapelera ? clientesActivos : clientesPapelera).map((c, idx) => (
                  <tr key={`${c.dni}-${idx}`}>
                    <td>{c.nombre}</td>
                    <td>{c.apellido || "-"}</td>
                    <td>{c.telefono || "-"}</td>
                    <td>{c.correo}</td>
                    <td>
                      <button className="btn-secondary" onClick={() => handleEditar(c)} title="Editar">
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => handleDesactivar(c)}
                        title={mostrarPapelera ? "Reactivar" : "Mover a papelera"}
                        style={{ marginLeft: "0.35rem" }}
                      >
                        <FontAwesomeIcon icon={mostrarPapelera ? faTrashCanArrowUp : Number(c.estado) === 1 ? faToggleOff : faToggleOn} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Clientes;

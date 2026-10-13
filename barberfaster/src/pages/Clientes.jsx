import { useEffect, useState } from "react";
import { desactivarCliente, obtenerClientes } from "../services/api";
import { ClienteModal } from "../components/ClienteModal";
import ConfirmModal from "../components/ConfirmModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faToggleOff, faToggleOn, faTrashCanArrowUp, faTrashCan } from "@fortawesome/free-solid-svg-icons";

// Administra clientes, permite editarlos y alternar entre activos y papelera.
function Clientes() {
  // Registros, filtros de estado, mensajes y controles de los modales.
  const [clientes, setClientes]             = useState([]);
  const [confirmModal, setConfirmModal]     = useState({ open: false, item: null });
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarPapelera, setMostrarPapelera] = useState(false);

  // Consulta los registros iniciales y mantiene visibles los errores del servicio.
  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await obtenerClientes();
      if (Array.isArray(data)) {
        setClientes(data);
        setFetchError(null);
      } else {
        setFetchError("Formato de datos inesperado.");
      }
    } catch (err) {
      setFetchError("No hay conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  // Abre los formularios y confirmaciones para las acciones del listado.
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

  // Refresca los datos y muestra confirmación tras guardar cambios.
  const handleModalSuccess = () => {
    cargar();
    setSuccessMessage("Operación realizada con éxito.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Cambia el estado del cliente después de solicitar confirmación.
  const handleDesactivar = async (cliente, skipConfirm = false) => {
    if (!skipConfirm) {
      openConfirmModal(cliente);
      return;
    }

    try {
      const response = await desactivarCliente(cliente.dni);
      if (response && response.status !== "error") {
        setClientes((prev) =>
          prev.map((c) =>
            c.dni === cliente.dni ? { ...c, estado: c.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO" } : c
          )
        );
        setSuccessMessage("Estado del cliente actualizado con éxito.");
      } else {
        setFetchError(response?.mensaje || "No se pudo cambiar el estado.");
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

  // Separa los registros activos y los inactivos para mostrarlos por filtro.
  const clientesActivos = Array.isArray(clientes) 
    ? clientes.filter((c) => {
        if (!c) return false;
        const est = String(c.estado || "ACTIVO").trim().toUpperCase();
        return est === "ACTIVO" || est === "1" || est === "0";
      }) 
    : [];

  const clientesPapelera = Array.isArray(clientes) 
    ? clientes.filter((c) => {
        if (!c) return false;
        const est = String(c.estado || "").trim().toUpperCase();
        return est === "INACTIVO" || est === "INACTIVA";
      }) 
    : [];

  // Renderiza cabecera, modales y tabla según carga, error y filtro actual.
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Encabezado con acciones */}
      <div className="heading-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.6rem", color: "#222" }}>Gestión de Clientes</h2>
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
      {successMessage && <p className="status success" style={{ marginBottom: "1rem" }}>{successMessage}</p>}

      {/* Modal de creación/edición */}
      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        clienteEditar={clienteSeleccionado}
      />

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title="Confirmar cambio de estado"
        message={`¿Estás seguro de modificar el estado de "${confirmModal.item?.nombre}"?`}
        confirmText="Sí, continuar"
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
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bauhaus-ink)", color: "var(--bauhaus-paper)" }}>
                <th style={{ padding: "12px 16px" }}>DNI</th>
                <th style={{ padding: "12px 16px" }}>Nombre</th>
                <th style={{ padding: "12px 16px" }}>Apellido</th>
                <th style={{ padding: "12px 16px" }}>Teléfono</th>
                <th style={{ padding: "12px 16px" }}>Correo</th>
                <th style={{ padding: "12px 16px", width: "120px", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(!mostrarPapelera ? clientesActivos : clientesPapelera).length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                    {mostrarPapelera ? "No hay clientes en la papelera." : "No hay clientes registrados."}
                  </td>
                </tr>
              ) : (
                (!mostrarPapelera ? clientesActivos : clientesPapelera).map((c, idx) => {
                  const esInactivo = String(c.estado).trim().toUpperCase() === "INACTIVO";
                  return (
                    <tr key={`${c.dni || idx}`} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px 16px" }}>{c.dni || "-"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "500" }}>{c.nombre}</td>
                      <td style={{ padding: "12px 16px", color: "#555" }}>{c.apellido || "-"}</td>
                      <td style={{ padding: "12px 16px", color: "#555" }}>{c.telefono || "-"}</td>
                      <td style={{ padding: "12px 16px", color: "#555" }}>{c.correo || "-"}</td>
                      <td className="table-actions-cell" style={{ padding: "12px 16px" }}>
                        <div className="table-actions">
                        <button className="btn-secondary table-action-icon" onClick={() => handleEditar(c)} title="Editar">
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          className="btn-secondary table-action-icon"
                          onClick={() => handleDesactivar(c)}
                          title={mostrarPapelera ? "Reactivar" : "Mover a papelera"}
                        >
                          <FontAwesomeIcon icon={mostrarPapelera ? faTrashCanArrowUp : esInactivo ? faToggleOff : faToggleOn} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Clientes;
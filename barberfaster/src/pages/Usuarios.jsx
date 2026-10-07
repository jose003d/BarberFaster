import { useEffect, useState } from "react";
import { obtenerBarberos, desactivarUsuario } from "../services/api";
import { UsuarioModal } from "../components/UsuarioModal";
import ConfirmModal from "../components/ConfirmModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faToggleOff, faToggleOn, faTrashCanArrowUp, faTrashCan } from "@fortawesome/free-solid-svg-icons";

function Usuarios() {
  const [usuarios, setUsuarios]              = useState([]);
  const [confirmModal, setConfirmModal]     = useState({ open: false, item: null });
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarPapelera, setMostrarPapelera] = useState(false);

  useEffect(() => {
    cargar();
    setIsModalOpen(true);
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await obtenerBarberos();
      if (Array.isArray(data)) {
        setUsuarios(data);
        setFetchError(null);
      } else {
        setFetchError("Formato de datos inesperado.");
      }
    } catch (error) {
      setFetchError("No hay conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = () => {
    setUsuarioSeleccionado(null);
    setIsModalOpen(true);
  };

  const openConfirmModal = (usuario) => {
    setConfirmModal({ open: true, item: usuario });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, item: null });
  };

  const handleEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    cargar();
    setSuccessMessage("Operación realizada con éxito.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDesactivar = async (usuario, skipConfirm = false) => {
    if (!skipConfirm) {
      openConfirmModal(usuario);
      return;
    }

    try {
      const idTarget = usuario.id_barbero || usuario.id_usuario;
      const response = await desactivarUsuario(idTarget);
      
      if (response && response.status !== "error") {
        setUsuarios((prev) =>
          prev.map((u) => {
            const currentId = u.id_barbero || u.id_usuario;
            return currentId === idTarget ? { ...u, estado: u.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO" } : u;
          })
        );
        setSuccessMessage("Estado actualizado con éxito.");
      } else {
        setFetchError(response?.mensaje || "No se pudo cambiar el estado.");
      }
    } catch (err) {
      setFetchError(err?.message || "No se pudo cambiar el estado del registro.");
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

  const usuariosActivos = Array.isArray(usuarios) 
    ? usuarios.filter((u) => {
        if (!u) return false;
        const est = String(u.estado || "ACTIVO").trim().toUpperCase();
        return est === "ACTIVO" || est === "1" || est === "0";
      }) 
    : [];

  const usuariosPapelera = Array.isArray(usuarios) 
    ? usuarios.filter((u) => {
        if (!u) return false;
        const est = String(u.estado || "").trim().toUpperCase();
        return est === "INACTIVO" || est === "INACTIVA";
      }) 
    : [];

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div className="heading-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.6rem", color: "#222" }}>Gestión de Personal y Barberos</h2>
          <p className="page-description" style={{ margin: "4px 0 0", color: "#666" }}></p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-secondary" onClick={() => setMostrarPapelera((prev) => !prev)}>
            <FontAwesomeIcon icon={faTrashCan} style={{ marginRight: "0.35rem" }} />
            {mostrarPapelera ? "Ver activos" : "Papelera"}
          </button>
          <button className="btn" onClick={handleAgregar}>
            + Agregar barbero
          </button>
        </div>
      </div>

      {successMessage && <p className="status success" style={{ marginBottom: "1rem" }}>{successMessage}</p>}

      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        usuarioEditar={usuarioSeleccionado}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        title="Confirmar cambio de estado"
        message={`¿Estás seguro de modificar el estado de "${confirmModal.item?.nombre}"?`}
        confirmText="Sí, continuar"
        cancelText="Cancelar"
        onConfirm={confirmDesactivar}
        onCancel={closeConfirmModal}
      />

      {loading ? (
        <p>Cargando personal...</p>
      ) : fetchError ? (
        <p className="status error">{fetchError}</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bauhaus-ink)", color: "var(--bauhaus-paper)" }}>
                <th style={{ padding: "12px 16px", width: "80px" }}>ID</th>
                <th style={{ padding: "12px 16px" }}>Nombre</th>
                <th style={{ padding: "12px 16px" }}>Especialidad</th>
                <th style={{ padding: "12px 16px", width: "120px", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(!mostrarPapelera ? usuariosActivos : usuariosPapelera).length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                    {mostrarPapelera ? "No hay registros en la papelera." : "No hay personal registrado en el sistema."}
                  </td>
                </tr>
              ) : (
                (!mostrarPapelera ? usuariosActivos : usuariosPapelera).map((u) => {
                  const uniqueKey = u.id_barbero || u.id_usuario;
                  const esInactivo = String(u.estado).trim().toUpperCase() === "INACTIVO";
                  return (
                    <tr key={uniqueKey} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px 16px" }}>{uniqueKey}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "500" }}>{u.nombre}</td>
                      <td style={{ padding: "12px 16px", color: "#555" }}>{u.especialidad || "Sin especialidad"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button className="btn-secondary" onClick={() => handleEditar(u)} title="Editar" style={{ padding: "6px 10px", marginRight: "5px" }}>
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleDesactivar(u)}
                          title={mostrarPapelera ? "Reactivar" : "Mover a papelera"}
                          style={{ padding: "6px 10px" }}
                        >
                          <FontAwesomeIcon icon={mostrarPapelera ? faTrashCanArrowUp : esInactivo ? faToggleOff : faToggleOn} />
                        </button>
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

export default Usuarios;
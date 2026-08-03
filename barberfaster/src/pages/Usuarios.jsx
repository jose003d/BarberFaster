import { useEffect, useState } from "react";
import { desactivarUsuario, obtenerUsuarios } from "../services/api";
import UsuarioModal from "../components/UsuarioModal";
import ConfirmModal from "../components/ConfirmModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faToggleOff, faToggleOn, faTrashCanArrowUp, faTrashCan } from "@fortawesome/free-solid-svg-icons";

function Usuarios() {
  // ==========================
  // Estados principales
  // ==========================
  const [usuarios, setUsuarios]             = useState([]);
  const [confirmModal, setConfirmModal]     = useState({ open: false, item: null });
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarPapelera, setMostrarPapelera] = useState(false);

  // ==========================
  // Cargar usuarios al montar
  // ==========================
  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const data = await obtenerUsuarios();
      if (Array.isArray(data)) setUsuarios(data);
      else setFetchError("Formato de datos inesperado.");
    } catch (error) {
      setFetchError("No hay conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Acciones de usuario
  // ==========================
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

  // ==========================
  // Manejo de éxito en modal
  // ==========================
  const handleModalSuccess = (usuarioData, esEdicion) => {
    if (esEdicion) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id_usuario === usuarioData.id_usuario ? usuarioData : u))
      );
      setSuccessMessage("Usuario actualizado con éxito.");
    } else {
      setUsuarios((prev) => [usuarioData, ...prev]);
      setSuccessMessage("Colaborador registrado con éxito.");
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ==========================
  // Desactivar / Reactivar usuario
  // ==========================
  const handleDesactivar = async (usuario, skipConfirm = false) => {
    if (!skipConfirm) {
      openConfirmModal(usuario);
      return;
    }

    try {
      const response = await desactivarUsuario(usuario.id_usuario);
      if (response.success) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id_usuario === usuario.id_usuario ? { ...u, estado: Number(u.estado) === 1 ? 0 : 1 } : u
          )
        );
        setSuccessMessage(`Usuario ${Number(usuario.estado) === 1 ? "movido a papelera" : "reactivado"} con éxito.`);
      }
    } catch (err) {
      setFetchError(err?.message || "No se pudo cambiar el estado del usuario.");
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
  // Filtrar usuarios activos e inactivos
  // ==========================
  const usuariosActivos = usuarios.filter((u) => Number(u.estado) !== 0);
  const usuariosPapelera = usuarios.filter((u) => Number(u.estado) === 0);

  // ==========================
  // Renderizado principal
  // ==========================
  return (
    <div className="page-section">
      {/* Encabezado con acciones */}
      <div className="heading-row">
        <div>
          <h2>Gestión de Personal y Barberos</h2>
          <p className="page-description"></p>
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

      {/* Mensajes de éxito */}
      {successMessage && <p className="status success">{successMessage}</p>}

      {/* Modal de creación/edición */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        usuarioSeleccionado={usuarioSeleccionado}
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

      {/* Tabla de usuarios */}
      {loading ? (
        <p>Cargando personal...</p>
      ) : fetchError ? (
        <p className="status error">{fetchError}</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol / Puesto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(!mostrarPapelera ? usuariosActivos : usuariosPapelera).length === 0 ? (
                <tr>
                  <td colSpan="5">{mostrarPapelera ? "No hay usuarios en la papelera." : "No hay personal registrado en el sistema."}</td>
                </tr>
              ) : (
                (!mostrarPapelera ? usuariosActivos : usuariosPapelera).map((u) => (
                  <tr key={u.id_usuario}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>{u.telefono}</td>
                    <td><span className="badge">{u.rol}</span></td>
                    <td>
                      <button className="btn-secondary" onClick={() => handleEditar(u)} title="Editar">
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => handleDesactivar(u)}
                        title={mostrarPapelera ? "Reactivar" : "Mover a papelera"}
                        style={{ marginLeft: "0.35rem" }}
                      >
                        <FontAwesomeIcon icon={mostrarPapelera ? faTrashCanArrowUp : Number(u.estado) === 1 ? faToggleOff : faToggleOn} />
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

export default Usuarios;

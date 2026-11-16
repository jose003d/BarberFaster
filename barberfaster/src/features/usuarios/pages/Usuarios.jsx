import { useEffect, useState } from "react";
import { obtenerUsuarios, desactivarUsuario } from "../../../shared/services/api.js";
import { UsuarioModal } from "../components/UsuarioModal.jsx";
import ConfirmModal from "../../../shared/components/ConfirmModal.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faToggleOff, faToggleOn, faTrashCan } from "@fortawesome/free-solid-svg-icons";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarPapelera, setMostrarPapelera] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      setUsuarios(await obtenerUsuarios());
      setFetchError("");
    } catch (error) {
      setFetchError(error.message || "No se pudo cargar el personal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleAgregar = () => {
    setUsuarioSeleccionado(null);
    setIsModalOpen(true);
  };

  const handleEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setIsModalOpen(true);
  };

  const handleModalSuccess = async () => {
    await cargar();
    setSuccessMessage("Los datos del usuario se guardaron correctamente.");
    window.setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDesactivar = async (usuario) => {
    try {
      const response = await desactivarUsuario(usuario.id_usuario);
      setUsuarios((current) => current.map((item) => (
        item.id_usuario === usuario.id_usuario
          ? { ...item, estado: response.estado }
          : item
      )));
      setSuccessMessage("El estado del usuario se actualizó correctamente.");
      setFetchError("");
    } catch (error) {
      setFetchError(error.message || "No se pudo cambiar el estado del usuario.");
    } finally {
      setConfirmModal({ open: false, item: null });
      window.setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const usuariosFiltrados = usuarios.filter((usuario) => (
    mostrarPapelera ? usuario.estado === "INACTIVO" : usuario.estado === "ACTIVO"
  ));

  return (
    <div className="page-section">
      <div className="heading-row">
        <div>
          <h2>Gestión de personal</h2>
          <p className="page-description">Registra y administra los usuarios de tu barbería.</p>
        </div>
        <div className="usuarios-actions">
          <button className="btn-secondary" type="button" onClick={() => setMostrarPapelera((value) => !value)}>
            <FontAwesomeIcon icon={faTrashCan} />
            {mostrarPapelera ? " Ver activos" : " Ver inactivos"}
          </button>
          <button className="btn" type="button" onClick={handleAgregar}>+ Agregar personal</button>
        </div>
      </div>

      {successMessage && <p className="status success" role="status">{successMessage}</p>}

      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        usuarioEditar={usuarioSeleccionado}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        title="Confirmar cambio de estado"
        message={`¿Deseas ${confirmModal.item?.estado === "ACTIVO" ? "desactivar" : "reactivar"} a "${confirmModal.item?.nombre}"?`}
        confirmText="Sí, continuar"
        cancelText="Cancelar"
        onConfirm={() => confirmModal.item && handleDesactivar(confirmModal.item)}
        onCancel={() => setConfirmModal({ open: false, item: null })}
      />

      {loading ? (
        <p role="status">Cargando personal...</p>
      ) : fetchError ? (
        <p className="status error" role="alert">{fetchError}</p>
      ) : (
        <div className="usuarios-table-wrap">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre completo</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="usuarios-empty">
                    {mostrarPapelera ? "No hay usuarios inactivos." : "No hay personal registrado."}
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id_usuario}>
                    <td>{usuario.id_usuario}</td>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.correo}</td>
                    <td>{usuario.telefono || "—"}</td>
                    <td>{usuario.rol}</td>
                    <td>{usuario.estado}</td>
                    <td>
                      <button
                        className="btn-secondary usuarios-icon-button"
                        type="button"
                        onClick={() => handleEditar(usuario)}
                        aria-label={`Editar a ${usuario.nombre}`}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        className="btn-secondary usuarios-icon-button"
                        type="button"
                        onClick={() => setConfirmModal({ open: true, item: usuario })}
                        aria-label={`${usuario.estado === "ACTIVO" ? "Desactivar" : "Reactivar"} a ${usuario.nombre}`}
                      >
                        <FontAwesomeIcon icon={usuario.estado === "ACTIVO" ? faToggleOn : faToggleOff} />
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

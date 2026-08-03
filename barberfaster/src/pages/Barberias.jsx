import { useEffect, useState } from "react";
import { desactivarBarberia, obtenerBarberias } from "../services/api";
import BarberiaModal from "../components/BarberiaModal";
import ConfirmModal from "../components/ConfirmModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faToggleOff, faToggleOn, faTrashCanArrowUp, faTrashCan } from "@fortawesome/free-solid-svg-icons";

function Barberias() {
  // ==========================
  // Estados principales
  // ==========================
  const [barberias, setBarberias]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [barberiaSeleccionada, setBarberiaSeleccionada] = useState(null);
  const [mostrarPapelera, setMostrarPapelera] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null });

  // ==========================
  // Cargar barberías al montar
  // ==========================
  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const data = await obtenerBarberias();
      if (Array.isArray(data)) setBarberias(data);
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
    setBarberiaSeleccionada(null);
    setIsModalOpen(true);
  };

  const openConfirmModal = (barberia) => {
    setConfirmModal({ open: true, item: barberia });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, item: null });
  };

  const handleEditar = (barberia) => {
    setBarberiaSeleccionada(barberia);
    setIsModalOpen(true);
  };

  // ==========================
  // Manejo de éxito en modal
  // ==========================
  const handleModalSuccess = (barberiaData, esEdicion) => {
    if (esEdicion) {
      setBarberias((prev) =>
        prev.map((b) => (b.id_barberia === barberiaData.id_barberia ? barberiaData : b))
      );
      setSuccessMessage("Barbería actualizada con éxito.");
    } else {
      setBarberias((prev) => [barberiaData, ...prev]);
      setSuccessMessage("Barbería registrada con éxito.");
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ==========================
  // Desactivar / Reactivar barbería
  // ==========================
  const handleDesactivar = async (barberia, skipConfirm = false) => {
    if (!skipConfirm) {
      openConfirmModal(barberia);
      return;
    }

    try {
      const response = await desactivarBarberia(barberia.id_barberia);
      if (response.success) {
        setBarberias((prev) =>
          prev.map((b) =>
            b.id_barberia === barberia.id_barberia ? { ...b, estado: Number(b.estado) === 1 ? 0 : 1 } : b
          )
        );
        setSuccessMessage(`Barbería ${Number(barberia.estado) === 1 ? "movida a papelera" : "reactivada"} con éxito.`);
      }
    } catch (err) {
      setFetchError(err?.message || "No se pudo cambiar el estado de la barbería.");
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
  // Filtrar barberías activas e inactivas
  // ==========================
  const barberiasActivas = barberias.filter((b) => Number(b.estado) !== 0);
  const barberiasPapelera = barberias.filter((b) => Number(b.estado) === 0);

  // ==========================
  // Renderizado principal
  // ==========================
  return (
    <div className="page-section">
      {/* Encabezado con acciones */}
      <div className="heading-row">
        <div>
          <h2>Gestión de Barberías</h2>
          <p className="page-description"></p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-secondary" onClick={() => setMostrarPapelera((prev) => !prev)}>
            <FontAwesomeIcon icon={faTrashCan} style={{ marginRight: "0.35rem" }} />
            {mostrarPapelera ? "Ver activas" : "Papelera"}
          </button>
          <button className="btn" onClick={handleAgregar}>
            + Agregar barbería
          </button>
        </div>
      </div>

      {/* Mensajes de éxito */}
      {successMessage && <p className="status success">{successMessage}</p>}

      {/* Modal de creación/edición */}
      <BarberiaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        barberiaSeleccionada={barberiaSeleccionada}
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

      {/* Tabla de barberías */}
      {loading ? (
        <p>Cargando barberías...</p>
      ) : fetchError ? (
        <p className="status error">{fetchError}</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Ciudad</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(!mostrarPapelera ? barberiasActivas : barberiasPapelera).length === 0 ? (
                <tr><td colSpan="7">{mostrarPapelera ? "No hay barberías en la papelera." : "No hay barberías registradas."}</td></tr>
              ) : (
                (!mostrarPapelera ? barberiasActivas : barberiasPapelera).map((b) => (
                  <tr key={b.id_barberia}>
                    <td>
                      {b.fotos ? (
                        <img
                          src={`http://localhost/erpbarber/barberfaster/backend/uploads/${b.fotos}`}
                          alt={b.nombre}
                          style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                        />
                      ) : (
                        <span style={{ color: "#999" }}>Sin foto</span>
                      )}
                    </td>
                    <td>{b.nombre}</td>
                    <td>{b.direccion}</td>
                    <td>{b.ciudad}</td>
                    <td>{b.telefono}</td>
                    <td>
                      <span className="badge">
                        {Number(b.estado) === 1 ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-secondary" onClick={() => handleEditar(b)} title="Editar">
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => handleDesactivar(b)}
                        title={mostrarPapelera ? "Reactivar" : "Mover a papelera"}
                        style={{ marginLeft: "0.35rem" }}
                      >
                        <FontAwesomeIcon icon={mostrarPapelera ? faTrashCanArrowUp : Number(b.estado) === 1 ? faToggleOff : faToggleOn} />
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

export default Barberias;
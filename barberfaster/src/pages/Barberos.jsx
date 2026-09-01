import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from "../components/ConfirmModal";

const BASE_URL = "http://localhost/erpbarber/barberfaster/backend";

function Barberos() {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null });
  const [formData, setFormData] = useState({
    id_usuario: "",
    id_barberia: "",
    especialidad: "",
  });

  useEffect(() => {
    cargarBarberos();
  }, []);

  const cargarBarberos = async () => {
    try {
      const response = await fetch(`${BASE_URL}/barberos/leerb.php`);
      if (!response.ok) throw new Error("No se pudo cargar la lista de barberos.");
      const data = await response.json();

      if (Array.isArray(data)) {
        setBarberos(data);
      } else {
        throw new Error("Formato de datos inesperado.");
      }
    } catch (error) {
      setFetchError(error?.message || "No hay conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ id_usuario: "", id_barberia: "", especialidad: "" });
  };

  const handleAgregar = () => {
    setBarberoSeleccionado(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditar = (barbero) => {
    setBarberoSeleccionado(barbero);
    setFormData({
      id_usuario: barbero.id_usuario ?? "",
      id_barberia: barbero.id_barberia ?? "",
      especialidad: barbero.especialidad ?? "",
    });
    setIsModalOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, item: null });
  };

  const guardarBarbero = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...formData,
        id_usuario: Number(formData.id_usuario),
        id_barberia: Number(formData.id_barberia),
      };

      const url = barberoSeleccionado
        ? `${BASE_URL}/barberos/actualizarb.php`
        : `${BASE_URL}/barberos/crearb.php`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          barberoSeleccionado
            ? { ...payload, id_barbero: barberoSeleccionado.id_barbero }
            : payload
        ),
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "No se pudo guardar el barbero.");
      }

      if (barberoSeleccionado) {
        setBarberos((prev) =>
          prev.map((b) =>
            b.id_barbero === barberoSeleccionado.id_barbero
              ? { ...b, ...payload, especialidad: payload.especialidad }
              : b
          )
        );
        setSuccessMessage("Barbero actualizado con éxito.");
      } else {
        const nuevo = {
          ...payload,
          id_barbero: data.id_barbero,
          usuario: `Usuario ${payload.id_usuario}`,
          barberia: `Barbería ${payload.id_barberia}`,
        };
        setBarberos((prev) => [nuevo, ...prev]);
        setSuccessMessage("Barbero registrado con éxito.");
      }

      setIsModalOpen(false);
      setBarberoSeleccionado(null);
      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setFetchError(error?.message || "No se pudo guardar el barbero.");
    }
  };

  const confirmarEliminar = () => {
    if (confirmModal.item) {
      eliminarBarbero(confirmModal.item.id_barbero);
      closeConfirmModal();
    }
  };

  const eliminarBarbero = async (id_barbero) => {
    try {
      const response = await fetch(`${BASE_URL}/barberos/eliminarb.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_barbero }),
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "No se pudo eliminar el barbero.");
      }

      setBarberos((prev) => prev.filter((b) => b.id_barbero !== id_barbero));
      setSuccessMessage("Barbero eliminado con éxito.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setFetchError(error?.message || "No se pudo eliminar el barbero.");
    }
  };

  return (
    <div className="page-section">
      <div className="heading-row">
        <div>
          <h2>Gestión de Barberos</h2>
          <p className="page-description"></p>
        </div>
        <button className="btn" onClick={handleAgregar}>
          + Agregar barbero
        </button>
      </div>

      {successMessage && <p className="status success">{successMessage}</p>}

      <ConfirmModal
        isOpen={confirmModal.open}
        title="Confirmar eliminación"
        message="¿Estás seguro de eliminar este barbero?"
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={confirmarEliminar}
        onCancel={closeConfirmModal}
      />

      {isModalOpen && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{barberoSeleccionado ? "Editar barbero" : "Crear barbero"}</h3>
              <button
                aria-label="Cerrar"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarBarbero} style={{ marginTop: 20 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>ID Usuario</label>
                  <input
                    type="number"
                    value={formData.id_usuario}
                    onChange={(e) => setFormData({ ...formData, id_usuario: e.target.value })}
                    placeholder="Ej: 5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>ID Barbería</label>
                  <input
                    type="number"
                    value={formData.id_barberia}
                    onChange={(e) => setFormData({ ...formData, id_barberia: e.target.value })}
                    placeholder="Ej: 1"
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Especialidad</label>
                  <input
                    type="text"
                    value={formData.especialidad}
                    onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                    placeholder="Ej: Corte clásico"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn">
                  {barberoSeleccionado ? "Guardar cambios" : "Crear barbero"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Cargando barberos...</p>
      ) : fetchError ? (
        <p className="status error">{fetchError}</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Barbería</th>
                <th>Especialidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {barberos.length === 0 ? (
                <tr>
                  <td colSpan="5">No hay barberos registrados.</td>
                </tr>
              ) : (
                barberos.map((b) => (
                  <tr key={b.id_barbero}>
                    <td>{b.id_barbero}</td>
                    <td>{b.usuario || `Usuario ${b.id_usuario}`}</td>
                    <td>{b.barberia || `Barbería ${b.id_barberia}`}</td>
                    <td>{b.especialidad || "Sin especialidad"}</td>
                    <td>
                      <button className="btn-secondary" onClick={() => handleEditar(b)} title="Editar">
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => setConfirmModal({ open: true, item: b })}
                        title="Eliminar"
                        style={{ marginLeft: "0.35rem" }}
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
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

export default Barberos;

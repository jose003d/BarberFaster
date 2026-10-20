import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan, faScissors, faPlus, faBan } from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from "../components/ConfirmModal";
import { desactivarServicio } from "../services/api";
import "./Barberos.css";

const BASE_URL = "/erpbarber/barberfaster/backend";

function BarberosModal({ title, onClose, children }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="barberos-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="barberos-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="barberos-modal-header">
          <h3>{title}</h3>
          <button type="button" className="barberos-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

// Gestiona barberos y catálogo de servicios para la barbería activa.
function Barberos() {
  // Mantiene datos, formularios, asignaciones y estado de los diferentes modales.
  const [barberos, setBarberos] = useState([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modales
  const [isModalBarberoOpen, setIsModalBarberoOpen] = useState(false);
  const [isModalServicioOpen, setIsModalServicioOpen] = useState(false);
  const [modalGestion, setModalGestion] = useState(null); // 'servicios'

  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null });

  // Formularios
  const [formBarbero, setFormBarbero] = useState({ nombre: "", especialidad: "" });
  const [formServicio, setFormServicio] = useState({ nombre: "", precio: "", duracion_minutos: 30, descripcion: "" });

  // Obtiene los registros del local activo al entrar al módulo.
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Resuelve el local seleccionado por la sesión administrativa demo.
  const obtenerBarberiaActivaId = () => {
    try {
      const stored = localStorage.getItem("barberia_demo_admin");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.id_barberia || parsed.id || 1;
      }
    } catch (e) {
      const raw = localStorage.getItem("barberia_demo_admin");
      if (raw && !isNaN(raw)) return Number(raw);
    }
    return 1;
  };

  // Carga barberos y catálogo para refrescar las dos tablas del módulo.
  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const idBarberia = obtenerBarberiaActivaId();

      // 1. Cargar Barberos
      const resBarberos = await fetch(`${BASE_URL}/barberos/listar_barberos.php?id_barberia=${idBarberia}`);
      const dataBarberos = await resBarberos.json();
      setBarberos(Array.isArray(dataBarberos) ? dataBarberos : (dataBarberos.barberos || dataBarberos.datos || []));

      // 2. Cargar Catálogo General de Servicios
      const resServicios = await fetch(`${BASE_URL}/servicios/listars.php?id_barberia=${idBarberia}`);
      const dataServicios = await resServicios.json();

      const listaServicios = Array.isArray(dataServicios) 
        ? dataServicios 
        : (dataServicios.datos || dataServicios.servicios || []);

      setServiciosCatalogo(listaServicios);
      setFetchError(null);
    } catch (error) {
      setFetchError(error?.message || "No hay conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  // --- GESTIÓN DE BARBEROS ---
  const guardarBarbero = async (e) => {
    e.preventDefault();
    setFetchError(null);
    try {
      const activeId = obtenerBarberiaActivaId();
      const payload = { ...formBarbero, id_barberia: activeId };
      const url = barberoSeleccionado ? `${BASE_URL}/barberos/actualizarb.php` : `${BASE_URL}/barberos/crearb.php`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(barberoSeleccionado ? { ...payload, id_barbero: barberoSeleccionado.id_barbero } : payload),
      });

      const data = await response.json();
      if (!response.ok || data?.status === "error") throw new Error(data?.mensaje || "Error al guardar el barbero.");

      await cargarDatosIniciales();
      setSuccessMessage(barberoSeleccionado ? "Barbero actualizado con éxito." : "Barbero creado con éxito.");
      setIsModalBarberoOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setFetchError(error.message);
    }
  };

  const confirmarEliminarBarbero = () => {
    if (confirmModal.item) {
      eliminarBarbero(confirmModal.item.id_barbero);
      setConfirmModal({ open: false, item: null });
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
      if (!response.ok || data?.status === "error") throw new Error(data?.mensaje || "No se pudo eliminar.");
      setBarberos((prev) => prev.filter((b) => b.id_barbero !== id_barbero));
      setSuccessMessage("Barbero eliminado con éxito.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setFetchError(error.message);
    }
  };

  // --- GESTIÓN DE CREACIÓN / EDICIÓN DE SERVICIOS (CATÁLOGO) ---
  const abrirServicioModal = (servicio = null) => {
    if (servicio) {
      setFormServicio({
        id_servicio: servicio.id_servicio,
        nombre: servicio.nombre || "",
        precio: servicio.precio ?? "",
        duracion_minutos: servicio.duracion_minutos ?? 30,
        descripcion: servicio.descripcion || ""
      });
    } else {
      setFormServicio({ nombre: "", precio: "", duracion_minutos: 30, descripcion: "" });
    }
    setFetchError(null);
    setIsModalServicioOpen(true);
  };

  const guardarServicioCatalogo = async (e) => {
    e.preventDefault();
    setFetchError(null);
    try {
      const activeId = obtenerBarberiaActivaId();
      const payload = {
        ...formServicio,
        id_barberia: activeId,
        precio: Number(formServicio.precio),
        duracion_minutos: Number(formServicio.duracion_minutos)
      };

      const isEditing = Boolean(formServicio.id_servicio);
      const url = isEditing ? `${BASE_URL}/servicios/editars.php` : `${BASE_URL}/servicios/crears.php`;
      const body = isEditing ? { ...payload, id_servicio: formServicio.id_servicio } : payload;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.status === "error") throw new Error(data.mensaje || (isEditing ? "No se pudo actualizar el servicio." : "No se pudo crear el servicio."));

      setSuccessMessage(isEditing ? "Servicio actualizado con éxito." : "Nuevo servicio agregado al catálogo con éxito.");
      setFormServicio({ nombre: "", precio: "", duracion_minutos: 30, descripcion: "" });
      setIsModalServicioOpen(false);
      await cargarDatosIniciales();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setFetchError(error.message);
    }
  };

  const desactivarServicioCatalogo = async (servicio) => {
    if (!servicio?.id_servicio) return;
    setFetchError(null);
    try {
      const response = await desactivarServicio(servicio.id_servicio, "INACTIVO");
      if (response && response.status === "error") {
        throw new Error(response.mensaje || "No se pudo desactivar el servicio.");
      }
      setSuccessMessage("Servicio desactivado con éxito.");
      await cargarDatosIniciales();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setFetchError(error.message);
    }
  };

  // --- ASIGNACIÓN DE SERVICIOS POR CASILLAS (CHECKBOXES) ---
  const abrirGestionServicios = async (barbero) => {
    setBarberoSeleccionado(barbero);
    setModalGestion("servicios");
    setFetchError(null);
    try {
      const resAsignados = await fetch(`${BASE_URL}/barberos/asignar_servicios.php?id_barbero=${barbero.id_barbero}`);
      const dataAsignados = await resAsignados.json();
      setServiciosSeleccionados(dataAsignados.servicios || []);
    } catch (e) {
      setServiciosSeleccionados([]);
    }
  };

  const guardarAsignacionesServicios = async () => {
    setFetchError(null);
    try {
      const res = await fetch(`${BASE_URL}/barberos/asignar_servicios.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_barbero: barberoSeleccionado.id_barbero,
          servicios_ids: serviciosSeleccionados
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setSuccessMessage("Servicios asignados al barbero con éxito.");
        setModalGestion(null);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.mensaje || "Error al actualizar asignaciones.");
      }
    } catch (error) {
      setFetchError(error.message);
    }
  };

  // Presenta las tablas de gestión y los formularios modales asociados.
  return (
    <div className="page-section">
      {successMessage && <p className="status success">{successMessage}</p>}
      {fetchError && !isModalBarberoOpen && !isModalServicioOpen && modalGestion !== "servicios" && (
        <p className="status error">{fetchError}</p>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        title="Confirmar eliminación"
        message="¿Estás seguro de eliminar este barbero?"
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={confirmarEliminarBarbero}
        onCancel={() => setConfirmModal({ open: false, item: null })}
      />

      {/* SECCIÓN 1: TABLA DE BARBEROS */}
      <div className="heading-row" style={{ marginTop: "10px" }}>
        <div>
          <h2>Gestión de Personal</h2>
          <p className="page-description">Barberos registrados en este local.</p>
        </div>
        <button className="btn" onClick={() => { setBarberoSeleccionado(null); setFormBarbero({ nombre: "", especialidad: "" }); setIsModalBarberoOpen(true); }}>
          + Agregar barbero
        </button>
      </div>

      <div className="table-wrapper" style={{ marginBottom: "40px" }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Especialidad</th>
              <th>Acciones de Gestión</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4">Cargando datos...</td></tr>
            ) : barberos.length === 0 ? (
              <tr><td colSpan="4">No hay barberos registrados.</td></tr>
            ) : (
              barberos.map((b) => (
                <tr key={b.id_barbero}>
                  <td>{b.id_barbero}</td>
                  <td>{b.nombre}</td>
                  <td>{b.especialidad || "Sin especialidad"}</td>
                  <td className="table-actions-cell">
                    <div className="table-actions">
                    <button className="btn-secondary" onClick={() => abrirGestionServicios(b)} title="Asignar Servicios del Catálogo">
                      <FontAwesomeIcon icon={faScissors} /> Servicios
                    </button>
                    <button className="btn-secondary table-action-icon" onClick={() => { setBarberoSeleccionado(b); setFormBarbero({ nombre: b.nombre, especialidad: b.especialidad }); setIsModalBarberoOpen(true); }} title="Editar Barbero">
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                    <button className="btn-secondary table-action-icon" onClick={() => setConfirmModal({ open: true, item: b })} title="Eliminar Barbero">
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SECCIÓN 2: TABLA DEL CATÁLOGO DE SERVICIOS */}
      <div className="heading-row">
        <div>
          <h2>Catálogo de Servicios Generales</h2>
          <p className="page-description">Servicios disponibles para ser asignados a los barberos.</p>
        </div>
        <button className="btn" onClick={() => abrirServicioModal()}>
          <FontAwesomeIcon icon={faPlus} /> Crear servicio
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Servicio</th>
              <th>Precio</th>
              <th>Duración</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">Cargando catálogo...</td></tr>
            ) : serviciosCatalogo.length === 0 ? (
              <tr><td colSpan="5">No hay servicios registrados en el catálogo.</td></tr>
            ) : (
              serviciosCatalogo.map((s) => (
                <tr key={s.id_servicio}>
                  <td>{s.id_servicio}</td>
                  <td><strong>{s.nombre}</strong></td>
                  <td>${s.precio}</td>
                  <td>{s.duracion_minutos} min</td>
                  <td className="table-actions-cell">
                    <div className="table-actions table-actions--wide">
                      <button className="btn-secondary" type="button" onClick={() => abrirServicioModal(s)} title="Editar servicio">
                        <FontAwesomeIcon icon={faPenToSquare} /> Editar
                      </button>
                      <button className="btn-secondary" type="button" onClick={() => desactivarServicioCatalogo(s)} title="Desactivar servicio">
                        <FontAwesomeIcon icon={faBan} /> Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: REGISTRAR / EDITAR BARBERO */}
      {isModalBarberoOpen && (
        <BarberosModal
          title={barberoSeleccionado ? "Editar Barbero" : "Registrar Barbero"}
          onClose={() => setIsModalBarberoOpen(false)}
        >
          {fetchError && <p className="status error">{fetchError}</p>}
          <form onSubmit={guardarBarbero}>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label>Nombre:</label>
              <input type="text" value={formBarbero.nombre} onChange={(e) => setFormBarbero({ ...formBarbero, nombre: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label>Especialidad:</label>
              <input type="text" value={formBarbero.especialidad} onChange={(e) => setFormBarbero({ ...formBarbero, especialidad: e.target.value })} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="btn-secondary" onClick={() => setIsModalBarberoOpen(false)}>Cancelar</button>
              <button type="submit" className="btn">Guardar Barbero</button>
            </div>
          </form>
        </BarberosModal>
      )}

      {/* MODAL 2: CREAR SERVICIO PARA EL CATÁLOGO */}
      {isModalServicioOpen && (
        <BarberosModal
          title={formServicio.id_servicio ? "Editar Servicio del Catálogo" : "Nuevo Servicio para el Catálogo"}
          onClose={() => setIsModalServicioOpen(false)}
        >
          {fetchError && <p className="status error">{fetchError}</p>}
          <form onSubmit={guardarServicioCatalogo}>
            <div className="barberos-service-form-grid">
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--bauhaus-ink)" }}>Nombre del Servicio</label>
                <input type="text" value={formServicio.nombre} onChange={(e) => setFormServicio({ ...formServicio, nombre: e.target.value })} placeholder="Ej. Corte y Barba" required style={{ width: "100%", padding: "8px", background: "#fff", border: "1px solid var(--bauhaus-gray)", color: "var(--bauhaus-ink)", borderRadius: "2px" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--bauhaus-ink)" }}>Precio ($)</label>
                <input type="number" value={formServicio.precio} onChange={(e) => setFormServicio({ ...formServicio, precio: e.target.value })} required style={{ width: "100%", padding: "8px", background: "#fff", border: "1px solid var(--bauhaus-gray)", color: "var(--bauhaus-ink)", borderRadius: "2px" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--bauhaus-ink)" }}>Duración (min)</label>
                <input type="number" value={formServicio.duracion_minutos} onChange={(e) => setFormServicio({ ...formServicio, duracion_minutos: e.target.value })} required style={{ width: "100%", padding: "8px", background: "#fff", border: "1px solid var(--bauhaus-gray)", color: "var(--bauhaus-ink)", borderRadius: "2px" }} />
              </div>
            </div>
            <div className="barberos-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsModalServicioOpen(false)}>Cancelar</button>
              <button type="submit" className="btn">{formServicio.id_servicio ? "Guardar cambios" : "Guardar en Catálogo"}</button>
            </div>
          </form>
        </BarberosModal>
      )}

      {/* MODAL 3: ASIGNAR SERVICIOS A BARBERO (CHECKBOXES) */}
      {modalGestion === "servicios" && barberoSeleccionado && (
        <BarberosModal
          title={`Asignar servicios a ${barberoSeleccionado.nombre}`}
          onClose={() => setModalGestion(null)}
        >
          {fetchError && <p className="status error">{fetchError}</p>}
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Marca las casillas de los servicios que este barbero puede realizar:</p>
          <div className="barberos-assignment-grid">
            {serviciosCatalogo.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No hay servicios en el catálogo para asignar.</p>
            ) : (
              serviciosCatalogo.map((serv) => {
                const estaAsignado = serviciosSeleccionados.includes(serv.id_servicio);
                return (
                  <label key={serv.id_servicio} className={`barberos-assignment-option${estaAsignado ? " is-selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={estaAsignado}
                      onChange={(e) => {
                        if (e.target.checked) setServiciosSeleccionados([...serviciosSeleccionados, serv.id_servicio]);
                        else setServiciosSeleccionados(serviciosSeleccionados.filter(id => id !== serv.id_servicio));
                      }}
                    />
                    <div className="barberos-assignment-details">
                      <strong>{serv.nombre}</strong>
                      <div>${serv.precio} · {serv.duracion_minutos} min</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
          <div className="barberos-modal-actions">
            <button className="btn-secondary" onClick={() => setModalGestion(null)}>Cancelar</button>
            <button className="btn" onClick={guardarAsignacionesServicios}>Guardar Asignaciones</button>
          </div>
        </BarberosModal>
      )}
    </div>
  );
}

export default Barberos;
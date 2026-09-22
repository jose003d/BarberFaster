import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan, faScissors, faPlus } from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from "../components/ConfirmModal";

const BASE_URL = "/erpbarber/barberfaster/backend";

function Barberos() {
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

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

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

  // --- GESTIÓN DE CREACIÓN DE SERVICIOS (CATÁLOGO) ---
  const crearServicioCatalogo = async (e) => {
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

      const res = await fetch(`${BASE_URL}/servicios/crears.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === "error") throw new Error(data.mensaje || "No se pudo crear el servicio.");

      setSuccessMessage("Nuevo servicio agregado al catálogo con éxito.");
      setFormServicio({ nombre: "", precio: "", duracion_minutos: 30, descripcion: "" });
      setIsModalServicioOpen(false);
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

  return (
    <div className="page-section">
      {successMessage && <p className="status success">{successMessage}</p>}
      {fetchError && <p className="status error">{fetchError}</p>}

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
                  <td style={{ display: "flex", gap: "6px" }}>
                    <button className="btn-secondary" onClick={() => abrirGestionServicios(b)} title="Asignar Servicios del Catálogo">
                      <FontAwesomeIcon icon={faScissors} /> Servicios
                    </button>
                    <button className="btn-secondary" onClick={() => { setBarberoSeleccionado(b); setFormBarbero({ nombre: b.nombre, especialidad: b.especialidad }); setIsModalBarberoOpen(true); }} title="Editar Barbero">
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                    <button className="btn-secondary" onClick={() => setConfirmModal({ open: true, item: b })} title="Eliminar Barbero">
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
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
        <button className="btn" style={{ background: "#d4af37", color: "#111", fontWeight: "bold" }} onClick={() => setIsModalServicioOpen(true)}>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4">Cargando catálogo...</td></tr>
            ) : serviciosCatalogo.length === 0 ? (
              <tr><td colSpan="4">No hay servicios registrados en el catálogo.</td></tr>
            ) : (
              serviciosCatalogo.map((s) => (
                <tr key={s.id_servicio}>
                  <td>{s.id_servicio}</td>
                  <td><strong>{s.nombre}</strong></td>
                  <td>${s.precio}</td>
                  <td>{s.duracion_minutos} min</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: REGISTRAR / EDITAR BARBERO */}
      {isModalBarberoOpen && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "24px", margin: "20px 0", boxShadow: "0 8px 18px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0 }}>{barberoSeleccionado ? "Editar Barbero" : "Registrar Barbero"}</h3>
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
        </div>
      )}

      {/* MODAL 2: CREAR SERVICIO PARA EL CATÁLOGO */}
      {isModalServicioOpen && (
        <div style={{ background: "#1e1e1e", color: "#fff", border: "1px solid #333", borderRadius: "16px", padding: "24px", margin: "20px 0" }}>
          <h3 style={{ color: "#d4af37", marginTop: 0 }}>Nuevo Servicio para el Catálogo</h3>
          <form onSubmit={crearServicioCatalogo}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Nombre del Servicio</label>
                <input type="text" value={formServicio.nombre} onChange={(e) => setFormServicio({ ...formServicio, nombre: e.target.value })} placeholder="Ej. Corte y Barba" required style={{ width: "100%", padding: "8px", background: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "6px" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Precio ($)</label>
                <input type="number" value={formServicio.precio} onChange={(e) => setFormServicio({ ...formServicio, precio: e.target.value })} required style={{ width: "100%", padding: "8px", background: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "6px" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Duración (min)</label>
                <input type="number" value={formServicio.duracion_minutos} onChange={(e) => setFormServicio({ ...formServicio, duracion_minutos: e.target.value })} required style={{ width: "100%", padding: "8px", background: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "6px" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="btn-secondary" onClick={() => setIsModalServicioOpen(false)}>Cancelar</button>
              <button type="submit" className="btn" style={{ background: "#d4af37", color: "#111", fontWeight: "bold" }}>Guardar en Catálogo</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: ASIGNAR SERVICIOS A BARBERO (CHECKBOXES) */}
      {modalGestion === "servicios" && barberoSeleccionado && (
        <div style={{ background: "#1e1e1e", color: "#fff", border: "1px solid #333", borderRadius: "16px", padding: "24px", margin: "20px 0" }}>
          <h3 style={{ color: "#d4af37", marginTop: 0 }}>Asignar Servicios a {barberoSeleccionado.nombre}</h3>
          <p style={{ color: "#aaa", fontSize: "0.9rem" }}>Marca las casillas de los servicios que este barbero puede realizar:</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px", margin: "20px 0" }}>
            {serviciosCatalogo.length === 0 ? (
              <p style={{ color: "#888" }}>No hay servicios en el catálogo para asignar.</p>
            ) : (
              serviciosCatalogo.map((serv) => {
                const estaAsignado = serviciosSeleccionados.includes(serv.id_servicio);
                return (
                  <label key={serv.id_servicio} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#2a2a2a", borderRadius: "8px", cursor: "pointer", border: estaAsignado ? "1px solid #d4af37" : "1px solid #444" }}>
                    <input
                      type="checkbox"
                      checked={estaAsignado}
                      onChange={(e) => {
                        if (e.target.checked) setServiciosSeleccionados([...serviciosSeleccionados, serv.id_servicio]);
                        else setServiciosSeleccionados(serviciosSeleccionados.filter(id => id !== serv.id_servicio));
                      }}
                    />
                    <div>
                      <strong>{serv.nombre}</strong>
                      <div style={{ fontSize: "0.8rem", color: "#888" }}>${serv.precio} · {serv.duracion_minutos} min</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button className="btn-secondary" onClick={() => setModalGestion(null)}>Cancelar</button>
            <button className="btn" style={{ background: "#d4af37", color: "#111", fontWeight: "bold" }} onClick={guardarAsignacionesServicios}>Guardar Asignaciones</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Barberos;
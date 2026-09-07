import { useEffect, useState } from "react";
import { crearServicio, desactivarServicio, obtenerBarberias, obtenerServicios } from "../services/api";

function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [barberias, setBarberias] = useState([]);
  const [form, setForm] = useState({ id_barberia: "", nombre: "", precio: "", duracion_minutos: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const cargar = async () => {
    try {
      const [serviciosData, barberiasData] = await Promise.all([obtenerServicios(), obtenerBarberias()]);
      setServicios(serviciosData);
      setBarberias(barberiasData.filter((barberia) => Number(barberia.estado) !== 0));
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (event) => {
    event.preventDefault();
    try {
      await crearServicio({
        ...form,
        id_barberia: Number(form.id_barberia),
        precio: Number(form.precio),
        duracion_minutos: Number(form.duracion_minutos),
      });
      setForm({ id_barberia: "", nombre: "", precio: "", duracion_minutos: 30 });
      setMensaje("Servicio creado correctamente.");
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo crear el servicio.");
    }
  };

  const cambiarEstado = async (servicio) => {
    try {
      await desactivarServicio(servicio.id_servicio);
      setServicios((actuales) => actuales.map((item) => item.id_servicio === servicio.id_servicio
        ? { ...item, activo: Number(item.activo) === 1 ? 0 : 1 }
        : item));
      setMensaje("Estado del servicio actualizado.");
    } catch (err) {
      setError(err.message || "No se pudo actualizar el servicio.");
    }
  };

  return (
    <div className="page-section">
      <div className="heading-row">
        <div>
          <h2>Servicios</h2>
          <p className="page-description">Cada servicio pertenece a una barbería mediante una llave foránea.</p>
        </div>
      </div>

      {mensaje && <p className="status success">{mensaje}</p>}
      {error && <p className="status error">{error}</p>}

      <section className="panel">
        <h3>Registrar servicio</h3>
        <form className="form-grid" onSubmit={guardar}>
          <div className="form-group">
            <label htmlFor="servicio-barberia">Barbería</label>
            <select id="servicio-barberia" value={form.id_barberia} onChange={(e) => setForm({ ...form, id_barberia: e.target.value })} required>
              <option value="">Selecciona una barbería</option>
              {barberias.map((barberia) => <option key={barberia.id_barberia} value={barberia.id_barberia}>{barberia.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="servicio-nombre">Nombre</label>
            <input id="servicio-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="form-group">
            <label htmlFor="servicio-precio">Precio</label>
            <input id="servicio-precio" type="number" min="0" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
          </div>
          <div className="form-group">
            <label htmlFor="servicio-duracion">Duración (minutos)</label>
            <input id="servicio-duracion" type="number" min="1" value={form.duracion_minutos} onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })} required />
          </div>
          <div className="modal-actions" style={{ gridColumn: "1 / -1" }}>
            <button className="btn" type="submit">Guardar servicio</button>
          </div>
        </form>
      </section>

      {loading ? <p>Cargando servicios...</p> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Servicio</th><th>Barbería</th><th>Precio</th><th>Duración</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {servicios.length === 0 ? <tr><td colSpan="6">No hay servicios registrados.</td></tr> : servicios.map((servicio) => (
                <tr key={servicio.id_servicio}>
                  <td>{servicio.nombre}</td>
                  <td>{servicio.nombre_barberia}</td>
                  <td>${Number(servicio.precio).toLocaleString("es-CO")}</td>
                  <td>{servicio.duracion_minutos} min</td>
                  <td><span className="badge">{Number(servicio.activo) === 1 ? "Activo" : "Inactivo"}</span></td>
                  <td><button className="btn-secondary" type="button" onClick={() => cambiarEstado(servicio)}>{Number(servicio.activo) === 1 ? "Desactivar" : "Activar"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Servicios;

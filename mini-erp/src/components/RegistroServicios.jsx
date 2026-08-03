import { useState, useEffect } from "react";
import { crearServicio, editarServicio, obtenerBarberias } from "../services/api";

function ServicioModal({ servicioSeleccionado, onServicioGuardado }) {
  const [form, setForm] = useState({
    id_servicio: null, id_barberia: "", nombre: "", descripcion: "", precio: "", duracion_minutos: "", activo: true
  });
  const [error, setError] = useState(null);
  const [barberias, setBarberias] = useState([]);

  useEffect(() => { obtenerBarberias().then(setBarberias).catch(console.error); }, []);

  useEffect(() => {
    if (servicioSeleccionado) {
      setForm({ ...servicioSeleccionado, activo: servicioSeleccionado.activo == 1 });
    }
  }, [servicioSeleccionado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async () => {
    if (!form.id_barberia) { setError("Selecciona una barbería"); return; }
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }
    if (!form.precio || parseFloat(form.precio) <= 0) { setError("Precio inválido"); return; }

    try {
      const datosAEnviar = {
        ...form,
        id_barberia: parseInt(form.id_barberia, 10),
        precio: parseFloat(form.precio),
        duracion_minutos: parseInt(form.duracion_minutos, 10),
        activo: form.activo ? 1 : 0
      };

      let res = form.id_servicio ? await editarServicio(datosAEnviar) : await crearServicio(datosAEnviar);

      if (!res.success) { setError(res.message); return; }

      setError(null); onServicioGuardado(); document.getElementById("cerrarModalServicio").click();
      setForm({ id_servicio: null, id_barberia: "", nombre: "", descripcion: "", precio: "", duracion_minutos: "", activo: true });
    } catch (err) { setError("Error al conectar con el servidor."); }
  };

  return (
    <div className="modal fade" id="servicioModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{form.id_servicio ? "Editar Servicio" : "Nuevo Servicio"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModalServicio"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <label className="form-label">Barbería *</label>
            <select className="form-control mb-3" name="id_barberia" value={form.id_barberia} onChange={handleChange}>
              <option value="">-- Seleccione --</option>
              {barberias.map((b) => <option key={b.id_barberia} value={b.id_barberia}>{b.nombre}</option>)}
            </select>
            <label className="form-label">Nombre *</label>
            <input type="text" className="form-control mb-3" name="nombre" value={form.nombre} onChange={handleChange} />
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Precio ($) *</label>
                <input type="number" step="0.01" className="form-control" name="precio" value={form.precio} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Duración (Min) *</label>
                <input type="number" className="form-control" name="duracion_minutos" value={form.duracion_minutos} onChange={handleChange} />
              </div>
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" name="activo" id="checkActivo" checked={form.activo} onChange={handleChange} />
              <label className="form-check-label" htmlFor="checkActivo">Servicio Activo</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ServicioModal;
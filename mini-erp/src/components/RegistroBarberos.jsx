import { useState, useEffect } from "react";
import { crearBarbero, obtenerBarberias } from "../services/api";

function BarberoModal({ onBarberoCreado }) {
  const [form, setForm] = useState({
    id_barberia: "",
    nombre: "",
    especialidad: "",
    presentacion: "",
    telefono: "",
  });
  const [error, setError] = useState(null);
  const [barberias, setBarberias] = useState([]);

  useEffect(() => {
    obtenerBarberias().then(setBarberias).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.id_barberia) { setError("Selecciona una barbería"); return; }
    
    const obligatorios = ["nombre", "especialidad", "presentacion", "telefono"];
    for (let campo of obligatorios) {
      if (!form[campo].trim()) {
        setError(`El campo ${campo} es obligatorio`);
        return;
      }
    }

    try {
      const datosAEnviar = {
        ...form,
        id_barberia: parseInt(form.id_barberia, 10),
      };

      const res = await crearBarbero(datosAEnviar);
      if (!res.success) { setError(res.message); return; }

      setError(null);
      setForm({ id_barberia: "", nombre: "", especialidad: "", presentacion: "", telefono: "" });
      onBarberoCreado();
      document.getElementById("cerrarModalBarbero").click();
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="modal fade" id="barberoModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Nuevo Barbero</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModalBarbero"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <label className="form-label">Barbería Asignada *</label>
            <select className="form-control mb-3" name="id_barberia" onChange={handleChange} value={form.id_barberia}>
              <option value="">-- Seleccione una barbería --</option>
              {barberias.map((b) => (
                <option key={b.id_barberia} value={b.id_barberia}>{b.nombre} - {b.ciudad}</option>
              ))}
            </select>

            <label className="form-label">Nombre Completo *</label>
            <input type="text" className="form-control mb-3" name="nombre" onChange={handleChange} value={form.nombre} placeholder="Ej. Pedro Martínez" />

            <label className="form-label">Especialidad *</label>
            <input type="text" className="form-control mb-3" name="especialidad" onChange={handleChange} value={form.especialidad} placeholder="Ej. Cortes clásicos, Barbas..." />

            <label className="form-label">Presentación *</label>
            <textarea className="form-control mb-3" rows="3" name="presentacion" onChange={handleChange} value={form.presentacion} placeholder="Breve descripción suya y su experiencia..."></textarea>

            <label className="form-label">Teléfono de Contacto *</label>
            <input type="text" className="form-control" name="telefono" onChange={handleChange} value={form.telefono} placeholder="Ej. 3112222222" />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Guardar Barbero</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarberoModal;
import { useState, useEffect } from "react";
import { crearBarberia, editarBarberia } from "../services/api";

function BarberiaModal({ barberiaSeleccionada, onBarberiaGuardada }) {
  const [form, setForm] = useState({
    id_barberia: null, nombre: "", descripcion: "", direccion: "", ciudad: "",
    latitud: "", longitud: "", telefono_barberia: "", estado: "Activo",
    contacto_representante: "", nombre_representante: ""
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (barberiaSeleccionada) setForm(barberiaSeleccionada);
  }, [barberiaSeleccionada]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    const obligatorios = ["nombre", "direccion", "ciudad", "contacto_representante", "nombre_representante"];
    for (let campo of obligatorios) {
      if (!form[campo].trim()) { setError(`El campo ${campo} es obligatorio`); return; }
    }

    try {
      const datosAEnviar = {
        ...form,
        latitud: form.latitud ? parseFloat(form.latitud) : null,
        longitud: form.longitud ? parseFloat(form.longitud) : null,
        telefono_barberia: form.telefono_barberia || null,
        descripcion: form.descripcion || null,
      };

      let res = form.id_barberia ? await editarBarberia(datosAEnviar) : await crearBarberia(datosAEnviar);

      if (!res.success) { setError(res.message); return; }

      setError(null); onBarberiaGuardada(); document.getElementById("cerrarModalBarberia").click();
      setForm({ id_barberia: null, nombre: "", descripcion: "", direccion: "", ciudad: "", latitud: "", longitud: "", telefono_barberia: "", estado: "Activo", contacto_representante: "", nombre_representante: "" });
    } catch (err) { setError("Error al conectar con el servidor."); }
  };

  return (
    <div className="modal fade" id="barberiaModal" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{form.id_barberia ? "Editar Barbería" : "Nueva Barbería"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModalBarberia"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nombre *</label>
                <input type="text" className="form-control" name="nombre" value={form.nombre} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Ciudad *</label>
                <input type="text" className="form-control" name="ciudad" value={form.ciudad} onChange={handleChange} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Dirección *</label>
              <input type="text" className="form-control" name="direccion" value={form.direccion} onChange={handleChange} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Teléfono</label>
                <input type="text" className="form-control" name="telefono_barberia" value={form.telefono_barberia} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Estado</label>
                <select className="form-select" name="estado" value={form.estado} onChange={handleChange}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nombre Representante *</label>
                <input type="text" className="form-control" name="nombre_representante" value={form.nombre_representante} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Contacto Representante *</label>
                <input type="text" className="form-control" name="contacto_representante" value={form.contacto_representante} onChange={handleChange} />
              </div>
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
export default BarberiaModal;
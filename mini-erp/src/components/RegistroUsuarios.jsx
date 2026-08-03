import { useState, useEffect } from "react";
import { crearUsuario, editarUsuario } from "../services/api";

function UsuarioModal({ usuarioSeleccionado, onUsuarioGuardado }) {
  const [form, setForm] = useState({
    id_usuario: null, nombre: "", email: "", password_hash: "", telefono: "", rol: "", documento: ""
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (usuarioSeleccionado) {
      setForm({ ...usuarioSeleccionado, password_hash: "" });
    }
  }, [usuarioSeleccionado]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    const obligatorios = ["nombre", "email", "rol", "documento"];
    if (!form.id_usuario) obligatorios.push("password_hash");

    for (let campo of obligatorios) {
      if (!form[campo].trim()) { setError(`El campo ${campo} es obligatorio`); return; }
    }

    try {
      let res = form.id_usuario ? await editarUsuario(form) : await crearUsuario(form);

      if (!res.success) { setError(res.message); return; }

      setError(null); onUsuarioGuardado(); document.getElementById("cerrarModalUsuario").click();
      setForm({ id_usuario: null, nombre: "", email: "", password_hash: "", telefono: "", rol: "", documento: "" });
    } catch (err) { setError("Error al conectar con el servidor."); }
  };

  return (
    <div className="modal fade" id="usuarioModal" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{form.id_usuario ? "Editar Usuario" : "Nuevo Usuario"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModalUsuario"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nombre *</label>
                <input type="text" className="form-control" name="nombre" value={form.nombre} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Documento *</label>
                <input type="text" className="form-control" name="documento" value={form.documento} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Contraseña {form.id_usuario ? "(Dejar vacío para no cambiar)" : "*"}</label>
                <input type="password" className="form-control" name="password_hash" value={form.password_hash} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Teléfono</label>
                <input type="text" className="form-control" name="telefono" value={form.telefono} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Rol *</label>
                <select className="form-select" name="rol" value={form.rol} onChange={handleChange}>
                  <option value="">Seleccionar rol...</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="BARBERO">BARBERO</option>
                  <option value="RECEPCIONISTA">RECEPCIONISTA</option>
                  <option value="CLIENTE">CLIENTE</option>
                </select>
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
export default UsuarioModal;
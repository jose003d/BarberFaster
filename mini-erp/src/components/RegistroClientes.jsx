import { useState, useEffect } from "react";
import { crearCliente, editarCliente, obtenerUsuarios } from "../services/api";

function ClienteModal({ clienteSeleccionado, onClienteGuardado }) {
  const [form, setForm] = useState({
    id_usuario: null,
    id_usuario_fk: "",
    nombre: "",
    fecha_nacimiento: "",
  });
  const [error, setError] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => { obtenerUsuarios().then(setUsuarios).catch(console.error); }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      setForm({
        ...clienteSeleccionado,
        id_usuario_fk: clienteSeleccionado.id_usuario || ""
      });
    }
  }, [clienteSeleccionado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!form.id_usuario_fk) { setError("Debes seleccionar un usuario"); return; }
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }

    try {
      const datosAEnviar = {
        id_usuario: form.id_usuario,
        id_usuario: parseInt(form.id_usuario_fk, 10),
        nombre: form.nombre.trim(),
        fecha_nacimiento: form.fecha_nacimiento || null,
      };

      let res;
      if (form.id_usuario) {
        res = await editarCliente(datosAEnviar);
      } else {
        res = await crearCliente(datosAEnviar);
      }

      if (!res.success) { setError(res.message); return; }

      setError(null);
      onClienteGuardado();
      document.getElementById("cerrarModal").click();
      setForm({ id_usuario: null, id_usuario_fk: "", nombre: "", fecha_nacimiento: "" });
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="modal fade" id="clienteModal">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{form.id_usuario ? "Editar Cliente" : "Nuevo Cliente"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModal"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <label className="form-label">Usuario Asociado</label>
            <select className="form-control mb-3" name="id_usuario_fk" onChange={handleChange} value={form.id_usuario_fk}>
              <option value="">-- Seleccione un usuario --</option>
              {usuarios.map((u) => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre} ({u.documento})</option>)}
            </select>

            <label className="form-label">Nombre Completo</label>
            <input type="text" className="form-control mb-3" name="nombre" value={form.nombre} onChange={handleChange} />

            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" className="form-control" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
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
export default ClienteModal;
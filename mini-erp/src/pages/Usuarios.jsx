import { useEffect, useState } from "react";
import { obtenerUsuarios } from "../services/api";
import UsuarioModal from "../components/RegistroUsuarios";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const cargarUsuarios = () => {
    setLoading(true);
    obtenerUsuarios().then((data) => { setUsuarios(data); setLoading(false); }).catch(() => { setError("No se pudieron cargar los usuarios"); setLoading(false); });
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const abrirModalEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setTimeout(() => new window.bootstrap.Modal(document.getElementById('usuarioModal')).show(), 0);
  };

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Usuarios</h2>
        <button className="btn btn-outline-success btn-sm" onClick={() => setUsuarioSeleccionado(null)} data-bs-toggle="modal" data-bs-target="#usuarioModal">
          + Nuevo Usuario
        </button>
      </div>

      <UsuarioModal usuarioSeleccionado={usuarioSeleccionado} onUsuarioGuardado={cargarUsuarios} />

      <table className="table table-striped mt-3 table-hover">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan="8" className="text-center">No hay usuarios registrados</td></tr>
          ) : (
            usuarios.map((usuario) => (
              <tr key={usuario.id_usuario}>
                <td>{usuario.id_usuario}</td>
                <td>{usuario.nombre}</td>
                <td>{usuario.documento}</td>
                <td>{usuario.email}</td>
                <td>{usuario.telefono || "—"}</td>
                <td>
                  <span className={`badge bg-${usuario.rol === 'ADMIN' ? 'danger' : 'primary'}`}>{usuario.rol}</span>
                </td>
                <td>
                  <span className={`badge bg-${usuario.estado == 1 ? 'success' : 'secondary'}`}>
                    {usuario.estado == 1 ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <button className="btn btn-warning btn-sm" onClick={() => abrirModalEditar(usuario)}>Editar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

export default Usuarios;
import { useEffect, useState } from "react";
import { obtenerClientes } from "../services/api";
import ClienteModal from "../components/RegistroClientes";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const cargarClientes = () => {
    setLoading(true);
    obtenerClientes().then((data) => { setClientes(data); setLoading(false); }).catch(() => { setError("No se pudieron cargar los clientes"); setLoading(false); });
  };

  useEffect(() => { cargarClientes(); }, []);

  const abrirModalEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setTimeout(() => new window.bootstrap.Modal(document.getElementById('clienteModal')).show(), 0);
  };

  if (loading) return <p>Cargando clientes...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Clientes</h2>
        <button className="btn btn-outline-success btn-sm" onClick={() => setClienteSeleccionado(null)} data-bs-toggle="modal" data-bs-target="#clienteModal">
          + Nuevo Cliente
        </button>
      </div>

      <ClienteModal clienteSeleccionado={clienteSeleccionado} onClienteGuardado={cargarClientes} />

      <table className="table table-striped mt-3">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Fecha de Nacimiento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 ? (
            <tr><td colSpan="4" className="text-center">No hay clientes registrados</td></tr>
          ) : (
            clientes.map((cliente) => (
              <tr key={cliente.id_usuario}>
                <td>{cliente.id_usuario}</td>
                <td>{cliente.nombre}</td>
                <td>{cliente.fecha_nacimiento || "—"}</td>
                <td>
                  <button className="btn btn-warning btn-sm" onClick={() => abrirModalEditar(cliente)}>Editar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

export default Clientes;
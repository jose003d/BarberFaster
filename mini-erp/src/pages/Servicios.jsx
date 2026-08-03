import { useEffect, useState } from "react";
import { obtenerServicios } from "../services/api";
import ServicioModal from "../components/RegistroServicios";

function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  const cargarServicios = () => {
    setLoading(true);
    obtenerServicios().then((data) => { setServicios(data); setLoading(false); }).catch(() => { setError("No se pudieron cargar los servicios"); setLoading(false); });
  };

  useEffect(() => { cargarServicios(); }, []);

  const abrirModalEditar = (servicio) => {
    setServicioSeleccionado(servicio);
    setTimeout(() => new window.bootstrap.Modal(document.getElementById('servicioModal')).show(), 0);
  };

  if (loading) return <p>Cargando servicios...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Servicios</h2>
        <button className="btn btn-outline-success btn-sm" onClick={() => setServicioSeleccionado(null)} data-bs-toggle="modal" data-bs-target="#servicioModal">
          + Nuevo Servicio
        </button>
      </div>

      <ServicioModal servicioSeleccionado={servicioSeleccionado} onServicioGuardado={cargarServicios} />

      <table className="table table-striped mt-3 table-hover">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Barbería ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Duración</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {servicios.length === 0 ? (
            <tr><td colSpan="8" className="text-center">No hay servicios registrados</td></tr>
          ) : (
            servicios.map((servicio) => (
              <tr key={servicio.id_servicio}>
                <td>{servicio.id_servicio}</td>
                <td>{servicio.id_barberia}</td>
                <td>{servicio.nombre}</td>
                <td>{servicio.descripcion || "—"}</td>
                <td>${parseFloat(servicio.precio).toFixed(2)}</td>
                <td>{servicio.duracion_minutos} min</td>
                <td>
                  <span className={`badge bg-${servicio.activo == 1 ? 'success' : 'secondary'}`}>
                    {servicio.activo == 1 ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <button className="btn btn-warning btn-sm" onClick={() => abrirModalEditar(servicio)}>Editar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

export default Servicios;
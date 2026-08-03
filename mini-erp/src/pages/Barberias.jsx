import { useEffect, useState } from "react";
import { obtenerBarberias } from "../services/api";
import BarberiaModal from "../components/RegistroBarberias";

function Barberias() {
  const [barberias, setBarberias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [barberiaSeleccionada, setBarberiaSeleccionada] = useState(null); // NUEVO ESTADO

  const cargarBarberias = () => {
    setLoading(true);
    obtenerBarberias()
      .then((data) => { setBarberias(data); setLoading(false); })
      .catch(() => { setError("No se pudieron cargar las barberías"); setLoading(false); });
  };

  useEffect(() => { cargarBarberias(); }, []);

  const abrirModalEditar = (barberia) => {
    setBarberiaSeleccionada(barberia);
    // retraso por si el estado no se actualizó
    setTimeout(() => {
      const modalEl = document.getElementById('barberiaModal');
      const modal = new window.bootstrap.Modal(modalEl);
      modal.show();
    }, 0);
  };

  if (loading) return <p>Cargando barberías...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Barberías</h2>
        <button 
          className="btn btn-outline-success btn-sm" 
          onClick={() => setBarberiaSeleccionada(null)}
          data-bs-toggle="modal" 
          data-bs-target="#barberiaModal"
        >
          + Nueva Barbería
        </button>
      </div>

      <BarberiaModal 
        barberiaSeleccionada={barberiaSeleccionada} 
        onBarberiaGuardada={cargarBarberias} 
      />

      <div className="table-responsive mt-3">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Representante</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {barberias.length === 0 ? (
              <tr><td colSpan="8" className="text-center">No hay barberías registradas</td></tr>
            ) : (
              barberias.map((b) => (
                <tr key={b.id_barberia}>
                  <td>{b.id_barberia}</td>
                  <td>{b.nombre}</td>
                  <td>{b.ciudad}</td>
                  <td>{b.direccion}</td>
                  <td>{b.telefono_barberia || "—"}</td>
                  <td>{b.nombre_representante}</td>
                  <td>
                    <span className={`badge bg-${b.estado === 'ACTIVO' ? 'success' : 'secondary'}`}>
                      {b.estado}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-warning btn-sm" onClick={() => abrirModalEditar(b)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Barberias;
import { useEffect, useState } from "react";
import { obtenerBarberos } from "../services/api";
import BarberoModal from "../components/RegistroBarberos";

function Barberos() {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);

  const cargarBarberos = () => {
    setLoading(true);
    obtenerBarberos().then((data) => { setBarberos(data); setLoading(false); }).catch(() => { setError("No se pudieron cargar los barberos"); setLoading(false); });
  };

  useEffect(() => { cargarBarberos(); }, []);

  const abrirModalEditar = (barbero) => {
    setBarberoSeleccionado(barbero);
    setTimeout(() => new window.bootstrap.Modal(document.getElementById('barberoModal')).show(), 0);
  };

  if (loading) return <p>Cargando barberos...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Barberos</h2>
        <button className="btn btn-outline-success btn-sm" onClick={() => setBarberoSeleccionado(null)} data-bs-toggle="modal" data-bs-target="#barberoModal">
          + Nuevo Barbero
        </button>
      </div>

      <BarberoModal barberoSeleccionado={barberoSeleccionado} onBarberoGuardado={cargarBarberos} />

      <div className="table-responsive mt-3">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Barbería ID</th>
              <th>Nombre</th>
              <th>Especialidad</th>
              <th>Presentación</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {barberos.length === 0 ? (
              <tr><td colSpan="7" className="text-center">No hay barberos registrados</td></tr>
            ) : (
              barberos.map((barbero) => (
                <tr key={barbero.id_barbero}>
                  <td>{barbero.id_barbero}</td>
                  <td>{barbero.id_barberia}</td>
                  <td className="fw-bold">{barbero.nombre}</td>
                  <td><span className="badge bg-info text-dark">{barbero.especialidad}</span></td>
                  <td style={{ maxWidth: "250px", whiteSpace: "normal" }}>{barbero.presentacion}</td>
                  <td>{barbero.telefono}</td>
                  <td>
                    <button className="btn btn-warning btn-sm" onClick={() => abrirModalEditar(barbero)}>Editar</button>
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

export default Barberos;
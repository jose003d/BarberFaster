import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faClipboardList, faAddressBook, faStoreSlash } from "@fortawesome/free-solid-svg-icons";
import { BASE_URL, handleResponse, obtenerBarberias, obtenerClientes } from "../../../shared/services/api.js";

async function contarSolicitudes() {
  const response = await fetch(`${BASE_URL}/barberias/solicitudes.php`, { cache: "no-store" });
  const data = await handleResponse(response);
  return Array.isArray(data.datos) ? data.datos : [];
}

// Resumen de la PLATAFORMA. El superadmin no opera barberías: solo revisa la red,
// aprueba solicitudes y activa o desactiva locales.
export default function SuperadminDashboard() {
  const [datos, setDatos] = useState({ barberias: null, solicitudes: null, clientes: null });
  const [errores, setErrores] = useState([]);

  useEffect(() => {
    let activo = true;
    Promise.allSettled([obtenerBarberias(false), contarSolicitudes(), obtenerClientes()]).then(
      ([barberias, solicitudes, clientes]) => {
        if (!activo) return;
        setDatos({
          barberias: barberias.status === "fulfilled" ? barberias.value : null,
          solicitudes: solicitudes.status === "fulfilled" ? solicitudes.value : null,
          clientes: clientes.status === "fulfilled" ? clientes.value : null,
        });
        setErrores(
          [barberias, solicitudes, clientes]
            .filter((r) => r.status === "rejected")
            .map((r) => r.reason?.message || "No se pudo cargar parte del resumen.")
        );
      }
    );
    return () => {
      activo = false;
    };
  }, []);

  const valor = (lista, filtro) => (lista === null ? "—" : (filtro ? lista.filter(filtro) : lista).length);
  const pendientes = datos.solicitudes || [];

  const tarjetas = [
    { titulo: "Barberías activas", valor: valor(datos.barberias, (b) => b.estado === "ACTIVA"), icono: faBuilding, to: "/superadmin/barberias" },
    { titulo: "Barberías inactivas", valor: valor(datos.barberias, (b) => b.estado !== "ACTIVA"), icono: faStoreSlash, to: "/superadmin/barberias" },
    { titulo: "Solicitudes pendientes", valor: valor(datos.solicitudes), icono: faClipboardList, to: "/superadmin/solicitudes" },
    { titulo: "Clientes registrados", valor: valor(datos.clientes), icono: faAddressBook, to: "/superadmin/clientes" },
  ];

  return (
    <div className="page-section">
      <div className="heading-row">
        <div>
          <h2>Panel de la plataforma</h2>
          <p className="page-description">
            Administra la red BarberFaster: aprueba barberías nuevas y activa o desactiva locales.
            La operación diaria de cada barbería (agenda, personal, servicios y pagos) la maneja su administrador.
          </p>
        </div>
      </div>

      {errores.map((mensaje) => (
        <p className="status error" role="alert" key={mensaje}>{mensaje}</p>
      ))}

      <div className="metrics-grid superadmin-metrics">
        {tarjetas.map((t) => (
          <Link className="metric-card superadmin-metric-link" to={t.to} key={t.titulo}>
            <div className="metric-card-top">
              <FontAwesomeIcon icon={t.icono} aria-hidden="true" />
            </div>
            <h4>{t.titulo}</h4>
            <strong className="metric-value">{t.valor}</strong>
          </Link>
        ))}
      </div>

      <section className="panel">
        <div className="section-heading">
          <h3>Solicitudes por revisar</h3>
          <Link className="btn-secondary" to="/superadmin/solicitudes">Ver todas</Link>
        </div>
        {datos.solicitudes === null ? (
          <p role="status">Cargando solicitudes...</p>
        ) : pendientes.length === 0 ? (
          <p>No hay solicitudes pendientes.</p>
        ) : (
          <ul className="superadmin-pending-list">
            {pendientes.slice(0, 5).map((s) => (
              <li key={s.id_solicitud}>
                <strong>{s.nombre_barberia}</strong>
                <span>{s.ciudad} · {s.nombre_admin}</span>
                <small>{new Date(s.creado_en).toLocaleDateString("es-CO")}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

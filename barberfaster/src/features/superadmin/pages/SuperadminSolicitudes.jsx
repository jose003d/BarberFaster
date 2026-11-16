import { useCallback, useEffect, useState } from "react";
import { BASE_URL, handleResponse } from "../../../shared/services/api.js";

async function consultarSolicitudes() {
  const response = await fetch(`${BASE_URL}/barberias/solicitudes.php`, { cache: "no-store" });
  const data = await handleResponse(response);
  return Array.isArray(data.datos) ? data.datos : [];
}

export default function SuperadminSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [error, setError] = useState("");
  const [credenciales, setCredenciales] = useState([]);

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setSolicitudes(await consultarSolicitudes());
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar las solicitudes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const resolverSolicitud = async (solicitud, accion) => {
    const accionLabel = accion === "aprobar" ? "aprobar y crear el acceso de administrador" : "rechazar";
    if (!window.confirm(`¿Confirmas ${accionLabel} para ${solicitud.nombre_barberia}?`)) return;

    setError("");
    setProcesandoId(solicitud.id_solicitud);
    try {
      const response = await fetch(`${BASE_URL}/barberias/resolver_solicitud.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_solicitud: solicitud.id_solicitud, accion }),
      });
      const data = await handleResponse(response);
      setSolicitudes((actuales) => actuales.filter((item) => item.id_solicitud !== solicitud.id_solicitud));
      if (accion === "aprobar") setCredenciales((actuales) => [...actuales, data]);
    } catch (requestError) {
      setError(requestError.message || "No se pudo resolver la solicitud.");
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <section className="superadmin-requests">
      <div className="section-heading">
        <div>
          <h3>Solicitudes para unir barberías</h3>
          <p className="page-description">Aprueba una solicitud para activar la barbería y crear la cuenta de administrador.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={cargarSolicitudes} disabled={cargando}>
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {error && <p className="status error" role="alert">{error}</p>}
      {credenciales.map((cuenta) => (
        <div className="superadmin-created-account" role="status" key={cuenta.barberia.id_barberia}>
          <strong>{cuenta.mensaje}</strong>
          <span>Barbería: {cuenta.barberia.nombre}</span>
          <span>Dirección: {cuenta.barberia.direccion}, {cuenta.barberia.ciudad}</span>
          <span>Teléfono: {cuenta.barberia.telefono}</span>
          <span>Documento: {cuenta.administrador.documento}</span>
          <span>Correo: {cuenta.administrador.correo}</span>
          {!cuenta.correo_enviado && (
            <>
              <span>Contraseña temporal de respaldo: <code>{cuenta.administrador.contrasena_temporal}</code></span>
              <p>El correo no pudo enviarse. Comparte la contraseña por un canal seguro y pide al administrador que la cambie al iniciar sesión.</p>
            </>
          )}
        </div>
      ))}
      {cargando ? (
        <p role="status">Cargando solicitudes...</p>
      ) : solicitudes.length === 0 ? (
        <p>No hay solicitudes pendientes.</p>
      ) : (
        <div className="superadmin-request-list">
          {solicitudes.map((solicitud) => (
            <article className="superadmin-request-card" key={solicitud.id_solicitud}>
              <div>
                <p className="discovery-eyebrow">SOLICITUD #{solicitud.id_solicitud}</p>
                <h4>{solicitud.nombre_barberia}</h4>
                <p>{solicitud.direccion}, {solicitud.ciudad}</p>
                <p>Teléfono del negocio: {solicitud.telefono_barberia}</p>
                <p>Administrador: {solicitud.nombre_admin} · Documento: {solicitud.documento_admin}</p>
                <p>Contacto: {solicitud.correo_admin}{solicitud.telefono_admin ? ` · ${solicitud.telefono_admin}` : ""}</p>
                <small>Recibida: {new Date(solicitud.creado_en).toLocaleString("es-CO")}</small>
              </div>
              <div className="superadmin-request-actions">
                <button
                  type="button"
                  className="btn"
                  disabled={procesandoId === solicitud.id_solicitud}
                  onClick={() => resolverSolicitud(solicitud, "aprobar")}
                >
                  {procesandoId === solicitud.id_solicitud ? "Procesando..." : "Aprobar y crear acceso"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={procesandoId === solicitud.id_solicitud}
                  onClick={() => resolverSolicitud(solicitud, "rechazar")}
                >
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

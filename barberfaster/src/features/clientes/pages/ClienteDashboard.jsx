import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buscarClientePorDni } from "../../../shared/services/api.js";
import PeekRating from "../components/PeekRating.jsx";
import "./ClienteDashboard.css";
import logoBarberFaster from "../../../assets/logo-barberfaster.png";
import {
  codigoValido,
  documentoValido,
  limpiarCodigo,
  limpiarDocumento,
  MENSAJE_CODIGO_INVALIDO,
  MENSAJE_DOCUMENTO_INVALIDO,
  propsInputCodigo,
  propsInputDocumento,
} from "../../../shared/utils/validacionesColombia.js";

import { BASE_URL } from "../../../shared/services/api.js";
const CLIENT_SESSION_KEY = "barberfaster_cliente_session";
const CLIENT_SESSION_EXPIRY_KEY = "barberfaster_cliente_session_expira_en";

async function leerRespuesta(response) {
  const data = await response.json();
  if (!response.ok || data.status !== "success") {
    throw new Error(data.mensaje || "No se pudo completar la solicitud.");
  }
  return data;
}

async function obtenerPerfil(token) {
  const response = await fetch(`${BASE_URL}/clientes/perfil.php`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return leerRespuesta(response);
}

async function obtenerCitas(token) {
  const response = await fetch(`${BASE_URL}/citas/listar_cliente.php`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return leerRespuesta(response);
}

function horaParaCampo(hora) {
  return String(hora || "").slice(0, 5);
}

function formatearFecha(fecha) {
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
  return new Date(Number(anio), Number(mes) - 1, Number(dia)).toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fechaLocalHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

export default function ClienteDashboard() {
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [citas, setCitas] = useState([]);
  const [cambios, setCambios] = useState({});
  const [calificaciones, setCalificaciones] = useState({});
  const [calificandoCita, setCalificandoCita] = useState(null);
  const [token, setToken] = useState("");
  const [sesionExpiraEn, setSesionExpiraEn] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const dniActual = useRef("");

  const cargarDatosCliente = useCallback(async (sesion) => {
    setCargando(true);
    setError("");
    try {
      const [perfil, historial] = await Promise.all([
        obtenerPerfil(sesion),
        obtenerCitas(sesion),
      ]);
      setToken(sesion);
      setCliente(perfil.cliente);
      setSesionExpiraEn(Number(perfil.sesion_expira_en));
      setCitas(historial.datos || []);
      setCalificaciones(Object.fromEntries(
        (historial.datos || [])
          .filter((cita) => cita.calificacion)
          .map((cita) => [cita.id_cita, Number(cita.calificacion)])
      ));
      setCambios(
        Object.fromEntries((historial.datos || []).map((cita) => [
          cita.id_cita,
          { fecha: String(cita.fecha).slice(0, 10), hora: horaParaCampo(cita.hora_inicio) },
        ]))
      );
      localStorage.setItem(CLIENT_SESSION_KEY, sesion);
      localStorage.setItem(CLIENT_SESSION_EXPIRY_KEY, String(perfil.sesion_expira_en));
      setNombre("");
      setDni("");
      setTelefono("");
      setCodigo("");
      setCodigoEnviado(false);
    } catch (loadError) {
      localStorage.removeItem(CLIENT_SESSION_KEY);
      localStorage.removeItem(CLIENT_SESSION_EXPIRY_KEY);
      setToken("");
      setCliente(null);
      setSesionExpiraEn(null);
      setCitas([]);
      setCalificaciones({});
      setError(loadError.message || "No se pudo cargar el perfil del cliente.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const sesionGuardada = localStorage.getItem(CLIENT_SESSION_KEY);
    if (sesionGuardada) cargarDatosCliente(sesionGuardada);
  }, [cargarDatosCliente]);

  const buscarDatosCliente = async () => {
    const documento = dni.trim();
    if (!documento) return;
    if (!documentoValido(documento)) {
      setError(MENSAJE_DOCUMENTO_INVALIDO);
      return;
    }

    setBuscandoCliente(true);
    setError("");
    setAviso("");
    try {
      const resultado = await buscarClientePorDni(documento);
      if (dniActual.current.trim() !== documento) return;

      if (!resultado.encontrado || !resultado.datos) {
        setAviso("No encontramos ese documento. Completa tus datos para continuar.");
        return;
      }

      const clienteExistente = resultado.datos;
      const digitosTelefono = String(clienteExistente.telefono || "").replace(/\D/g, "");
      const telefonoLocal = digitosTelefono.startsWith("57") && digitosTelefono.length > 10
        ? digitosTelefono.slice(2)
        : digitosTelefono;

      setNombre(clienteExistente.nombre || "");
      setTelefono(telefonoLocal);
      setAviso("Encontramos tu perfil y completamos tus datos.");
    } catch (lookupError) {
      if (dniActual.current.trim() === documento) {
        setError(lookupError.message || "No se pudieron consultar los datos del cliente.");
      }
    } finally {
      if (dniActual.current.trim() === documento) setBuscandoCliente(false);
    }
  };

  useEffect(() => {
    if (!cliente || !sesionExpiraEn) return undefined;
    const milisegundosRestantes = (sesionExpiraEn * 1000) - Date.now();
    const temporizador = window.setTimeout(() => {
      localStorage.removeItem(CLIENT_SESSION_KEY);
      localStorage.removeItem(CLIENT_SESSION_EXPIRY_KEY);
      setToken("");
      setCliente(null);
      setSesionExpiraEn(null);
      setCitas([]);
      setError("Tu sesión de 30 minutos venció. Verifica nuevamente tu WhatsApp para continuar.");
    }, Math.max(milisegundosRestantes, 0));
    return () => window.clearTimeout(temporizador);
  }, [cliente, sesionExpiraEn]);

  const solicitarCodigo = async (event) => {
    event.preventDefault();
    setError("");
    setAviso("");
    if (!documentoValido(dni)) {
      setError(MENSAJE_DOCUMENTO_INVALIDO);
      return;
    }
    if (!nombre.trim() || nombre.length > 100) {
      setError("Ingresa tu nombre (máximo 100 caracteres).");
      return;
    }
    if (!/^\d{10}$/.test(telefono)) {
      setError("Ingresa un número celular colombiano de 10 dígitos.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${BASE_URL}/verificacion/solicitar.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefono: `+57${telefono}`,
          dni_cliente: dni.trim(),
          nombre_cliente: nombre.trim(),
        }),
      });
      const data = await leerRespuesta(response);
      setCodigoEnviado(true);
      setAviso(data.mensaje || "Enviamos un código a tu WhatsApp. Vence en 5 minutos.");
    } catch (requestError) {
      setError(requestError.message || "No se pudo enviar el código por WhatsApp.");
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = async (event) => {
    event.preventDefault();
    setError("");
    setAviso("");
    if (!codigoValido(codigo)) {
      setError(MENSAJE_CODIGO_INVALIDO);
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${BASE_URL}/verificacion/verificar.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefono: `+57${telefono}`,
          codigo,
          dni_cliente: dni.trim(),
          nombre_cliente: nombre.trim(),
        }),
      });
      const data = await leerRespuesta(response);
      if (!data.sesion_cliente) {
        throw new Error("No se pudo iniciar la sesión del cliente. Inténtalo nuevamente.");
      }
      localStorage.setItem(CLIENT_SESSION_KEY, data.sesion_cliente);
      if (data.sesion_expira_en) {
        localStorage.setItem(CLIENT_SESSION_EXPIRY_KEY, String(data.sesion_expira_en));
      }
      await cargarDatosCliente(data.sesion_cliente);
    } catch (requestError) {
      setError(requestError.message || "No se pudo verificar el código.");
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem(CLIENT_SESSION_KEY);
    localStorage.removeItem(CLIENT_SESSION_EXPIRY_KEY);
    setToken("");
    setCliente(null);
    setSesionExpiraEn(null);
    setCitas([]);
    setCambios({});
    setCalificaciones({});
    setError("");
    setAviso("");
  };

  const actualizarCambio = (idCita, campo, valor) => {
    setCambios((actuales) => ({
      ...actuales,
      [idCita]: { ...actuales[idCita], [campo]: valor },
    }));
  };

  const descartarCambio = (idCita) => {
    setCambios((actuales) => {
      const siguientes = { ...actuales };
      delete siguientes[idCita];
      return siguientes;
    });
  };

  const cancelarCita = async (idCita) => {
    if (!window.confirm("¿Seguro que quieres cancelar esta cita?")) return;
    setError("");
    setAviso("");
    try {
      const response = await fetch(`${BASE_URL}/citas/cancelar_cliente.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_cita: idCita }),
      });
      const data = await leerRespuesta(response);
      setAviso(data.mensaje);
      const historial = await obtenerCitas(token);
      setCitas(historial.datos || []);
    } catch (requestError) {
      setError(requestError.message || "No se pudo cancelar la cita.");
    }
  };

  const reprogramarCita = async (event, idCita) => {
    event.preventDefault();
    setError("");
    setAviso("");
    const cambio = cambios[idCita];
    try {
      const response = await fetch(`${BASE_URL}/citas/reprogramar_cliente.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_cita: idCita,
          fecha: cambio?.fecha,
          hora_inicio: cambio?.hora,
        }),
      });
      const data = await leerRespuesta(response);
      setAviso(data.mensaje);
      const historial = await obtenerCitas(token);
      setCitas(historial.datos || []);
      setCambios(
        Object.fromEntries((historial.datos || []).map((cita) => [
          cita.id_cita,
          { fecha: String(cita.fecha).slice(0, 10), hora: horaParaCampo(cita.hora_inicio) },
        ]))
      );
    } catch (requestError) {
      setError(requestError.message || "No se pudo reprogramar la cita.");
    }
  };

  const calificarBarbero = async (event, idCita) => {
    event.preventDefault();
    setError("");
    setAviso("");

    const calificacion = Number(calificaciones[idCita]);
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      setError("Selecciona de 1 a 5 estrellas para calificar al barbero.");
      return;
    }

    setCalificandoCita(idCita);
    try {
      const response = await fetch(`${BASE_URL}/resenas/crearr.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `******`,
        },
        body: JSON.stringify({
          id_cita: idCita,
          calificacion,
          sesion_cliente: token,
        }),
      });
      const data = await leerRespuesta(response);
      setCitas((actuales) => actuales.map((cita) => (
        cita.id_cita === idCita ? { ...cita, calificacion } : cita
      )));
      setAviso(data.mensaje || "Gracias por calificar a tu barbero.");
    } catch (ratingError) {
      setError(ratingError.message || "No se pudo guardar la calificación.");
    } finally {
      setCalificandoCita(null);
    }
  };

  return (
    <main className="client-profile-page">
      <header className="client-profile-nav">
        <Link to="/" className="client-profile-brand" aria-label="BarberFaster, ir al inicio"><img src={logoBarberFaster} alt="" draggable="false" /></Link>
        <nav aria-label="Navegación de cliente">
          <Link to="/" className="client-profile-nav-back">Volver al inicio</Link>
          {cliente && <button className="btn-quiet" type="button" onClick={cerrarSesion}>Cerrar sesión</button>}
        </nav>
      </header>

      <section className="client-profile-content">
        {!cliente ? (
          <div className="client-auth-card">
            <div className="client-auth-intro">
            <h1>Tu perfil y tus citas</h1>
            <p className="client-profile-intro">
              Confirma los datos con los que reservaste y verificaremos tu número por WhatsApp.
              La sesión será válida durante 30 minutos.
            </p>
            </div>
            <form onSubmit={codigoEnviado ? verificarCodigo : solicitarCodigo}>
              <label>
                DNI / cédula
                <input
                  value={dni}
                  onChange={(event) => {
                    const nuevoDni = limpiarDocumento(event.target.value);
                    dniActual.current = nuevoDni;
                    setDni(nuevoDni);
                    setBuscandoCliente(false);
                    setAviso("");
                  }}
                  onBlur={buscarDatosCliente}
                  required
                  {...propsInputDocumento}
                  disabled={codigoEnviado}
                />
              </label>
              {buscandoCliente && <p className="client-profile-message" role="status">Consultando tus datos...</p>}
              <label>
                Nombre completo
                <input value={nombre} onChange={(event) => setNombre(event.target.value)} required maxLength={100} autoComplete="name" disabled={codigoEnviado} />
              </label>
              <label>
                Teléfono asociado a la cuenta
                <div className="client-phone-field">
                  <span>+57</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={telefono}
                    onChange={(event) => setTelefono(event.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                    maxLength={10}
                    autoComplete="tel-national"
                    placeholder="3000000000"
                    disabled={codigoEnviado}
                  />
                </div>
              </label>
              {codigoEnviado && (
                <label>
                  Código de WhatsApp
                  <input
                    value={codigo}
                    onChange={(event) => setCodigo(limpiarCodigo(event.target.value))}
                    required
                    {...propsInputCodigo}
                    placeholder="000000"
                  />
                </label>
              )}
              {error && <p className="client-profile-message error" role="alert">{error}</p>}
              {aviso && <p className="client-profile-message success" role="status">{aviso}</p>}
              <button className="client-profile-submit btn-primary" type="submit" disabled={cargando || buscandoCliente}>
                {cargando ? "Procesando..." : codigoEnviado ? "Verificar y entrar" : "Enviar código por WhatsApp"}
              </button>
              {codigoEnviado && (
                <>
                  <button className="client-profile-resend" type="button" onClick={solicitarCodigo} disabled={cargando}>
                    Enviar otro código
                  </button>
                  <button
                    className="client-profile-resend"
                    type="button"
                    onClick={() => {
                      setCodigoEnviado(false);
                      setCodigo("");
                      setAviso("");
                      setError("");
                    }}
                    disabled={cargando}
                  >
                    Cambiar mis datos
                  </button>
                </>
              )}
            </form>
          </div>
        ) : (
          <>
            <div className="client-profile-heading">
              <div>
                <h1>Hola, {cliente.nombre}</h1>
                <p>
                  Sesión verificada por WhatsApp · vence a las{" "}
                  {new Date(sesionExpiraEn * 1000).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Link to="/" className="client-profile-back">Buscar barbería</Link>
            </div>

            {error && <p className="client-profile-message error" role="alert">{error}</p>}
            {aviso && <p className="client-profile-message success" role="status">{aviso}</p>}

            <section className="client-details-card" aria-label="Datos del perfil">
              <div><span>DNI / cédula</span><strong>{cliente.dni}</strong></div>
              <div><span>Nombre</span><strong>{cliente.nombre}</strong></div>
              <div><span>Teléfono verificado</span><strong>{cliente.telefono}</strong></div>
            </section>

            <section className="client-appointments" aria-labelledby="client-appointments-title">
              <div className="client-appointments-heading">
                <div>
                  <h2 id="client-appointments-title">Citas agendadas</h2>
                </div>
                <span>{citas.length} {citas.length === 1 ? "cita" : "citas"}</span>
              </div>

              {citas.length === 0 ? (
                <div className="client-empty-state">
                  <p>Aún no tienes citas registradas.</p>
                  <Link to="/">Encuentra una barbería</Link>
                </div>
              ) : (
                <div className="client-appointment-list">
                  {citas.map((cita) => {
                    const cambio = cambios[cita.id_cita] || {};
                    const administrable = ["PENDIENTE", "CONFIRMADA"].includes(cita.estado);
                    return (
                      <article className="client-appointment-card" key={cita.id_cita}>
                        <div className="client-appointment-info">
                          <div className="client-appointment-title">
                            <h3>{cita.nombre_barberia}</h3>
                            <span className={`client-appointment-status ${administrable ? "pending" : "other"}`}>
                              {cita.estado}
                            </span>
                          </div>
                          <p>{cita.servicios_nombres || "Servicio de barbería"}</p>
                          <p>Barbero: {cita.nombre_barbero}</p>
                          <p className="client-appointment-date">
                            {formatearFecha(cita.fecha)} · {horaParaCampo(cita.hora_inicio)}–{horaParaCampo(cita.hora_fin)}
                          </p>
                        </div>
                        {administrable && (
                          <form className="client-appointment-actions" onSubmit={(event) => reprogramarCita(event, cita.id_cita)}>
                            <label>
                              Nueva fecha
                              <input
                                type="date"
                                min={fechaLocalHoy()}
                                value={cambio.fecha || ""}
                                onChange={(event) => actualizarCambio(cita.id_cita, "fecha", event.target.value)}
                                required
                              />
                            </label>
                            <label>
                              Nueva hora
                              <input
                                type="time"
                                step="1800"
                                value={cambio.hora || ""}
                                onChange={(event) => actualizarCambio(cita.id_cita, "hora", event.target.value)}
                                required
                              />
                            </label>
                            <div className="client-appointment-buttons">
                              <button className="client-reschedule-button" type="submit">Cambiar horario</button>
                              <button className="client-discard-button" type="button" onClick={() => descartarCambio(cita.id_cita)}>
                                Descartar cambios
                              </button>
                              <button className="client-cancel-button" type="button" onClick={() => cancelarCita(cita.id_cita)}>Cancelar cita</button>
                            </div>
                          </form>
                        )}
                        {cita.estado === "COMPLETADA" && (
                          cita.calificacion ? (
                            <div className="client-rating-result" aria-label={`Calificaste al barbero con ${cita.calificacion} de 5 estrellas`}>
                              <PeekRating
                                value={Number(cita.calificacion)}
                                count={5}
                                shape="star"
                                activeColor="#ec9b00"
                                idleColor="#ec9b00"
                                size={24}
                                lift={0}
                                showTip={false}
                                readOnly
                                ariaLabel={`Calificación de ${cita.calificacion} de 5 estrellas`}
                              />
                              <strong>Calificaste a {cita.nombre_barbero}</strong>
                            </div>
                          ) : (
                            <form className="client-rating-form" onSubmit={(event) => calificarBarbero(event, cita.id_cita)}>
                              <fieldset disabled={calificandoCita === cita.id_cita}>
                                <legend>Califica a {cita.nombre_barbero}</legend>
                                <PeekRating
                                  value={Number(calificaciones[cita.id_cita] || 0)}
                                  onChange={(calificacion) => setCalificaciones((actuales) => ({
                                    ...actuales,
                                    [cita.id_cita]: calificacion,
                                  }))}
                                  count={5}
                                  shape="star"
                                  labels={["Mala", "Regular", "Buena", "Muy buena", "Excelente"]}
                                  activeColor="#ec9b00"
                                  idleColor="#ec9b00"
                                  size={32}
                                  lift={7}
                                  magnify={1.15}
                                  riseDuration={320}
                                  popScale={1.3}
                                  showTip
                                  allowClear
                                  disabled={calificandoCita === cita.id_cita}
                                  ariaLabel={`Califica a ${cita.nombre_barbero} de 1 a 5 estrellas`}
                                />
                              </fieldset>
                              <button
                                className="client-reschedule-button client-rating-submit"
                                type="submit"
                                disabled={calificandoCita === cita.id_cita || !calificaciones[cita.id_cita]}
                              >
                                {calificandoCita === cita.id_cita ? "Guardando..." : "Enviar calificación"}
                              </button>
                            </form>
                          )
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../../shared/services/api.js";
import PerfilPublicoEditor from "../components/PerfilPublicoEditor.jsx";
import "./BarberoWorkspace.css";

// El hosting compartido no mantiene WebSockets abiertos: la agenda pregunta cada 5 s si
// cambió algo (consulta liviana) y solo entonces recarga la lista completa.
const INTERVALO_REVISION_MS = 5000;
// Recarga completa de respaldo (libera pagos vencidos y refresca todo el día).
const INTERVALO_RECARGA_MS = 60000;
// Durante cuánto tiempo una cita nueva queda resaltada.
const RESALTE_NUEVA_MS = 2 * 60 * 1000;
const CLAVE_SONIDO = "barberfaster_agenda_sonido";

function fechaLocalHoy() {
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  return hoy.toISOString().slice(0, 10);
}

function moverFecha(fecha, dias) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const nueva = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return nueva.toISOString().slice(0, 10);
}

function minutosDelDia(hora = "00:00") {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function formatoHora(hora = "") {
  const [h, m] = hora.split(":").map(Number);
  if (Number.isNaN(h)) return hora;
  const sufijo = h >= 12 ? "p. m." : "a. m.";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

function formatoFechaLarga(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" })
    .format(new Date(anio, mes - 1, dia));
}

function formatoFalta(minutos) {
  if (minutos <= 0) return "ya";
  if (minutos < 60) return `en ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `en ${horas} h ${resto} min` : `en ${horas} h`;
}

const ETIQUETA_ESTADO = {
  CONFIRMADA: "Confirmada",
  PENDIENTE: "Esperando pago",
  COMPLETADA: "Atendida",
  CANCELADA: "Cancelada",
};

// Pitido corto con Web Audio (no necesita archivos de sonido).
function sonarAviso(contexto) {
  if (!contexto) return;
  const ahora = contexto.currentTime;
  [0, 0.18].forEach((retraso, indice) => {
    const oscilador = contexto.createOscillator();
    const volumen = contexto.createGain();
    oscilador.frequency.value = indice === 0 ? 880 : 1320;
    volumen.gain.setValueAtTime(0.0001, ahora + retraso);
    volumen.gain.exponentialRampToValueAtTime(0.25, ahora + retraso + 0.02);
    volumen.gain.exponentialRampToValueAtTime(0.0001, ahora + retraso + 0.16);
    oscilador.connect(volumen).connect(contexto.destination);
    oscilador.start(ahora + retraso);
    oscilador.stop(ahora + retraso + 0.18);
  });
}

function usuarioSesion() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// Perfil de barbero de quien inició sesión (barbero, o administrador que también atiende):
// agenda del día en vivo y sus fotos, descripción y portafolio. Pensado para dejarlo abierto
// todo el día en el celular o la tablet del puesto.
export const BarberoWorkspace = () => {
  const usuario = usuarioSesion();

  if (!usuario?.atiende_clientes) {
    return (
      <main className="agenda-vivo">
        <h1>Mi perfil de barbero</h1>
        <p className="agenda-vivo-vacio">
          Tu cuenta no atiende clientes. Si tú también cortas, activa
          {" "}<strong>Yo también atiendo clientes</strong> en <Link to="/personal">Personal</Link>.
        </p>
      </main>
    );
  }

  return <PerfilBarberoSesion nombre={usuario.nombre_completo || usuario.nombre || ""} />;
};

function PerfilBarberoSesion({ nombre }) {
  const [pestana, setPestana] = useState("agenda");
  const [fecha, setFecha] = useState(fechaLocalHoy);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [conexion, setConexion] = useState("consultando"); // en-vivo | consultando | sin-conexion
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [desfaseReloj, setDesfaseReloj] = useState(0);
  const [tic, setTic] = useState(() => Date.now());
  const [nuevas, setNuevas] = useState({});
  const [aviso, setAviso] = useState("");
  const [sonidoActivo, setSonidoActivo] = useState(() => localStorage.getItem(CLAVE_SONIDO) === "1");

  const audioRef = useRef(null);
  const idsConocidosRef = useRef({ fecha: null, ids: new Set() });
  const huellaRef = useRef(null);
  const fechaRef = useRef(fecha);
  const sonidoRef = useRef(sonidoActivo);
  fechaRef.current = fecha;
  sonidoRef.current = sonidoActivo;

  const avisarNueva = useCallback((ids, texto) => {
    if (ids.length === 0) return;
    const hasta = Date.now() + RESALTE_NUEVA_MS;
    setNuevas((actuales) => {
      const siguiente = { ...actuales };
      ids.forEach((id) => { siguiente[id] = hasta; });
      return siguiente;
    });
    setAviso(texto);
    if (sonidoRef.current) sonarAviso(audioRef.current);
  }, []);

  const cargarCitas = useCallback(async () => {
    const fechaConsulta = fechaRef.current;
    const respuesta = await apiFetch(
      `citas/listar_barbero_perfil.php?fecha=${encodeURIComponent(fechaConsulta)}`,
      { cache: "no-store" },
    );
    // Si el barbero cambió de día mientras llegaba la respuesta, se descarta.
    if (fechaConsulta !== fechaRef.current) return;

    if (respuesta.status !== "success" || !Array.isArray(respuesta.datos)) {
      setError(respuesta.mensaje || "No se pudieron cargar las citas.");
      setConexion("sin-conexion");
      setCargando(false);
      return;
    }

    const lista = respuesta.datos;
    // Detecta citas activas que no estaban en la consulta anterior del mismo día.
    const conocidos = idsConocidosRef.current;
    const activas = lista.filter((cita) => cita.estado === "CONFIRMADA" || cita.estado === "PENDIENTE");
    if (conocidos.fecha === fechaConsulta) {
      const llegadas = activas.filter((cita) => !conocidos.ids.has(cita.id_cita));
      if (llegadas.length > 0) {
        const primera = llegadas[0];
        avisarNueva(
          llegadas.map((cita) => cita.id_cita),
          llegadas.length === 1
            ? `Nueva cita: ${primera.nombre_cliente || "cliente"} a las ${formatoHora(primera.hora_inicio)}`
            : `${llegadas.length} citas nuevas`,
        );
      }
    }
    idsConocidosRef.current = { fecha: fechaConsulta, ids: new Set(lista.map((cita) => cita.id_cita)) };

    if (respuesta.ahora) {
      setDesfaseReloj(new Date(respuesta.ahora.replace(" ", "T")).getTime() - Date.now());
    }
    setCitas(lista);
    setError("");
    setUltimaActualizacion(new Date());
    setConexion("en-vivo");
    setCargando(false);
  }, [avisarNueva]);

  // Carga al abrir y al cambiar de día.
  useEffect(() => {
    setCargando(true);
    setNuevas({});
    setAviso("");
    huellaRef.current = null;
    cargarCitas();
  }, [fecha, cargarCitas]);

  // "En vivo": cada 5 s pregunta si cambió algo y solo entonces recarga la lista.
  // Se pausa con la pestaña oculta y revisa apenas el barbero vuelve a ella.
  useEffect(() => {
    let cancelado = false;

    const revisar = async () => {
      if (document.hidden) return;
      const fechaConsulta = fechaRef.current;
      const respuesta = await apiFetch(
        `citas/cambios_barbero.php?fecha=${encodeURIComponent(fechaConsulta)}`,
        { cache: "no-store" },
      );
      if (cancelado || fechaConsulta !== fechaRef.current) return;
      if (respuesta.status !== "success") {
        setConexion("sin-conexion");
        return;
      }
      setConexion("en-vivo");
      const anterior = huellaRef.current;
      huellaRef.current = respuesta.huella;
      if (anterior !== null && anterior !== respuesta.huella) cargarCitas();
    };

    const idRevision = window.setInterval(revisar, INTERVALO_REVISION_MS);
    const idRecarga = window.setInterval(() => {
      if (!document.hidden) cargarCitas();
    }, INTERVALO_RECARGA_MS);
    const alVolver = () => {
      if (!document.hidden) revisar();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("online", alVolver);
    revisar();

    return () => {
      cancelado = true;
      window.clearInterval(idRevision);
      window.clearInterval(idRecarga);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("online", alVolver);
    };
  }, [cargarCitas]);

  // Reloj: recalcula "quién sigue" y apaga los resaltes vencidos.
  useEffect(() => {
    const id = window.setInterval(() => setTic(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    setNuevas((actuales) => {
      const vigentes = Object.fromEntries(Object.entries(actuales).filter(([, hasta]) => hasta > tic));
      return Object.keys(vigentes).length === Object.keys(actuales).length ? actuales : vigentes;
    });
  }, [tic]);

  // Muestra cuántas citas nuevas hay en el título de la pestaña.
  const cantidadNuevas = Object.keys(nuevas).length;
  useEffect(() => {
    const tituloBase = "Mi agenda · BarberFaster";
    document.title = cantidadNuevas > 0 ? `(${cantidadNuevas}) ${tituloBase}` : tituloBase;
    return () => { document.title = "BarberFaster"; };
  }, [cantidadNuevas]);

  const alternarSonido = () => {
    const activar = !sonidoActivo;
    if (activar) {
      // El navegador solo deja sonar audio después de un toque del usuario.
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (Contexto && !audioRef.current) audioRef.current = new Contexto();
      audioRef.current?.resume();
      sonarAviso(audioRef.current);
    }
    localStorage.setItem(CLAVE_SONIDO, activar ? "1" : "0");
    setSonidoActivo(activar);
  };

  // Reactiva el audio guardado con el primer toque en la página.
  useEffect(() => {
    if (!sonidoActivo || audioRef.current) return undefined;
    const desbloquear = () => {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (Contexto && !audioRef.current) audioRef.current = new Contexto();
      audioRef.current?.resume();
    };
    window.addEventListener("pointerdown", desbloquear, { once: true });
    return () => window.removeEventListener("pointerdown", desbloquear);
  }, [sonidoActivo]);

  const hoy = fechaLocalHoy();
  const esHoy = fecha === hoy;
  const ahoraServidor = new Date(tic + desfaseReloj);
  const minutoActual = ahoraServidor.getHours() * 60 + ahoraServidor.getMinutes();

  const { enCurso, siguiente, confirmadas, pendientes, cerradas } = useMemo(() => {
    const confirmadasDia = citas.filter((cita) => cita.estado === "CONFIRMADA");
    return {
      enCurso: esHoy
        ? confirmadasDia.find((cita) => minutosDelDia(cita.hora_inicio) <= minutoActual
          && minutosDelDia(cita.hora_fin) > minutoActual)
        : null,
      siguiente: esHoy
        ? confirmadasDia.find((cita) => minutosDelDia(cita.hora_inicio) > minutoActual)
        : confirmadasDia[0],
      confirmadas: confirmadasDia,
      pendientes: citas.filter((cita) => cita.estado === "PENDIENTE"),
      cerradas: citas.filter((cita) => cita.estado === "COMPLETADA" || cita.estado === "CANCELADA"),
    };
  }, [citas, esHoy, minutoActual]);

  const textoConexion = {
    "en-vivo": "En vivo",
    consultando: "Conectando…",
    "sin-conexion": "Sin conexión",
  }[conexion];

  const renderCita = (cita) => {
    const pasada = esHoy && cita.estado === "CONFIRMADA" && minutosDelDia(cita.hora_fin) <= minutoActual;
    const clases = [
      "agenda-vivo-cita",
      `is-${cita.estado.toLowerCase()}`,
      nuevas[cita.id_cita] ? "is-nueva" : "",
      enCurso?.id_cita === cita.id_cita ? "is-en-curso" : "",
      siguiente?.id_cita === cita.id_cita ? "is-siguiente" : "",
      pasada ? "is-pasada" : "",
    ].filter(Boolean).join(" ");

    return (
      <li key={cita.id_cita} className={clases}>
        <div className="agenda-vivo-cita-hora">
          <strong>{formatoHora(cita.hora_inicio)}</strong>
          <span>{formatoHora(cita.hora_fin)}</span>
        </div>
        <div className="agenda-vivo-cita-detalle">
          <strong>
            {cita.nombre_cliente || "Cliente"}
            {nuevas[cita.id_cita] && <span className="agenda-vivo-etiqueta-nueva">Nueva</span>}
          </strong>
          <span>{cita.servicios || "Servicio general"}</span>
          {cita.notas && <em>“{cita.notas}”</em>}
        </div>
        <div className="agenda-vivo-cita-lateral">
          <span className={`agenda-vivo-estado is-${cita.estado.toLowerCase()}`}>
            {enCurso?.id_cita === cita.id_cita ? "Atendiendo" : ETIQUETA_ESTADO[cita.estado] || cita.estado}
          </span>
          {cita.telefono_cliente && cita.estado !== "CANCELADA" && (
            <a href={`tel:${cita.telefono_cliente}`} aria-label={`Llamar a ${cita.nombre_cliente || "cliente"}`}>
              {cita.telefono_cliente}
            </a>
          )}
        </div>
      </li>
    );
  };

  return (
    <main className="agenda-vivo">
      <header className="agenda-vivo-encabezado">
        <div>
          <h1>{nombre ? `Hola, ${nombre.split(" ")[0]}` : "Mi perfil de barbero"}</h1>
          <p className="agenda-vivo-fecha">{esHoy ? "Hoy, " : ""}{formatoFechaLarga(fecha)}</p>
        </div>
        <div className="agenda-vivo-controles">
          <span className={`agenda-vivo-conexion is-${conexion}`} role="status" title={
            ultimaActualizacion ? `Revisa cada ${INTERVALO_REVISION_MS / 1000} s · última lista: ${ultimaActualizacion.toLocaleTimeString("es-CO")}` : undefined
          }>
            <span aria-hidden="true" />
            {textoConexion}
          </span>
          <button type="button" className="btn-secondary" onClick={alternarSonido} aria-pressed={sonidoActivo}>
            {sonidoActivo ? "Sonido activado" : "Activar sonido"}
          </button>
        </div>
      </header>

      <div className="agenda-vivo-pestanas" role="tablist" aria-label="Secciones de mi perfil">
        <button type="button" role="tab" className="agenda-vivo-tab" aria-selected={pestana === "agenda"} onClick={() => setPestana("agenda")}>
          Agenda del día
          {cantidadNuevas > 0 && <span className="agenda-vivo-etiqueta-nueva">{cantidadNuevas}</span>}
        </button>
        <button type="button" role="tab" className="agenda-vivo-tab" aria-selected={pestana === "perfil"} onClick={() => setPestana("perfil")}>
          Mis fotos y descripción
        </button>
      </div>

      {/* El aviso de cita nueva se ve en ambas pestañas; la agenda sigue revisando en segundo plano. */}
      {aviso && pestana === "perfil" && (
        <div className="agenda-vivo-aviso" role="alert">
          <button type="button" className="agenda-vivo-aviso-ir" onClick={() => setPestana("agenda")}>{aviso} · Ver agenda</button>
          <button type="button" onClick={() => setAviso("")} aria-label="Cerrar aviso">×</button>
        </div>
      )}

      {pestana === "perfil" ? <PerfilPublicoEditor /> : (<>
      <nav className="agenda-vivo-dias" aria-label="Cambiar de día">
        <button type="button" className="btn-secondary" onClick={() => setFecha(moverFecha(fecha, -1))} aria-label="Día anterior">‹</button>
        <button type="button" className="btn-secondary" onClick={() => setFecha(hoy)} disabled={esHoy}>Hoy</button>
        <button type="button" className="btn-secondary" onClick={() => setFecha(moverFecha(fecha, 1))} aria-label="Día siguiente">›</button>
        <input type="date" value={fecha} onChange={(event) => event.target.value && setFecha(event.target.value)} aria-label="Elegir fecha" />
      </nav>

      {aviso && (
        <div className="agenda-vivo-aviso" role="alert">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso("")} aria-label="Cerrar aviso">×</button>
        </div>
      )}
      {error && <p className="status error" role="alert">{error}</p>}

      {cargando ? (
        <p className="agenda-vivo-vacio" role="status">Cargando citas…</p>
      ) : (
        <>
          <section className="agenda-vivo-turno" aria-label="Turno actual y siguiente">
            {enCurso && (
              <article className="agenda-vivo-tarjeta is-en-curso">
                <span>Atendiendo ahora</span>
                <strong>{enCurso.nombre_cliente || "Cliente"}</strong>
                <p>{enCurso.servicios || "Servicio general"} · hasta las {formatoHora(enCurso.hora_fin)}</p>
              </article>
            )}
            <article className="agenda-vivo-tarjeta is-siguiente">
              <span>{esHoy ? "Sigue" : "Primer turno"}</span>
              {siguiente ? (
                <>
                  <strong>{siguiente.nombre_cliente || "Cliente"}</strong>
                  <p>
                    {formatoHora(siguiente.hora_inicio)}
                    {esHoy && ` · ${formatoFalta(minutosDelDia(siguiente.hora_inicio) - minutoActual)}`}
                    {" · "}{siguiente.servicios || "Servicio general"}
                  </p>
                </>
              ) : (
                <p>{esHoy ? "No hay más turnos confirmados por hoy." : "No hay turnos confirmados este día."}</p>
              )}
            </article>
            <dl className="agenda-vivo-resumen">
              <div><dt>Confirmadas</dt><dd>{confirmadas.length}</dd></div>
              <div><dt>Esperando pago</dt><dd>{pendientes.length}</dd></div>
              <div><dt>Atendidas</dt><dd>{cerradas.filter((cita) => cita.estado === "COMPLETADA").length}</dd></div>
            </dl>
          </section>

          <section className="agenda-vivo-lista" aria-labelledby="agenda-vivo-turnos">
            <h2 id="agenda-vivo-turnos">Turnos confirmados</h2>
            {confirmadas.length > 0
              ? <ol>{confirmadas.map(renderCita)}</ol>
              : <p className="agenda-vivo-vacio">No hay turnos confirmados.</p>}
          </section>

          {pendientes.length > 0 && (
            <section className="agenda-vivo-lista" aria-labelledby="agenda-vivo-pendientes">
              <h2 id="agenda-vivo-pendientes">Esperando pago en línea</h2>
              <p className="agenda-vivo-nota">Se confirman solas cuando el cliente paga. Si no paga en 10 minutos, se liberan.</p>
              <ol>{pendientes.map(renderCita)}</ol>
            </section>
          )}

          {cerradas.length > 0 && (
            <details className="agenda-vivo-lista agenda-vivo-cerradas">
              <summary>Atendidas y canceladas ({cerradas.length})</summary>
              <ol>{cerradas.map(renderCita)}</ol>
            </details>
          )}
        </>
      )}
      </>)}
    </main>
  );
}

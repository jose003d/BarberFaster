import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faCalendarDays, faChartColumn } from "@fortawesome/free-solid-svg-icons";
import { BASE_URL } from "../../../shared/services/api.js";
import "./Dashboard.css";

// Mantiene los días en el mismo formato que usa el backend y traduce las etiquetas visibles.
const DIAS_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const NOMBRES_DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const usuarioEsAdministrador = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null")?.rol === "ADMINISTRADOR";
  } catch {
    return false;
  }
};

// Dashboard del local: muestra métricas, personal y datos públicos del negocio.
export default function Dashboard() {
  // La sección activa del panel se selecciona desde el menú desplegable.
  const [searchParams] = useSearchParams();
  const seccionSolicitada = searchParams.get("section");
  const tabActiva = ["metricas", "agenda", "perfil"].includes(seccionSolicitada)
    ? seccionSolicitada
    : "perfil";
  const [agendaBarberos, setAgendaBarberos] = useState([]);
  const [proximasCitas, setProximasCitas] = useState([]);
  const [historialBarberoId, setHistorialBarberoId] = useState(null);
  const [historialCitas, setHistorialCitas] = useState([]);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);
  const [errorAgenda, setErrorAgenda] = useState("");
  const [notificacionesPago, setNotificacionesPago] = useState([]);
  const [errorNotificacionesPago, setErrorNotificacionesPago] = useState("");

  // Estado del Perfil de la Barbería
  const [perfil, setPerfil] = useState({
    descripcion: "",
    direccion: "",
    url_mapa: "",
    hora_apertura: "08:00",
    hora_cierre: "19:00",
    dias_trabajo: DIAS_SEMANA,
  });
  const [perfilOriginal, setPerfilOriginal] = useState(perfil);

  const [cargando, setCargando] = useState(true);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [fotosBarberia, setFotosBarberia] = useState([]);
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState([]);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [urlMapaPreview, setUrlMapaPreview] = useState("");
  const [cargandoMapaPreview, setCargandoMapaPreview] = useState(false);
  const [errorMapaPreview, setErrorMapaPreview] = useState("");
  const fotosInputRef = useRef(null);

  // Lee el identificador del local elegido en la sesión administrativa demo.
  const obtenerBarberiaActivaId = () => {
    try {
      const stored = localStorage.getItem("barberia_demo_admin");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.id_barberia || parsed.id || 1;
      }
    } catch (e) {
      const raw = localStorage.getItem("barberia_demo_admin");
      if (raw && !isNaN(raw)) return Number(raw);
    }
    return 1;
  };

  useEffect(() => {
    cargarPerfilBarberia();
  }, []);

  useEffect(() => {
    if (!usuarioEsAdministrador()) return undefined;

    let activa = true;
    let cargandoNotificaciones = false;
    const controller = new AbortController();
    const cargarNotificaciones = async () => {
      if (cargandoNotificaciones) return;
      cargandoNotificaciones = true;
      try {
        const response = await fetch(`${BASE_URL}/notificaciones/listar_pagos.php`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || data.status !== "success" || !Array.isArray(data.datos)) {
          throw new Error(data.mensaje || "No se pudieron cargar las notificaciones de pagos.");
        }
        if (activa) {
          setNotificacionesPago(data.datos);
          setErrorNotificacionesPago("");
        }
      } catch (error) {
        if (error.name !== "AbortError" && activa) {
          setErrorNotificacionesPago(error.message || "No se pudieron cargar las notificaciones de pagos.");
        }
      } finally {
        cargandoNotificaciones = false;
      }
    };

    cargarNotificaciones();
    const intervalo = window.setInterval(cargarNotificaciones, 30000);
    return () => {
      activa = false;
      controller.abort();
      window.clearInterval(intervalo);
    };
  }, []);

  // Carga próximos turnos de todos los barberos y el historial solo a petición.
  useEffect(() => {
    if (tabActiva !== "agenda") return undefined;
    let activa = true;
    const controller = new AbortController();
    const cargarAgenda = async (mostrarCarga = false) => {
      if (mostrarCarga) setCargandoAgenda(true);
      try {
        const idBarberia = obtenerBarberiaActivaId();
        const url = new URL(`${BASE_URL}/citas/listar_agenda_barberia.php`);
        url.searchParams.set("id_barberia", String(idBarberia));
        if (historialBarberoId) url.searchParams.set("id_barbero", String(historialBarberoId));
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok || data.status !== "success") {
          throw new Error(data.mensaje || "No se pudo cargar la agenda.");
        }
        if (!activa) return;
        setAgendaBarberos(Array.isArray(data.barberos) ? data.barberos : []);
        setProximasCitas(Array.isArray(data.proximas) ? data.proximas : []);
        setHistorialCitas(Array.isArray(data.historial) ? data.historial : []);
        setErrorAgenda("");
      } catch (error) {
        if (error.name !== "AbortError" && activa) {
          setErrorAgenda(error.message || "No se pudo cargar la agenda.");
        }
      } finally {
        if (mostrarCarga && activa) setCargandoAgenda(false);
      }
    };

    cargarAgenda(true);
    const intervalo = window.setInterval(() => cargarAgenda(), 15000);
    return () => {
      activa = false;
      controller.abort();
      window.clearInterval(intervalo);
    };
  }, [tabActiva, historialBarberoId]);

  // Convierte enlaces cortos de Google Maps antes de mostrarlos en el iframe.
  useEffect(() => {
    const url = perfil.url_mapa.trim();
    setErrorMapaPreview("");
    if (!url) {
      setUrlMapaPreview("");
      setCargandoMapaPreview(false);
      return undefined;
    }

    const esEnlaceCorto = /^https:\/\/(?:maps\.app\.goo\.gl|goo\.gl)\//i.test(url);
    if (!esEnlaceCorto) {
      setUrlMapaPreview(url);
      setCargandoMapaPreview(false);
      return undefined;
    }

    const controller = new AbortController();
    setUrlMapaPreview("");
    setCargandoMapaPreview(true);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/barberias/perfil.php?url_mapa=${encodeURIComponent(url)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok || data.status !== "success" || !data.data?.url_mapa) {
          throw new Error(data.mensaje || "No se pudo preparar la vista previa de Google Maps.");
        }
        setUrlMapaPreview(data.data.url_mapa);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorMapaPreview(error.message || "No se pudo preparar la vista previa de Google Maps.");
        }
      } finally {
        if (!controller.signal.aborted) setCargandoMapaPreview(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [perfil.url_mapa]);

  // Carga y normaliza el perfil público del establecimiento desde el backend.
  const cargarPerfilBarberia = () => {
    setCargando(true);
    setMensaje(null);
    const idBarberia = obtenerBarberiaActivaId();

    fetch(`${BASE_URL}/barberias/perfil.php?id_barberia=${idBarberia}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        return res.json();
      })
      .then((data) => {
        if (data.status === "success" && data.data) {
          const perfilCargado = {
            descripcion: data.data.descripcion || "",
            direccion: data.data.direccion || "",
            url_mapa: data.data.url_mapa || "",
            hora_apertura: data.data.hora_apertura ? data.data.hora_apertura.substring(0, 5) : "08:00",
            hora_cierre: data.data.hora_cierre ? data.data.hora_cierre.substring(0, 5) : "19:00",
            // Usa todos los días como valor compatible con perfiles anteriores a esta configuración.
            dias_trabajo: Array.isArray(data.data.dias_trabajo) ? data.data.dias_trabajo : DIAS_SEMANA,
          };
          setPerfil(perfilCargado);
          setPerfilOriginal(perfilCargado);
          return cargarFotosBarberia(idBarberia);
        } else {
          setMensaje({ tipo: "error", texto: data.mensaje || "Error al obtener perfil." });
        }
      })
      .catch((err) => {
        console.error("Detalle del error:", err);
        setMensaje({
          tipo: "error",
          texto: err.message || "No se pudo conectar con el servidor o la respuesta no es válida.",
        });
      })
      .finally(() => setCargando(false));
  };

  // Carga las fotos existentes para administrarlas desde el perfil del local.
  const cargarFotosBarberia = async (idBarberia = obtenerBarberiaActivaId()) => {
    const response = await fetch(
      `${BASE_URL}/barberias/fotos.php?id_barberia=${encodeURIComponent(idBarberia)}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!response.ok || data.status !== "success" || !Array.isArray(data.datos)) {
      throw new Error(data.mensaje || "No se pudieron cargar las fotos de la barbería.");
    }
    setFotosBarberia(data.datos);
  };

  // Sube las imágenes seleccionadas, respetando el límite de ocho por local.
  const subirFotosBarberia = async () => {
    if (fotosSeleccionadas.length === 0) return;
    if (fotosBarberia.length + fotosSeleccionadas.length > 8) {
      setMensaje({ tipo: "error", texto: `Solo puedes tener 8 fotos. Puedes agregar ${8 - fotosBarberia.length} más.` });
      return;
    }
    if (fotosSeleccionadas.some((foto) => foto.size > 5 * 1024 * 1024)) {
      setMensaje({ tipo: "error", texto: "Cada foto debe pesar máximo 5 MB." });
      return;
    }
    setSubiendoFotos(true);
    setMensaje(null);
    try {
      const body = new FormData();
      body.append("id_barberia", String(obtenerBarberiaActivaId()));
      fotosSeleccionadas.forEach((foto) => body.append("fotos[]", foto));
      const response = await fetch(`${BASE_URL}/barberias/fotos.php`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        throw new Error(data.mensaje || "No se pudieron subir las fotos.");
      }
      await cargarFotosBarberia();
      setFotosSeleccionadas([]);
      if (fotosInputRef.current) fotosInputRef.current.value = "";
      setMensaje({ tipo: "success", texto: data.mensaje || "Fotos agregadas correctamente." });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message || "No se pudieron subir las fotos." });
    } finally {
      setSubiendoFotos(false);
    }
  };

  // Elimina una foto seleccionada de la galería de la barbería.
  const eliminarFotoBarberia = async (idFoto) => {
    setMensaje(null);
    try {
      const response = await fetch(`${BASE_URL}/barberias/fotos.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_foto: idFoto,
          id_barberia: obtenerBarberiaActivaId(),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        throw new Error(data.mensaje || "No se pudo eliminar la foto.");
      }
      setFotosBarberia((actuales) => actuales.filter((foto) => Number(foto.id_foto) !== Number(idFoto)));
      setMensaje({ tipo: "success", texto: "Foto eliminada correctamente." });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message || "No se pudo eliminar la foto." });
    }
  };

  // Guarda la descripción, dirección, mapa y horario general del local.
  const guardarPerfil = (e) => {
    e.preventDefault();
    // Una barbería debe tener al menos un día habilitado para aceptar reservas.
    if (perfil.dias_trabajo.length === 0) {
      setMensaje({ tipo: "error", texto: "Selecciona al menos un día de trabajo." });
      return;
    }
    setGuardandoPerfil(true);
    setMensaje(null);

    const payload = {
      id_barberia: obtenerBarberiaActivaId(),
      descripcion: perfil.descripcion,
      direccion: perfil.direccion,
      url_mapa: perfil.url_mapa,
      hora_apertura: `${perfil.hora_apertura}:00`,
      hora_cierre: `${perfil.hora_cierre}:00`,
      // Envía los días seleccionados junto con el resto de los datos del perfil.
      dias_trabajo: perfil.dias_trabajo,
    };

    fetch(`${BASE_URL}/barberias/perfil.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const perfilGuardado = {
            ...perfil,
            ...(data.data?.url_mapa ? { url_mapa: data.data.url_mapa } : {}),
          };
          setPerfil(perfilGuardado);
          setPerfilOriginal(perfilGuardado);
          setMensaje({ tipo: "success", texto: "¡Información del perfil y horarios guardados con éxito!" });
          setTimeout(() => setMensaje(null), 3500);
        } else {
          setMensaje({ tipo: "error", texto: data.mensaje || "Error al actualizar la información." });
        }
      })
      .catch((err) => {
        console.error("Error al guardar:", err);
        setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
      })
      .finally(() => setGuardandoPerfil(false));
  };

  return (
    <div className="page-section dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">BarberFaster · Administración</p>
          <h1>Panel de control</h1>
          <p className="dashboard-description">Administra la operación y la información de tu barbería.</p>
        </div>
      </header>

      {mensaje && (
        <p className={`dashboard-message ${mensaje.tipo}`}>
          {mensaje.texto}
        </p>
      )}

      {usuarioEsAdministrador() && (
        <section className="dashboard-panel dashboard-payment-notifications" aria-labelledby="payment-notifications-title">
          <p className="dashboard-eyebrow">Actividad de pagos</p>
          <h2 id="payment-notifications-title">Notificaciones de Wompi</h2>
          {errorNotificacionesPago ? (
            <p className="dashboard-message error" role="alert">{errorNotificacionesPago}</p>
          ) : notificacionesPago.length === 0 ? (
            <p className="dashboard-description">No hay notificaciones de pagos por mostrar.</p>
          ) : (
            <ul className="dashboard-payment-notification-list">
              {notificacionesPago.map((notificacion) => (
                <li key={notificacion.id_notificacion}>
                  <span>{notificacion.mensaje}</span>
                  <time dateTime={notificacion.creado_en}>
                    {new Date(notificacion.creado_en).toLocaleString("es-CO")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Pestaña de resumen de citas e ingresos del negocio. */}
      {tabActiva === "metricas" && (
        <section className="dashboard-panel">
          <p className="dashboard-eyebrow">Tu negocio</p>
          <h2><FontAwesomeIcon icon={faChartColumn} aria-hidden="true" /> Métricas del negocio</h2>
          <p className="dashboard-description">Resumen estadístico de citas reservadas e ingresos generados.</p>
          <div className="dashboard-metrics">
            <article className="dashboard-metric-card">
              <span>Total citas reservadas</span>
              <h3>24</h3>
            </article>
            <article className="dashboard-metric-card accent">
              <span>Ingresos estimados hoy</span>
              <h3>$450.000</h3>
            </article>
          </div>
        </section>
      )}

      {/* Agenda general: próximos turnos agrupados por barbero e historial opcional. */}
      {tabActiva === "agenda" && (
        <section className="dashboard-panel">
          <p className="dashboard-eyebrow">Turnos de la barbería</p>
          <h2><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> Agenda general</h2>
          <p className="dashboard-description">
            Consulta los próximos turnos de cada barbero. El historial se carga al solicitarlo.
          </p>
          {cargandoAgenda ? (
            <p className="dashboard-loading" role="status">Cargando agenda...</p>
          ) : errorAgenda ? (
            <p className="dashboard-message error" role="alert">{errorAgenda}</p>
          ) : agendaBarberos.length === 0 ? (
            <p className="dashboard-loading">No hay barberos activos en esta barbería.</p>
          ) : (
            <div className="dashboard-agenda-list">
              {agendaBarberos.map((barbero) => {
                const citasBarbero = proximasCitas.filter(
                  (cita) => Number(cita.id_barbero) === Number(barbero.id_barbero)
                );
                const verHistorial = Number(historialBarberoId) === Number(barbero.id_barbero);
                return (
                  <article className="dashboard-agenda-barber" key={barbero.id_barbero}>
                    <header className="dashboard-agenda-barber-header">
                      <div>
                        <h3>{[barbero.nombre, barbero.apellido].filter(Boolean).join(" ")}</h3>
                        {barbero.especialidad && <p>{barbero.especialidad}</p>}
                      </div>
                      <button
                        type="button"
                        className="dashboard-history-button"
                        onClick={() => setHistorialBarberoId(verHistorial ? null : barbero.id_barbero)}
                      >
                        {verHistorial ? "Ocultar historial" : "Ver historial de barbero"}
                      </button>
                    </header>

                    <div className="dashboard-agenda-section">
                      <h4>Próximos turnos</h4>
                      {citasBarbero.length === 0 ? (
                        <p>No tiene próximos turnos.</p>
                      ) : (
                        <div className="dashboard-appointments">
                          {citasBarbero.map((cita) => (
                            <article className="dashboard-appointment" key={cita.id_cita}>
                              <div>
                                <strong>{cita.nombre_cliente}</strong>
                                <span>{cita.servicios || "Servicio sin detalle"}</span>
                              </div>
                              <div className="dashboard-appointment-time">
                                <strong>{new Date(`${cita.fecha}T12:00:00`).toLocaleDateString("es-CO", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}</strong>
                                <span>{cita.hora_inicio.slice(0, 5)}–{cita.hora_fin.slice(0, 5)}</span>
                              </div>
                              <span className={`dashboard-appointment-status ${cita.estado.toLowerCase()}`}>
                                {cita.estado}
                              </span>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>

                    {verHistorial && (
                      <div className="dashboard-agenda-section dashboard-history">
                        <h4>Historial de {barbero.nombre}</h4>
                        {historialCitas.length === 0 ? (
                          <p>No hay citas en el historial de este barbero.</p>
                        ) : (
                          <div className="dashboard-appointments">
                            {historialCitas.map((cita) => (
                              <article className="dashboard-appointment" key={cita.id_cita}>
                                <div>
                                  <strong>{cita.nombre_cliente}</strong>
                                  <span>{cita.servicios || "Servicio sin detalle"}</span>
                                </div>
                                <div className="dashboard-appointment-time">
                                  <strong>{new Date(`${cita.fecha}T12:00:00`).toLocaleDateString("es-CO", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })}</strong>
                                  <span>{cita.hora_inicio.slice(0, 5)}–{cita.hora_fin.slice(0, 5)}</span>
                                </div>
                                <span className={`dashboard-appointment-status ${cita.estado.toLowerCase()}`}>
                                  {cita.estado}
                                </span>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Pestaña de edición de perfil, ubicación y horas de atención. */}
      {tabActiva === "perfil" && (
        <section className="dashboard-panel">
          <p className="dashboard-eyebrow">Información pública</p>
          <h2><FontAwesomeIcon icon={faBuilding} aria-hidden="true" /> Perfil e información de la barbería</h2>
          <p className="dashboard-description">
            Esta información se mostrará públicamente a los clientes al agendar.
          </p>

          {cargando ? (
            <p className="dashboard-loading">Cargando información del establecimiento...</p>
          ) : (
            <form className="dashboard-profile-form" onSubmit={guardarPerfil}>
              <div className="dashboard-profile-grid">
                {/* DESCRIPCIÓN */}
                <div className="dashboard-field full">
                  <label htmlFor="dashboard-description">Descripción comercial:</label>
                  <textarea
                    id="dashboard-description"
                    rows="3"
                    value={perfil.descripcion}
                    disabled={guardandoPerfil}
                    onChange={(e) => setPerfil({ ...perfil, descripcion: e.target.value })}
                    placeholder="Ej. Barbería tradicional con los mejores cortes clásicos y modernos de la ciudad..."
                  />
                </div>

                {/* DIRECCIÓN */}
                <div className="dashboard-field">
                  <label htmlFor="dashboard-address">Dirección física:</label>
                  <input
                    id="dashboard-address"
                    type="text"
                    value={perfil.direccion}
                    disabled={guardandoPerfil}
                    onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })}
                    placeholder="Ej. Carrera 6 # 7-12, Centro"
                  />
                </div>

                {/* URL GOOGLE MAPS EMBED */}
                <div className="dashboard-field">
                  <label htmlFor="dashboard-map-url">Ubicación Google Maps (URL iFrame Embed):</label>
                  <input
                    id="dashboard-map-url"
                    type="text"
                    value={perfil.url_mapa}
                    disabled={guardandoPerfil}
                    onChange={(e) => setPerfil({ ...perfil, url_mapa: e.target.value })}
                    placeholder="URL para insertar o enlace compartido de Google Maps"
                  />
                </div>

                {/* HORA APERTURA */}
                <div className="dashboard-field">
                  <label htmlFor="dashboard-opening-time">Hora de apertura general:</label>
                  <input
                    id="dashboard-opening-time"
                    type="time"
                    value={perfil.hora_apertura}
                    disabled={guardandoPerfil}
                    onChange={(e) => setPerfil({ ...perfil, hora_apertura: e.target.value })}
                    required
                  />
                </div>

                {/* HORA CIERRE */}
                <div className="dashboard-field">
                  <label htmlFor="dashboard-closing-time">Hora de cierre general:</label>
                  <input
                    id="dashboard-closing-time"
                    type="time"
                    value={perfil.hora_cierre}
                    disabled={guardandoPerfil}
                    onChange={(e) => setPerfil({ ...perfil, hora_cierre: e.target.value })}
                    required
                  />
                </div>

                {/* Selector de los días de apertura semanal de la barbería. */}
                <fieldset className="dashboard-field dashboard-working-days">
                  <legend>Días de trabajo:</legend>
                  <p>Elige los días en que tu barbería recibe reservas.</p>
                  <div className="dashboard-working-days-options">
                    {DIAS_SEMANA.map((dia, index) => (
                      <label key={dia}>
                        <input
                          type="checkbox"
                          checked={perfil.dias_trabajo.includes(dia)}
                          disabled={guardandoPerfil}
                          onChange={(event) => setPerfil({
                            ...perfil,
                            dias_trabajo: event.target.checked
                              ? [...perfil.dias_trabajo, dia]
                              : perfil.dias_trabajo.filter((diaSeleccionado) => diaSeleccionado !== dia),
                          })}
                        />
                        {NOMBRES_DIAS[index === 6 ? 0 : index + 1]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <section className="dashboard-gallery" aria-labelledby="dashboard-gallery-title">
                <div className="dashboard-gallery-heading">
                  <div>
                    <h3 id="dashboard-gallery-title">Fotos de la barbería</h3>
                    <p>Agregar fotos es opcional: puedes subir de 1 a 8 imágenes JPG, PNG o WebP (máximo 5 MB cada una). Si agregas varias, se alternarán automáticamente en el inicio.</p>
                  </div>
                  <span>{fotosBarberia.length}/8</span>
                </div>
                {fotosBarberia.length > 0 && (
                  <div className="dashboard-gallery-grid">
                    {fotosBarberia.map((foto) => (
                      <figure className="dashboard-gallery-item" key={foto.id_foto}>
                        <img src={`${window.location.origin}${foto.foto}`} alt="Foto de la barbería" loading="lazy" />
                        <button
                          type="button"
                          onClick={() => eliminarFotoBarberia(foto.id_foto)}
                          aria-label="Eliminar foto de la barbería"
                        >
                          Eliminar
                        </button>
                      </figure>
                    ))}
                  </div>
                )}
                {fotosBarberia.length < 8 && (
                  <div className="dashboard-gallery-upload">
                    <input
                      ref={fotosInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(event) => setFotosSeleccionadas(Array.from(event.target.files || []))}
                      aria-label="Seleccionar fotos de la barbería"
                    />
                    <span>
                      {fotosSeleccionadas.length > 0
                        ? `${fotosSeleccionadas.length} foto(s) seleccionada(s)`
                        : `Puedes agregar ${8 - fotosBarberia.length} foto(s) más.`}
                    </span>
                    <button
                      type="button"
                      className="btn"
                      onClick={subirFotosBarberia}
                      disabled={subiendoFotos || fotosSeleccionadas.length === 0}
                    >
                      {subiendoFotos ? "Subiendo..." : "Subir fotos"}
                    </button>
                  </div>
                )}
              </section>

              {/* VISTA PREVIA MAPA */}
              {perfil.url_mapa && (
                <div className="dashboard-map-preview">
                  <label htmlFor="dashboard-map-preview">Vista previa de la ubicación:</label>
                  {cargandoMapaPreview ? (
                    <p className="dashboard-map-preview-status" role="status">Preparando el mapa de Google...</p>
                  ) : errorMapaPreview ? (
                    <p className="dashboard-map-preview-status error" role="alert">{errorMapaPreview}</p>
                  ) : urlMapaPreview ? (
                    <iframe
                      id="dashboard-map-preview"
                      src={urlMapaPreview}
                      width="100%"
                      height="200"
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicacion Barberia"
                    />
                  ) : null}
                </div>
              )}

              <div className="dashboard-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={guardandoPerfil}
                  onClick={() => {
                    setPerfil(perfilOriginal);
                    setFotosSeleccionadas([]);
                    if (fotosInputRef.current) fotosInputRef.current.value = "";
                    setMensaje(null);
                  }}
                >
                  Descartar cambios
                </button>
                <button type="submit" className="btn" disabled={guardandoPerfil}>
                  {guardandoPerfil ? "Guardando..." : "Guardar Perfil de Barbería"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
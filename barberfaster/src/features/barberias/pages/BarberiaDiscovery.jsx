import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { irAlPanelSuperadmin } from "../../auth/auth.js";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CallIcon,
  Cancel01Icon,
  CreditCardIcon,
  Location01Icon,
  ScissorIcon,
  Search01Icon,
  StarIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { obtenerBarberias } from "../../../shared/services/api.js";
import BarberiaBenefits from "../components/BarberiaBenefits.jsx";
import logoBarberFaster from "../../../assets/logo-barberfaster.png";
import heroVideo from "../../../assets/hero-barberfaster.mp4";
import "./BarberiaDiscovery.css";

import { BASE_URL as BACKEND_URL } from "../../../shared/services/api.js";
const IMAGE_BASE_URL = `${BACKEND_URL}/uploads`;

// Permite buscar barberías por texto o ciudad y empezar una reserva pública.
function BarberiaDiscovery() {
  // Conserva locales, filtros y estados de carga/error de la consulta inicial.
  const [barberias, setBarberias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorFotos, setErrorFotos] = useState("");
  const [fotosPorBarberia, setFotosPorBarberia] = useState({});
  const [indiceFoto, setIndiceFoto] = useState(0);
  const [barberiaDetalleId, setBarberiaDetalleId] = useState(null);
  const [detallesBarberia, setDetallesBarberia] = useState({});
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");
  const navigate = useNavigate();

  // Carga locales activos y evita actualizar el estado si la vista ya se desmontó.
  useEffect(() => {
    let activa = true;

    obtenerBarberias(true)
      .then((lista) => {
        if (activa) setBarberias(lista);
      })
      .catch((loadError) => {
        if (activa) setError(loadError.message || "No se pudieron cargar las barberías.");
      })
      .finally(() => {
        if (activa) setCargando(false);
      });

    return () => {
      activa = false;
    };
  }, []);

  // Obtiene las galerías públicas que alimentan el carrusel automático de cada local.
  useEffect(() => {
    if (barberias.length === 0) return undefined;
    let activa = true;

    fetch(`${BACKEND_URL}/barberias/fotos.php`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.status !== "success" || !Array.isArray(data.datos)) {
          throw new Error(data.mensaje || "No se pudieron cargar las fotos de las barberías.");
        }
        if (!activa) return;
        const agrupadas = data.datos.reduce((resultado, foto) => {
          const idBarberia = String(foto.id_barberia);
          if (!resultado[idBarberia]) resultado[idBarberia] = [];
          resultado[idBarberia].push(`${window.location.origin}${foto.foto}`);
          return resultado;
        }, {});
        setFotosPorBarberia(agrupadas);
        setErrorFotos("");
      })
      .catch((galleryError) => {
        if (activa) setErrorFotos(galleryError.message || "No se pudieron cargar las fotos de las barberías.");
      });

    return () => {
      activa = false;
    };
  }, [barberias]);

  // Cambia la imagen visible para que las fotos de cada barbería roten automáticamente.
  useEffect(() => {
    const intervalo = window.setInterval(() => setIndiceFoto((indice) => indice + 1), 5000);
    return () => window.clearInterval(intervalo);
  }, []);

  // Carga datos públicos de barberos y mapa solo para el local abierto.
  useEffect(() => {
    if (!barberiaDetalleId || detallesBarberia[barberiaDetalleId]) return undefined;
    const controller = new AbortController();
    setCargandoDetalle(true);
    setErrorDetalle("");
    fetch(`${BACKEND_URL}/barberias/detalle_publico.php?id_barberia=${encodeURIComponent(barberiaDetalleId)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.status !== "success" || !data.data?.barberia) {
          throw new Error(data.mensaje || "No se pudieron cargar los detalles de la barbería.");
        }
        setDetallesBarberia((actuales) => ({ ...actuales, [barberiaDetalleId]: data.data }));
      })
      .catch((detailError) => {
        if (detailError.name !== "AbortError") {
          setErrorDetalle(detailError.message || "No se pudieron cargar los detalles de la barbería.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargandoDetalle(false);
      });

    return () => controller.abort();
  }, [barberiaDetalleId, detallesBarberia]);

  // La cabecera toma el color de la sección que pasa por debajo al hacer scroll.
  const navRef = useRef(null);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const actualizarTono = () => {
      const limite = nav.getBoundingClientRect().bottom;
      let tono = "degradado";
      for (const seccion of document.querySelectorAll("[data-nav-tono]")) {
        if (seccion.getBoundingClientRect().top <= limite) tono = seccion.dataset.navTono;
      }
      if (nav.dataset.tono !== tono) nav.dataset.tono = tono;
    };
    actualizarTono();
    window.addEventListener("scroll", actualizarTono, { passive: true });
    window.addEventListener("resize", actualizarTono);
    return () => {
      window.removeEventListener("scroll", actualizarTono);
      window.removeEventListener("resize", actualizarTono);
    };
  }, []);

  // Cierra el detalle con Escape y evita que el scroll se desplace detrás del diálogo.
  useEffect(() => {
    if (!barberiaDetalleId) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setBarberiaDetalleId(null);
    };
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [barberiaDetalleId]);

  // Deriva opciones de ciudad y resultados sin duplicar datos del servidor.
  const ciudades = useMemo(
    () => [...new Set(barberias.map((barberia) => barberia.ciudad?.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es")),
    [barberias]
  );

  const barberiasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");
    return barberias.filter((barberia) => {
      const coincideCiudad = !ciudadSeleccionada || barberia.ciudad === ciudadSeleccionada;
      const texto = [barberia.nombre, barberia.direccion, barberia.ciudad]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");
      return coincideCiudad && (!termino || texto.includes(termino));
    });
  }, [barberias, busqueda, ciudadSeleccionada]);

  // Redirige a la reserva con el identificador del local elegido.
  const reservarEnBarberia = (barberia) => {
    setBarberiaDetalleId(null);
    navigate(`/reservar?barberia=${encodeURIComponent(barberia.id_barberia)}`);
  };

  const abrirDetalleBarberia = (idBarberia) => {
    setBarberiaDetalleId(idBarberia);
  };

  const detalleActivo = barberiaDetalleId ? detallesBarberia[barberiaDetalleId] : null;
  const barberiaActiva = barberias.find(
    (barberia) => Number(barberia.id_barberia) === Number(barberiaDetalleId)
  );
  const fotosDetalle = barberiaDetalleId
    ? fotosPorBarberia[String(barberiaDetalleId)] || []
    : [];
  const fotoDetalle = fotosDetalle.length > 0
    ? fotosDetalle[indiceFoto % fotosDetalle.length]
    : barberiaActiva?.foto
      ? `${IMAGE_BASE_URL}/${encodeURIComponent(barberiaActiva.foto)}`
      : "";

  return (
    <main className="barber-discovery-page">
      {/* Navegación pública hacia el catálogo y el perfil del cliente. */}
      <header className="discovery-nav" ref={navRef} data-tono="degradado">
        {/* Acceso discreto al panel SUPERADMIN: sin cursor, enlace ni foco visibles. */}
        <div className="discovery-brand" onClick={() => irAlPanelSuperadmin(navigate)}>
          <img src={logoBarberFaster} alt="BarberFaster" draggable="false" />
        </div>
        <nav aria-label="Navegación principal">
          <a href="#barberias">Barberías</a>
          <Link to="/cliente">Mi perfil</Link>
        </nav>
      </header>

      {/* Portada: una ventana enmarcada con el video y la invitación a reservar,
          cerrada por el titular grande en la banda petróleo. */}
      <section className="discovery-hero" data-nav-tono="degradado" aria-labelledby="discovery-title">
        <div className="hero-window">
          <div className="hero-window-stage">
            <div className="hero-window-media">
              <video
                className="discovery-hero-video"
                src={heroVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            </div>
            <div className="hero-window-copy">
              <p className="hero-lead">Tu próximo corte, reservado en pocos pasos.</p>
              <p className="discovery-intro">
                Elige la barbería, el barbero y la hora que te sirva. Sin llamadas ni filas.
              </p>
              {/* Búsqueda real desde la portada: filtra el listado y baja hasta él. */}
              <form
                className="hero-search"
                role="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  document.getElementById("barberias")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <label htmlFor="hero-busqueda">¿Qué barbería buscas?</label>
                <div className="hero-search-row">
                  <input
                    id="hero-busqueda"
                    type="search"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Nombre o calle"
                  />
                  <button className="btn-primary" type="submit">Buscar</button>
                </div>
              </form>
              <a className="hero-how" href="#pasos">¿Cómo funciona?</a>
            </div>
          </div>
          <div className="hero-window-band">
            <h1 id="discovery-title">
              <span className="discovery-title-line">Tu estilo.</span>
              <span className="discovery-title-line">Tu lugar.</span>
            </h1>
            <p className="hero-band-brand" aria-hidden="true">
              <span className="hero-band-brand-line">Barber</span>
              <span className="hero-band-brand-line">Faster</span>
            </p>
          </div>
        </div>
      </section>

      {/* Los tres pasos reales de una reserva, numerados con la tríada Bauhaus. */}
      <section className="discovery-steps" data-nav-tono="blanco" id="pasos" aria-labelledby="discovery-steps-title">
        <div className="discovery-steps-inner">
          <div className="discovery-section-heading">
            <div>
              <h2 id="discovery-steps-title">Reserva en 3 pasos</h2>
              <p>Sin crear una cuenta y desde tu teléfono.</p>
            </div>
          </div>
          <ol>
            <li>
              <svg className="step-icon" viewBox="0 0 84 84" aria-hidden="true" focusable="false">
                {/* Local: fachada con toldo naranja, puerta y vitrina. */}
                <rect className="si-ink" x="6" y="6" width="72" height="10" />
                <path
                  className="si-orange si-line"
                  d="M6 16H78V28a6 6 0 0 1-12 0a6 6 0 0 1-12 0a6 6 0 0 1-12 0a6 6 0 0 1-12 0a6 6 0 0 1-12 0a6 6 0 0 1-12 0Z"
                />
                <rect className="si-paper si-line" x="12" y="38" width="60" height="40" />
                <rect className="si-cyan si-line" x="20" y="50" width="18" height="28" />
                <rect className="si-cyan si-line" x="46" y="50" width="18" height="14" />
              </svg>
              <div>
                <strong>Elige tu barbería</strong>
                <span>Mira fotos, dirección y quiénes atienden.</span>
              </div>
            </li>
            <li>
              <svg className="step-icon" viewBox="0 0 84 84" aria-hidden="true" focusable="false">
                {/* Tijeras: hojas cruzadas y argollas cian. */}
                <path className="si-paper si-line" d="M33 58L66 6L72 11L41 62Z" />
                <path className="si-paper si-line" d="M51 58L18 6L12 11L43 62Z" />
                <circle className="si-ink" cx="42" cy="40" r="4" />
                <circle className="si-cyan si-line" cx="25" cy="66" r="13" />
                <circle className="si-paper si-line" cx="25" cy="66" r="5" />
                <circle className="si-cyan si-line" cx="59" cy="66" r="13" />
                <circle className="si-paper si-line" cx="59" cy="66" r="5" />
              </svg>
              <div>
                <strong>Elige barbero y servicio</strong>
                <span>Ves la duración y el precio antes de reservar.</span>
              </div>
            </li>
            <li>
              <svg className="step-icon" viewBox="0 0 84 84" aria-hidden="true" focusable="false">
                {/* Reloj: aro petróleo, marcas y manecillas. */}
                <circle className="si-ink" cx="42" cy="42" r="40" />
                <circle className="si-paper" cx="42" cy="42" r="31" />
                <path className="si-tick" d="M42 15V22M69 42H62M42 69V62M15 42H22" />
                <path className="si-hand si-hand--hour" d="M42 42L30 33" />
                <path className="si-hand si-hand--minute" d="M42 42V19" />
                <circle className="si-ink" cx="42" cy="42" r="4.5" />
              </svg>
              <div>
                <strong>Elige la hora y confirma</strong>
                <span>Paga en línea o al llegar al local.</span>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Filtros, estados de consulta y tarjetas con acciones de reserva. */}
      <section className="discovery-listing" data-nav-tono="cian" id="barberias" aria-labelledby="barber-list-title">
        <div className="discovery-section-heading">
          <div>
            <h2 id="barber-list-title">Barberías disponibles</h2>
            <p>Elige un local para ver sus barberos y reservar tu cita.</p>
          </div>
          {!cargando && !error && (
            <span className="discovery-result-count">
              {barberiasFiltradas.length} {barberiasFiltradas.length === 1 ? "lugar" : "lugares"}
            </span>
          )}
        </div>

        <div className="discovery-filters">
          <label className="discovery-search">
            <HugeiconsIcon icon={Search01Icon} size={22} strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar barbería o dirección"
              aria-label="Buscar barberías"
            />
          </label>
          <label className="discovery-city-filter">
            <span className="visually-hidden">Filtrar por ciudad</span>
            <select value={ciudadSeleccionada} onChange={(event) => setCiudadSeleccionada(event.target.value)}>
              <option value="">Todas las ciudades</option>
              {ciudades.map((ciudad) => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
            </select>
          </label>
        </div>

        {errorFotos && (
          <p className="discovery-photo-error" role="status">
            No se pudieron cargar las galerías de fotos: {errorFotos}
          </p>
        )}

        {cargando ? (
          <div className="discovery-state" role="status">Buscando barberías...</div>
        ) : error ? (
          <div className="discovery-state discovery-state-error" role="alert">
            <strong>No pudimos cargar los locales.</strong>
            <span>{error}</span>
            <button type="button" onClick={() => window.location.reload()}>Intentar de nuevo</button>
          </div>
        ) : barberiasFiltradas.length === 0 ? (
          <div className="discovery-state">
            <HugeiconsIcon className="discovery-empty-icon" icon={ScissorIcon} size={22} strokeWidth={2} aria-hidden="true" />
            <strong>{barberias.length ? "No encontramos coincidencias" : "Pronto habrá barberías disponibles"}</strong>
            <span>{barberias.length ? "Prueba con otro nombre o ciudad." : "Vuelve pronto para encontrar tu próximo estilo."}</span>
            {barberias.length > 0 && (
              <button type="button" onClick={() => { setBusqueda(""); setCiudadSeleccionada(""); }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="discovery-grid">
            {barberiasFiltradas.map((barberia) => {
              const fotos = fotosPorBarberia[String(barberia.id_barberia)] || [];
              const fotoCarrusel = fotos.length > 0
                ? fotos[indiceFoto % fotos.length]
                : barberia.foto
                  ? `${IMAGE_BASE_URL}/${encodeURIComponent(barberia.foto)}`
                  : "";
              return (
                <article
                  className="discovery-card"
                  key={barberia.id_barberia}
                >
                  <div className="discovery-card-image">
                    {fotoCarrusel ? (
                      <img
                        key={fotoCarrusel}
                        src={fotoCarrusel}
                        alt=""
                        loading="lazy"
                        onError={(event) => { event.currentTarget.hidden = true; }}
                      />
                    ) : (
                      <span className="discovery-card-placeholder" aria-hidden="true">
                        <HugeiconsIcon icon={ScissorIcon} size={22} strokeWidth={2} />
                      </span>
                    )}
                  </div>

                  <div className="discovery-card-content">
                    <div className="discovery-card-title-row">
                      <h3>{barberia.nombre}</h3>
                      <span
                        className="discovery-rating"
                        aria-label={Number(barberia.cantidad_calificaciones) > 0
                          ? `Calificación promedio: ${Number(barberia.calificacion_promedio).toFixed(1)} de 5`
                          : "Esta barbería aún no tiene calificaciones"}
                        title={Number(barberia.cantidad_calificaciones) > 0
                          ? `${barberia.cantidad_calificaciones} calificaciones de sus barberos`
                          : "Sin calificaciones"}
                      >
                        <HugeiconsIcon icon={StarIcon} size={20} strokeWidth={2.2} aria-hidden="true" />
                        <span>{Number(barberia.cantidad_calificaciones) > 0
                          ? Number(barberia.calificacion_promedio).toFixed(1)
                          : "Nuevo"}</span>
                      </span>
                    </div>
                    <p className="discovery-card-location">
                      <HugeiconsIcon icon={Location01Icon} size={22} strokeWidth={2} aria-hidden="true" />
                      <span>{[barberia.direccion, barberia.ciudad].filter(Boolean).join(", ") || "Ubicación por confirmar"}</span>
                    </p>
                    {barberia.telefono && (
                      <a className="discovery-card-phone" href={`tel:${barberia.telefono}`}>
                        <HugeiconsIcon icon={CallIcon} size={22} strokeWidth={2} aria-hidden="true" /> {barberia.telefono}
                      </a>
                    )}
                    <div className="discovery-card-footer">
                      <button
                        className="discovery-details-button"
                        type="button"
                        onClick={() => abrirDetalleBarberia(barberia.id_barberia)}
                        aria-haspopup="dialog"
                      >
                        Ver detalles
                      </button>
                      <button className="btn-primary" type="button" onClick={() => reservarEnBarberia(barberia)}>
                        Reservar cita
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {barberiaDetalleId && createPortal(
        <div
          className="discovery-detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBarberiaDetalleId(null);
          }}
        >
          <section
            className="discovery-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discovery-detail-title"
          >
            <button
              className="discovery-detail-close"
              type="button"
              onClick={() => setBarberiaDetalleId(null)}
              aria-label="Cerrar detalles de barbería"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={22} strokeWidth={2} aria-hidden="true" />
            </button>
            {cargandoDetalle && !detalleActivo ? (
              <p className="discovery-detail-status" role="status">Cargando información de la barbería...</p>
            ) : errorDetalle ? (
              <div className="discovery-detail-status error" role="alert">
                <p>{errorDetalle}</p>
                <button type="button" onClick={() => setDetallesBarberia((actuales) => {
                  const actualizados = { ...actuales };
                  delete actualizados[barberiaDetalleId];
                  return actualizados;
                })}>
                  Intentar de nuevo
                </button>
              </div>
            ) : detalleActivo && (
              <>
                <div className="discovery-detail-heading">
                  <h2 id="discovery-detail-title">{detalleActivo.barberia.nombre}</h2>
                  <p>
                    {[detalleActivo.barberia.ciudad, detalleActivo.barberia.direccion]
                      .filter(Boolean)
                      .join(", ") || "Ubicación por confirmar"}
                  </p>
                </div>
                <div className="discovery-detail-layout">
                  <div className="discovery-detail-main">
                    <div className="discovery-detail-photo">
                      {fotoDetalle ? (
                        <img src={fotoDetalle} alt={`Barbería ${detalleActivo.barberia.nombre}`} />
                      ) : (
                        <HugeiconsIcon icon={ScissorIcon} size={22} strokeWidth={2} aria-hidden="true" />
                      )}
                    </div>
                    <div className="discovery-detail-facts">
                      {detalleActivo.barberia.descripcion && (
                        <p>{detalleActivo.barberia.descripcion}</p>
                      )}
                      {detalleActivo.barberia.telefono && (
                        <a href={`tel:${detalleActivo.barberia.telefono}`}>
                          <HugeiconsIcon icon={CallIcon} size={22} strokeWidth={2} aria-hidden="true" /> {detalleActivo.barberia.telefono}
                        </a>
                      )}
                      {(detalleActivo.barberia.hora_apertura || detalleActivo.barberia.hora_cierre) && (
                        <span>
                          Horario general: {detalleActivo.barberia.hora_apertura?.slice(0, 5) || "—"}
                          {" – "}
                          {detalleActivo.barberia.hora_cierre?.slice(0, 5) || "—"}
                        </span>
                      )}
                    </div>
                    <div className="discovery-detail-barbers">
                      <h3>Barberos</h3>
                      {detalleActivo.barberos.length === 0 ? (
                        <p>No hay barberos activos registrados.</p>
                      ) : (
                        <div className="discovery-detail-barber-list">
                          {detalleActivo.barberos.map((barbero) => {
                            const fotoBarbero = barbero.foto
                              ? /^https?:\/\//i.test(barbero.foto)
                                ? barbero.foto
                                : barbero.foto.startsWith("/")
                                  ? `${window.location.origin}${barbero.foto}`
                                  : `${IMAGE_BASE_URL}/${encodeURIComponent(barbero.foto)}`
                              : "";
                            return (
                              <article className="discovery-detail-barber" key={barbero.id_barbero}>
                                {fotoBarbero ? (
                                  <img src={fotoBarbero} alt="" loading="lazy" />
                                ) : (
                                  <span className="discovery-detail-barber-placeholder" aria-hidden="true">
                                    {barbero.nombre?.charAt(0)?.toUpperCase() || "B"}
                                  </span>
                                )}
                                <div>
                                  <strong>{[barbero.nombre, barbero.apellido].filter(Boolean).join(" ")}</strong>
                                  <span>{barbero.especialidad || "Barbero"}</span>
                                </div>
                                {Number(barbero.cantidad_calificaciones) > 0 && (
                                  <span className="discovery-detail-barber-rating">
                                    <HugeiconsIcon icon={StarIcon} size={22} strokeWidth={2} aria-hidden="true" />{" "}
                                    {Number(barbero.calificacion_promedio).toFixed(1)}
                                  </span>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="discovery-detail-map">
                    <h3>Ubicación</h3>
                    {detalleActivo.barberia.url_mapa ? (
                      <iframe
                        src={detalleActivo.barberia.url_mapa}
                        title={`Mapa de ${detalleActivo.barberia.nombre}`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <p>Esta barbería aún no ha configurado su mapa.</p>
                    )}
                  </div>
                </div>
                <div className="discovery-detail-actions">
                  <button className="btn-primary" type="button" onClick={() => reservarEnBarberia(barberiaActiva)}>
                    Reservar en esta barbería
                  </button>
                </div>
              </>
            )}
          </section>
        </div>,
        document.body
      )}

      <section className="discovery-trust" data-nav-tono="petroleo" aria-labelledby="discovery-trust-title">
        <div className="discovery-trust-inner">
          <div className="discovery-section-heading">
            <div>
              <h2 id="discovery-trust-title">Reserva con confianza</h2>
              <p>Lo que pasa después de tocar «Reservar».</p>
            </div>
          </div>
          <ul>
            <li>
              <span className="trust-icon" aria-hidden="true"><HugeiconsIcon icon={WhatsappIcon} size={22} strokeWidth={2} /></span>
              <div>
                <strong>Verificamos tu número por WhatsApp</strong>
                <span>Te llega un código; así la cita queda a tu nombre.</span>
              </div>
            </li>
            <li>
              <span className="trust-icon" aria-hidden="true"><HugeiconsIcon icon={CreditCardIcon} size={22} strokeWidth={2} /></span>
              <div>
                <strong>Pagas como prefieras</strong>
                <span>En línea con Wompi o directamente en el local.</span>
              </div>
            </li>
            <li>
              <span className="trust-icon" aria-hidden="true"><HugeiconsIcon icon={Calendar03Icon} size={22} strokeWidth={2} /></span>
              <div>
                <strong>Cambias o cancelas tu cita</strong>
                <span>Desde «Mi perfil», cuando lo necesites.</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <BarberiaBenefits />

      {/* Acceso al área de negocios; el panel superadmin no se publica aquí. */}
      <footer className="discovery-footer" data-nav-tono="petroleo">
        <img src={logoBarberFaster} alt="BarberFaster" width="112" height="60" draggable="false" />
        <span>Tu estilo, a tu tiempo.</span>
        <Link to="/login">Acceso para negocios</Link>
      </footer>
    </main>
  );
}

export default BarberiaDiscovery;

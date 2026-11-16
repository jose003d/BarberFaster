import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faScissors, faStar } from "@fortawesome/free-solid-svg-icons";
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
      <header className="discovery-nav">
        <Link className="discovery-brand" to="/" aria-label="BarberFaster, inicio">
          <img src={logoBarberFaster} alt="BarberFaster" />
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#barberias">Barberías</a>
          <Link to="/cliente">Mi perfil</Link>
        </nav>
      </header>

      {/* Mensaje de bienvenida y acceso directo al listado de locales. */}
      <section className="discovery-hero" aria-labelledby="discovery-title">
        <div className="discovery-hero-layout">
          <div className="discovery-hero-content">
            <p className="discovery-eyebrow"><span>01</span> BARBERFASTER · RESERVA TU CITA</p>
            <h1 id="discovery-title">Tu estilo.<br /><em>Tu lugar.</em></h1>
            <p className="discovery-intro">
              Encuentra una barbería cerca de ti y reserva tu próxima cita.
            </p>
            <a className="discovery-hero-link" href="#barberias">EXPLORAR LOCALES <span aria-hidden="true">↘</span></a>
          </div>
          <div className="discovery-hero-media">
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
        </div>
      </section>

      {/* Filtros, estados de consulta y tarjetas con acciones de reserva. */}
      <section className="discovery-listing" id="barberias" aria-labelledby="barber-list-title">
        <div className="discovery-section-heading">
          <div>
            <p className="discovery-eyebrow"><span>02</span> ENCUENTRA TU BARBERÍA</p>
            <h2 id="barber-list-title">Barberías disponibles</h2>
            <p>Selecciona un local para reservar tu cita.</p>
          </div>
          {!cargando && !error && (
            <span className="discovery-result-count">
              {barberiasFiltradas.length} {barberiasFiltradas.length === 1 ? "lugar" : "lugares"}
            </span>
          )}
        </div>

        <div className="discovery-filters">
          <label className="discovery-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por nombre, dirección o ciudad"
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
            <FontAwesomeIcon className="discovery-empty-icon" icon={faScissors} aria-hidden="true" />
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
                        <FontAwesomeIcon icon={faScissors} />
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
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                        </svg>
                        <span>{Number(barberia.cantidad_calificaciones) > 0
                          ? Number(barberia.calificacion_promedio).toFixed(1)
                          : "—"}</span>
                      </span>
                    </div>
                    <p className="discovery-card-location">
                      {[barberia.ciudad, barberia.direccion].filter(Boolean).join(" · ") || "Ubicación por confirmar"}
                    </p>
                    {barberia.telefono && (
                      <a className="discovery-card-phone" href={`tel:${barberia.telefono}`}>
                        <FontAwesomeIcon icon={faPhone} aria-hidden="true" /> {barberia.telefono}
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
                      <button type="button" onClick={() => reservarEnBarberia(barberia)}>
                        Reservar <span aria-hidden="true">→</span>
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
              ×
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
                  <p className="discovery-eyebrow">Conoce el establecimiento</p>
                  <h2 id="discovery-detail-title">{detalleActivo.barberia.nombre}</h2>
                  <p>
                    {[detalleActivo.barberia.ciudad, detalleActivo.barberia.direccion]
                      .filter(Boolean)
                      .join(" · ") || "Ubicación por confirmar"}
                  </p>
                </div>
                <div className="discovery-detail-layout">
                  <div className="discovery-detail-main">
                    <div className="discovery-detail-photo">
                      {fotoDetalle ? (
                        <img src={fotoDetalle} alt={`Barbería ${detalleActivo.barberia.nombre}`} />
                      ) : (
                        <FontAwesomeIcon icon={faScissors} aria-hidden="true" />
                      )}
                    </div>
                    <div className="discovery-detail-facts">
                      {detalleActivo.barberia.descripcion && (
                        <p>{detalleActivo.barberia.descripcion}</p>
                      )}
                      {detalleActivo.barberia.telefono && (
                        <a href={`tel:${detalleActivo.barberia.telefono}`}>
                          <FontAwesomeIcon icon={faPhone} aria-hidden="true" /> {detalleActivo.barberia.telefono}
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
                                    <FontAwesomeIcon icon={faStar} aria-hidden="true" />{" "}
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
                  <button type="button" onClick={() => reservarEnBarberia(barberiaActiva)}>
                    Reservar en esta barbería <span aria-hidden="true">→</span>
                  </button>
                </div>
              </>
            )}
          </section>
        </div>,
        document.body
      )}

      <BarberiaBenefits />

      {/* Acceso al área de negocios; el panel superadmin no se publica aquí. */}
      <footer className="discovery-footer">
        <span>BARBERFASTER · Tu estilo, a tu tiempo.</span>
        <Link to="/login">Acceso para negocios</Link>
      </footer>
    </main>
  );
}

export default BarberiaDiscovery;

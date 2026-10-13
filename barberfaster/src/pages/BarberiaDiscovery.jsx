import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { obtenerBarberias } from "../services/api";
import "./BarberiaDiscovery.css";

const IMAGE_BASE_URL = "/erpbarber/barberfaster/backend/uploads";

// Permite buscar barberías por texto o ciudad y empezar una reserva pública.
function BarberiaDiscovery() {
  // Conserva locales, filtros y estados de carga/error de la consulta inicial.
  const [barberias, setBarberias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
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
    navigate(`/reservar?barberia=${encodeURIComponent(barberia.id_barberia)}`);
  };

  return (
    <main className="barber-discovery-page">
      {/* Navegación pública hacia el catálogo y el acceso de negocios. */}
      <header className="discovery-nav">
        <Link className="discovery-brand" to="/" aria-label="BarberFaster, inicio">
          <span>BARBER<span>FASTER</span></span>
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#barberias">Barberías</a>
          <Link className="discovery-login" to="/login">Ingresar</Link>
        </nav>
      </header>

      {/* Mensaje de bienvenida y acceso directo al listado de locales. */}
      <section className="discovery-hero" aria-labelledby="discovery-title">
        <div className="discovery-hero-content">
          <p className="discovery-eyebrow"><span>01</span> BARBERFASTER · RESERVA TU CITA</p>
          <h1 id="discovery-title">Tu estilo.<br /><em>Tu lugar.</em></h1>
          <p className="discovery-intro">
            Encuentra una barbería cerca de ti y reserva tu próxima cita.
          </p>
          <a className="discovery-hero-link" href="#barberias">EXPLORAR LOCALES <span aria-hidden="true">↘</span></a>
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
            <span className="discovery-empty-icon" aria-hidden="true">✂</span>
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
            {barberiasFiltradas.map((barberia) => (
              <article className="discovery-card" key={barberia.id_barberia}>
                <div className="discovery-card-image">
                  {barberia.foto ? (
                    <img
                      src={`${IMAGE_BASE_URL}/${encodeURIComponent(barberia.foto)}`}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className="discovery-card-placeholder" aria-hidden="true">
                      <span>✂</span>
                    </span>
                  )}
                </div>

                <div className="discovery-card-content">
                  <div className="discovery-card-title-row">
                    <h3>{barberia.nombre}</h3>
                    <span className="discovery-open-indicator" aria-label="Disponible" title="Disponible para reservar" />
                  </div>
                  <p className="discovery-card-location">
                    {[barberia.ciudad, barberia.direccion].filter(Boolean).join(" · ") || "Ubicación por confirmar"}
                  </p>
                  <div className="discovery-card-footer">
                    {barberia.telefono && <a href={`tel:${barberia.telefono}`}>☎ {barberia.telefono}</a>}
                    <button type="button" onClick={() => reservarEnBarberia(barberia)}>
                      Reservar <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Acceso al área de negocios desde el pie de la página pública. */}
      <footer className="discovery-footer">
        <span>BARBERFASTER · Tu estilo, a tu tiempo.</span>
        <Link to="/login">Acceso para negocios</Link>
      </footer>
    </main>
  );
}

export default BarberiaDiscovery;

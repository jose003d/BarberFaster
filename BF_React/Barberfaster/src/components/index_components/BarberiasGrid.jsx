import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

const BarberiasGrid = () => {
  const [barberias, setBarberias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el buscador y el filtro de ciudades
  const [busqueda, setBusqueda] = useState("");
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("");

  // Lista de ciudades actuales
  const ciudadesPermitidas = [
    "Sonsón",
    "Medellín",
    "Nariño",
    "Argelia",
    "Rionegro",
    "La Ceja",
  ];

  useEffect(() => {
    const fetchBarberias = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/barberias");
        const contentType = response.headers.get("content-type");

        if (
          response.ok &&
          contentType &&
          contentType.includes("application/json")
        ) {
          const data = await response.json();
          setBarberias(data);
        } else {
          setBarberias([]);
        }
      } catch (error) {
        setBarberias([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBarberias();
  }, []);

  // Filtrado local optimizado para texto y ciudad
  const barberiasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return barberias.filter((barberia) => {
      const coincideCiudad =
        !ciudadSeleccionada ||
        (barberia.ciudad || barberia.ubicacion)?.includes(ciudadSeleccionada);

      const texto =
        `${barberia.nombre} ${barberia.direccion || ""} ${barberia.ubicacion || ""} ${barberia.ciudad || ""}`.toLowerCase();
      const coincideTexto = !termino || texto.includes(termino);

      return coincideCiudad && coincideTexto;
    });
  }, [barberias, busqueda, ciudadSeleccionada]);

  return (
    <main className="container pb-5">
      {/* Título */}
      <div className="mb-4 text-start" data-aos="fade-up">
        <h2
          className="section-title"
          style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.8rem)" }}
        >
          BARBERÍAS DISPONIBLES
        </h2>
        {/* El title::after genera la línea naranja */}
        <p className="mt-3" style={{ color: "#626267", fontSize: "0.95rem" }}>
          Selecciona un local para reservar tu cita.
        </p>
      </div>

      {/* Barra de búsqueda y filtro de ciudades */}
      <div className="discovery-filters mb-5" data-aos="fade-up">
        <label className="discovery-search">
          <span
            aria-hidden="true"
            style={{
              transform: "rotate(-45deg)",
              display: "inline-block",
              color: "var(--bauhaus-orange)",
            }}
          >
            ⚲
          </span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="BUSCAR POR NOMBRE, DIRECCIÓN O CIUDAD"
            aria-label="Buscar barberías"
          />
        </label>
        <label className="discovery-city-filter">
          <span className="visually-hidden">Filtrar por ciudad</span>
          <select
            value={ciudadSeleccionada}
            onChange={(e) => setCiudadSeleccionada(e.target.value)}
          >
            <option value="">TODAS LAS CIUDADES</option>
            {ciudadesPermitidas.map((ciudad) => (
              <option key={ciudad} value={ciudad}>
                {ciudad}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Grid de tarjetas */}
      <div className="clientes-cards-wrap" data-aos="fade-up">
        <div className="row g-4">
          {loading ? (
            <div className="text-center py-5 w-100">
              <div
                className="spinner-border"
                style={{ color: "var(--bauhaus-orange)" }}
                role="status"
              >
                <span className="visually-hidden">Cargando barberías...</span>
              </div>
            </div>
          ) : barberiasFiltradas.length > 0 ? (
            barberiasFiltradas.map((barberia) => (
              <div
                className="col-lg-4 col-md-6"
                key={barberia.id || barberia.slug}
              >
                <article className="service-card d-flex flex-column h-100">
                  {/* Parte superior de la tarjeta */}
                  <div className="discovery-card-image">
                    {barberia.logo || barberia.foto ? (
                      <img
                        src={barberia.logo || barberia.foto}
                        alt={barberia.nombre}
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="discovery-card-placeholder"
                        aria-hidden="true"
                      >
                        ✂
                      </span>
                    )}
                  </div>

                  {/* Parte inferior de la tarjeta */}
                  <div className="p-3 d-flex flex-column flex-grow-1">
                    <div className="discovery-card-title-row">
                      <h3 className="card-title mb-0">{barberia.nombre}</h3>
                      <span
                        className="discovery-open-indicator"
                        aria-label="Disponible"
                        title="Disponible para reservar"
                      />
                    </div>

                    <p className="discovery-card-location">
                      {[
                        barberia.ubicacion || barberia.ciudad,
                        barberia.direccion,
                      ]
                        .filter(Boolean)
                        .join(" - ") || "Ubicación por confirmar"}
                    </p>

                    <div className="discovery-card-footer">
                      <span>☎ {barberia.telefono || "Sin teléfono"}</span>
                      <Link
                        to={`/reservar?barberia=${barberia.id || barberia.slug}`}
                        className="custom-btn"
                        style={{
                          padding: "6px 14px",
                          fontSize: "0.8rem",
                          textDecoration: "none",
                        }}
                      >
                        RESERVAR →
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            ))
          ) : (
            <div
              className="no-results text-center py-5 w-100"
              style={{
                border: "2px solid var(--bauhaus-ink)",
                backgroundColor: "var(--bauhaus-neutral)",
              }}
            >
              <i
                className="bi bi-search"
                style={{ fontSize: "2rem", color: "var(--bauhaus-orange)" }}
              ></i>
              <h4
                className="mt-2"
                style={{
                  color: "var(--bauhaus-ink)",
                  fontFamily: "'Chillax', sans-serif",
                }}
              >
                No se encontraron barberías
              </h4>
              <p>
                Intenta con otro término de búsqueda o seleccionando "Todas las
                ciudades".
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default BarberiasGrid;

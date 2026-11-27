import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BASE_URL } from "../../../shared/services/api.js";
import "./BarberoDetalleModal.css";

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function iniciales(nombre = "") {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toLocaleUpperCase("es"))
    .join("") || "B";
}

// Detalle público de un barbero al reservar: foto, descripción, portafolio, servicios y calificación.
// "barbero" es la fila de listar_barberos.php; el perfil y los servicios se consultan al abrir.
export default function BarberoDetalleModal({ barbero, fotoUrl = "", onCerrar, onElegir }) {
  const idBarbero = barbero.id_barbero || barbero.id;
  const nombre = [barbero.nombre || barbero.nombre_barbero, barbero.apellido].filter(Boolean).join(" ") || "Barbero";
  const cantidadCalificaciones = Number(barbero.cantidad_calificaciones) || 0;

  const [perfil, setPerfil] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  // Consulta perfil y servicios del barbero en paralelo.
  useEffect(() => {
    let activo = true;
    const id = encodeURIComponent(idBarbero);
    setCargando(true);
    setError("");

    Promise.all([
      fetch(`${BASE_URL}/barberos/perfil.php?id_barbero=${id}`, { cache: "no-store" }).then((res) => res.json()),
      fetch(`${BASE_URL}/servicios/servicios_por_barbero.php?id_barbero=${id}`, { cache: "no-store" })
        .then((res) => res.json())
        .catch(() => ({ servicios: [] })),
    ])
      .then(([respuestaPerfil, respuestaServicios]) => {
        if (!activo) return;
        if (respuestaPerfil.status !== "success") {
          throw new Error(respuestaPerfil.mensaje || "No se pudo cargar el perfil del barbero.");
        }
        setPerfil(respuestaPerfil.datos);
        const lista = Array.isArray(respuestaServicios)
          ? respuestaServicios
          : respuestaServicios.servicios || respuestaServicios.datos || [];
        setServicios(lista);
      })
      .catch((errorCarga) => {
        if (activo) setError(errorCarga.message || "No se pudo cargar el perfil del barbero.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [idBarbero]);

  // Escape cierra (primero la foto ampliada) y el fondo no se desplaza mientras está abierta.
  useEffect(() => {
    const alPresionar = (event) => {
      if (event.key !== "Escape") return;
      if (fotoAmpliada) setFotoAmpliada(null);
      else onCerrar();
    };
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", alPresionar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", alPresionar);
    };
  }, [fotoAmpliada, onCerrar]);

  const foto = perfil?.foto || fotoUrl;
  const portafolio = perfil?.portafolio || [];

  return createPortal(
    <div
      className="barbero-detalle-fondo"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <section className="barbero-detalle" role="dialog" aria-modal="true" aria-labelledby="barbero-detalle-titulo">
        <button className="barbero-detalle-cerrar" type="button" onClick={onCerrar} aria-label="Cerrar perfil del barbero">
          ×
        </button>

        <header className="barbero-detalle-encabezado">
          <div className="barbero-detalle-avatar">
            {foto ? <img src={foto} alt={`Foto de ${nombre}`} /> : <span aria-hidden="true">{iniciales(nombre)}</span>}
          </div>
          <div>
            <h2 id="barbero-detalle-titulo">{nombre}</h2>
            <p className="barbero-detalle-calificacion">
              {cantidadCalificaciones > 0 ? (
                <>
                  <span aria-hidden="true">★</span>
                  {" "}{Number(barbero.calificacion_promedio).toFixed(1)}
                  <small>
                    {" "}· {cantidadCalificaciones} {cantidadCalificaciones === 1 ? "calificación" : "calificaciones"}
                  </small>
                </>
              ) : (
                "Nuevo en BarberFaster"
              )}
            </p>
          </div>
        </header>

        {cargando ? (
          <p className="barbero-detalle-estado" role="status">Cargando el perfil…</p>
        ) : error ? (
          <p className="barbero-detalle-estado error" role="alert">{error}</p>
        ) : (
          <div className="barbero-detalle-cuerpo">
            <section aria-labelledby="barbero-detalle-sobre">
              <h3 id="barbero-detalle-sobre">Sobre {nombre.split(" ")[0]}</h3>
              <p className="barbero-detalle-descripcion">
                {perfil?.descripcion || "Este barbero aún no ha escrito su descripción."}
              </p>
            </section>

            <section aria-labelledby="barbero-detalle-portafolio">
              <h3 id="barbero-detalle-portafolio">Portafolio</h3>
              {portafolio.length > 0 ? (
                <ul className="barbero-detalle-galeria">
                  {portafolio.map((item, indice) => (
                    <li key={item.id_foto}>
                      <button
                        type="button"
                        onClick={() => setFotoAmpliada(item)}
                        aria-label={`Ampliar trabajo ${indice + 1} de ${portafolio.length}`}
                      >
                        <img src={item.foto} alt="" loading="lazy" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="barbero-detalle-vacio">Aún no hay fotos de sus trabajos.</p>
              )}
            </section>

            <section aria-labelledby="barbero-detalle-servicios">
              <h3 id="barbero-detalle-servicios">Servicios</h3>
              {servicios.length > 0 ? (
                <ul className="barbero-detalle-servicios">
                  {servicios.map((servicio) => (
                    <li key={servicio.id_servicio || servicio.id}>
                      <div>
                        <strong>{servicio.nombre}</strong>
                        {Number(servicio.duracion_minutos) > 0 && <span>{servicio.duracion_minutos} min</span>}
                      </div>
                      <span className="barbero-detalle-precio">{formatoPrecio.format(Number(servicio.precio) || 0)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="barbero-detalle-vacio">Aún no tiene servicios asignados.</p>
              )}
            </section>
          </div>
        )}

        <footer className="barbero-detalle-acciones">
          <button className="btn-secondary" type="button" onClick={onCerrar}>Ver otros barberos</button>
          <button className="btn-primary" type="button" onClick={onElegir} disabled={cargando}>
            Reservar con {nombre.split(" ")[0]}
          </button>
        </footer>

        {fotoAmpliada && (
          <div
            className="barbero-detalle-visor"
            role="dialog"
            aria-modal="true"
            aria-label="Trabajo ampliado"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setFotoAmpliada(null);
            }}
          >
            <img src={fotoAmpliada.foto} alt={`Trabajo de ${nombre}`} />
            <button type="button" onClick={() => setFotoAmpliada(null)} aria-label="Cerrar foto">×</button>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}

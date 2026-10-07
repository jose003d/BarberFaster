import React, { useState, useEffect } from "react";
import Barberos from "./Barberos"; // Importa tu componente de gestión de personal y servicios
import "./Dashboard.css";

// Usar localhost para coincidir con el dominio de Vite (http://localhost:5173)
const BASE_URL = "http://localhost/erpbarber/barberfaster/backend";

export default function Dashboard() {
  // Control de pestañas: 'metricas' | 'asignaciones' | 'perfil'
  const [tabActiva, setTabActiva] = useState("perfil");

  // Estado del Perfil de la Barbería
  const [perfil, setPerfil] = useState({
    descripcion: "",
    direccion: "",
    url_mapa: "",
    hora_apertura: "08:00",
    hora_cierre: "19:00",
  });

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);

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
          setPerfil({
            descripcion: data.data.descripcion || "",
            direccion: data.data.direccion || "",
            url_mapa: data.data.url_mapa || "",
            hora_apertura: data.data.hora_apertura ? data.data.hora_apertura.substring(0, 5) : "08:00",
            hora_cierre: data.data.hora_cierre ? data.data.hora_cierre.substring(0, 5) : "19:00",
          });
        } else {
          setMensaje({ tipo: "error", texto: data.mensaje || "Error al obtener perfil." });
        }
      })
      .catch((err) => {
        console.error("Detalle del error:", err);
        setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor o la respuesta no es válida." });
      })
      .finally(() => setCargando(false));
  };

  const guardarPerfil = (e) => {
    e.preventDefault();
    setMensaje(null);

    const payload = {
      id_barberia: obtenerBarberiaActivaId(),
      descripcion: perfil.descripcion,
      direccion: perfil.direccion,
      url_mapa: perfil.url_mapa,
      hora_apertura: `${perfil.hora_apertura}:00`,
      hora_cierre: `${perfil.hora_cierre}:00`,
    };

    fetch(`${BASE_URL}/barberias/perfil.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setMensaje({ tipo: "success", texto: "¡Información del perfil y horarios guardados con éxito!" });
          setTimeout(() => setMensaje(null), 3500);
        } else {
          setMensaje({ tipo: "error", texto: data.mensaje || "Error al actualizar la información." });
        }
      })
      .catch((err) => {
        console.error("Error al guardar:", err);
        setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
      });
  };

  return (
    <div className="page-section dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">BarberFaster · Administración</p>
          <h1>Panel de control</h1>
          <p className="dashboard-description">Administra la operación y la información de tu barbería.</p>
        </div>

        <nav className="dashboard-tabs" aria-label="Secciones del panel">
          <button
            type="button"
            className={tabActiva === "metricas" ? "active" : ""}
            onClick={() => setTabActiva("metricas")}
            aria-pressed={tabActiva === "metricas"}
          >
            📊 Métricas
          </button>

          <button
            type="button"
            className={tabActiva === "asignaciones" ? "active" : ""}
            onClick={() => setTabActiva("asignaciones")}
            aria-pressed={tabActiva === "asignaciones"}
          >
            ✂️ Asignaciones y Personal
          </button>

          <button
            type="button"
            className={tabActiva === "perfil" ? "active" : ""}
            onClick={() => setTabActiva("perfil")}
            aria-pressed={tabActiva === "perfil"}
          >
            🏢 Perfil del Establecimiento
          </button>
        </nav>
      </header>

      {mensaje && (
        <p className={`dashboard-message ${mensaje.tipo}`}>
          {mensaje.texto}
        </p>
      )}

      {/* PESTAÑA 1: MÉTRICAS */}
      {tabActiva === "metricas" && (
        <section className="dashboard-panel">
          <p className="dashboard-eyebrow">Tu negocio</p>
          <h2>📊 Métricas del negocio</h2>
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

      {/* PESTAÑA 2: ASIGNACIONES Y PERSONAL */}
      {tabActiva === "asignaciones" && (
        <div>
          <Barberos />
        </div>
      )}

      {/* PESTAÑA 3: PERFIL DE LA BARBERÍA Y HORARIO */}
      {tabActiva === "perfil" && (
        <section className="dashboard-panel">
          <p className="dashboard-eyebrow">Información pública</p>
          <h2>🏢 Perfil e información de la barbería</h2>
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
                    onChange={(e) => setPerfil({ ...perfil, url_mapa: e.target.value })}
                    placeholder="Ej. https://www.google.com/maps/embed?pb=..."
                  />
                </div>

                {/* HORA APERTURA */}
                <div className="dashboard-field">
                  <label htmlFor="dashboard-opening-time">Hora de apertura general:</label>
                  <input
                    id="dashboard-opening-time"
                    type="time"
                    value={perfil.hora_apertura}
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
                    onChange={(e) => setPerfil({ ...perfil, hora_cierre: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* VISTA PREVIA MAPA */}
              {perfil.url_mapa && (
                <div className="dashboard-map-preview">
                  <label htmlFor="dashboard-map-preview">Vista previa de la ubicación:</label>
                  <iframe
                    id="dashboard-map-preview"
                    src={perfil.url_mapa}
                    width="100%"
                    height="200"
                    allowFullScreen=""
                    loading="lazy"
                    title="Ubicacion Barberia"
                  ></iframe>
                </div>
              )}

              <div className="dashboard-form-actions">
                <button type="submit" className="btn">
                  Guardar Perfil de Barbería
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
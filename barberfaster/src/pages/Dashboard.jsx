import React, { useState, useEffect } from "react";
import Barberos from "./Barberos"; // Importa tu componente de gestión de personal y servicios

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
    <div className="page-section" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* CABECERA PRINCIPAL Y NAVEGACIÓN */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Dashboard BarberFaster</h1>
          <p style={{ color: "#666", margin: "4px 0 0 0" }}>Panel Administrativo del Establecimiento</p>
        </div>

        {/* CONTROLES DE PESTAÑAS */}
        <div style={{ display: "flex", gap: "10px", background: "#f3f4f6", padding: "6px", borderRadius: "12px" }}>
          <button
            type="button"
            onClick={() => setTabActiva("metricas")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: tabActiva === "metricas" ? "#d4af37" : "transparent",
              color: tabActiva === "metricas" ? "#111" : "#4b5563",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            📊 Métricas
          </button>

          <button
            type="button"
            onClick={() => setTabActiva("asignaciones")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: tabActiva === "asignaciones" ? "#d4af37" : "transparent",
              color: tabActiva === "asignaciones" ? "#111" : "#4b5563",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ✂️ Asignaciones y Personal
          </button>

          <button
            type="button"
            onClick={() => setTabActiva("perfil")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: tabActiva === "perfil" ? "#d4af37" : "transparent",
              color: tabActiva === "perfil" ? "#111" : "#4b5563",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🏢 Perfil del Establecimiento
          </button>
        </div>
      </div>

      {mensaje && (
        <p
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: mensaje.tipo === "success" ? "#f0fdf4" : "#fef2f2",
            color: mensaje.tipo === "success" ? "#166534" : "#991b1b",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          {mensaje.texto}
        </p>
      )}

      {/* PESTAÑA 1: MÉTRICAS */}
      {tabActiva === "metricas" && (
        <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
          <h2>📊 Métricas del Negocio</h2>
          <p style={{ color: "#666" }}>Resumen estadístico de citas reservadas e ingresos generados.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "20px" }}>
            <div style={{ background: "#fdf8e1", padding: "20px", borderRadius: "12px", border: "1px solid #fef08a" }}>
              <span style={{ fontSize: "0.85rem", color: "#854d0e" }}>Total Citas Reservadas</span>
              <h3 style={{ margin: "10px 0 0 0", fontSize: "1.8rem" }}>24</h3>
            </div>
            <div style={{ background: "#f0fdf4", padding: "20px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: "0.85rem", color: "#166534" }}>Ingresos Est. Hoy</span>
              <h3 style={{ margin: "10px 0 0 0", fontSize: "1.8rem" }}>$450.000</h3>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: ASIGNACIONES Y PERSONAL */}
      {tabActiva === "asignaciones" && (
        <div>
          <Barberos />
        </div>
      )}

      {/* PESTAÑA 3: PERFIL DE LA BARBERÍA Y HORARIO */}
      {tabActiva === "perfil" && (
        <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <h2 style={{ marginTop: 0 }}>🏢 Perfil e Información de la Barbería</h2>
          <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "24px" }}>
            Esta información se mostrará públicamente a los clientes al agendar.
          </p>

          {cargando ? (
            <p>Cargando información del establecimiento...</p>
          ) : (
            <form onSubmit={guardarPerfil}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                {/* DESCRIPCIÓN */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Descripción Comercial:</label>
                  <textarea
                    rows="3"
                    value={perfil.descripcion}
                    onChange={(e) => setPerfil({ ...perfil, descripcion: e.target.value })}
                    placeholder="Ej. Barbería tradicional con los mejores cortes clásicos y modernos de la ciudad..."
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  />
                </div>

                {/* DIRECCIÓN */}
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Dirección Física:</label>
                  <input
                    type="text"
                    value={perfil.direccion}
                    onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })}
                    placeholder="Ej. Carrera 6 # 7-12, Centro"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  />
                </div>

                {/* URL GOOGLE MAPS EMBED */}
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Ubicación Google Maps (URL iFrame Embed):</label>
                  <input
                    type="text"
                    value={perfil.url_mapa}
                    onChange={(e) => setPerfil({ ...perfil, url_mapa: e.target.value })}
                    placeholder="Ej. https://www.google.com/maps/embed?pb=..."
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  />
                </div>

                {/* HORA APERTURA */}
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Hora de Apertura General:</label>
                  <input
                    type="time"
                    value={perfil.hora_apertura}
                    onChange={(e) => setPerfil({ ...perfil, hora_apertura: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  />
                </div>

                {/* HORA CIERRE */}
                <div>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Hora de Cierre General:</label>
                  <input
                    type="time"
                    value={perfil.hora_cierre}
                    onChange={(e) => setPerfil({ ...perfil, hora_cierre: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* VISTA PREVIA MAPA */}
              {perfil.url_mapa && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>Vista Previa de la Ubicación:</label>
                  <iframe
                    src={perfil.url_mapa}
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: "12px" }}
                    allowFullScreen=""
                    loading="lazy"
                    title="Ubicacion Barberia"
                  ></iframe>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  style={{ padding: "12px 24px", background: "#d4af37", color: "#111", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}
                >
                  Guardar Perfil de Barbería
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
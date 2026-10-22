import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PerfilBarbero from "../components/PerfilBarbero";
import { obtenerBarberos } from "../services/api";

const SESSION_KEY = "barbero_demo_sesion";

// Obtiene la barbería activa del panel administrativo para listar su personal.
function obtenerBarberiaActivaId() {
  try {
    const stored = JSON.parse(localStorage.getItem("barberia_demo_admin") || "null");
    return Number(stored?.id_barberia || stored?.id || 1);
  } catch (error) {
    console.error("No se pudo leer la barbería activa:", error);
    return 1;
  }
}

// Alterna entre el selector del personal real y el perfil seleccionado.
export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = typeof location.state?.returnTo === "string"
    && location.state.returnTo.startsWith("/")
    && !location.state.returnTo.startsWith("//")
    && location.state.returnTo !== "/perfil"
    ? location.state.returnTo
    : "/";
  // Restaura el barbero elegido y carga la lista de la barbería activa.
  const [barbero, setBarbero] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("No se pudo leer la sesión demo del barbero:", error);
      return null;
    }
  });
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (barbero) return undefined;

    let mounted = true;
    setLoading(true);
    obtenerBarberos(obtenerBarberiaActivaId())
      .then((list) => {
        if (mounted) setBarberos(list);
      })
      .catch((loadError) => {
        if (mounted) setError(loadError.message || "No se pudo cargar el personal de la barbería.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [barbero]);

  // Persiste la selección y avisa al Sidebar para cambiar el rol visual.
  const handleLogin = (selectedBarbero) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(selectedBarbero));
    setBarbero(selectedBarbero);
    window.dispatchEvent(new Event("barberfaster-role-change"));
  };

  // Finaliza la selección del barbero y conserva la sesión administrativa anterior.
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setBarbero(null);
    window.dispatchEvent(new Event("barberfaster-role-change"));
  };

  // Renderiza el selector inicial o el perfil con opción para cambiar de barbero.
  return (
    <div style={{ padding: "2rem", width: "100%", boxSizing: "border-box" }}>
      {!barbero ? (
        <div style={{ maxWidth: "450px", margin: "40px auto", background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <button className="btn-secondary" type="button" onClick={() => navigate(returnTo, { replace: true })}>
            ← Volver
          </button>
          <div style={{ background: "var(--bauhaus-cyan)", color: "var(--bauhaus-ink)", width: "45px", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bauhaus-ink)", borderRadius: "2px", margin: "0 auto 15px", fontWeight: "bold", fontFamily: 'var(--font-brand)' }}>BF</div>
          <h3 style={{ margin: "0 0 10px", color: "var(--bauhaus-ink)" }}>BarberFaster</h3>
          <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "20px" }}>Selecciona un barbero de la barbería activa</p>
          {loading ? (
            <p role="status">Cargando barberos...</p>
          ) : error ? (
            <p className="status error" role="alert">{error}</p>
          ) : barberos.length === 0 ? (
            <p>No hay barberos activos para esta barbería.</p>
          ) : (
            <div className="barber-profile-selector">
              {barberos.map((item) => (
                <button
                  className="btn"
                  type="button"
                  key={item.id_barbero}
                  onClick={() => handleLogin({ ...item, rol: "barbero" })}
                >
                  {item.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <PerfilBarbero barbero={barbero} onLogout={handleLogout} />
        </div>
      )}
    </div>
  );
}
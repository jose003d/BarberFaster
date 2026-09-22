import { useState } from "react";
import PerfilBarbero from "../components/PerfilBarbero";

const SESSION_KEY = "barbero_demo_sesion";

export default function Profile() {
  // Este wrapper decide si se muestra el selector o el perfil del barbero.
  const [barbero, setBarbero] = useState(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  // Persiste la selección y avisa al Sidebar para cambiar el rol visual.
  const handleLogin = (selectedBarbero) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(selectedBarbero));
    setBarbero(selectedBarbero);
    window.dispatchEvent(new Event("barberfaster-role-change"));
  };

  // Limpia la sesión demo y devuelve el componente al selector.
  const handleChangeBarbero = () => {
    localStorage.removeItem(SESSION_KEY);
    setBarbero(null);
    window.dispatchEvent(new Event("barberfaster-role-change"));
  };

  // ==========================
  // Renderizado corregido
  // ==========================
  return (
    <div style={{ padding: "2rem", width: "100%", boxSizing: "border-box" }}>
      {!barbero ? (
        <div style={{ maxWidth: "450px", margin: "40px auto", background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <div style={{ background: "#d4af37", color: "#fff", width: "45px", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", margin: "0 auto 15px", fontWeight: "bold" }}>BF</div>
          <h3 style={{ margin: "0 0 10px", color: "#1a1a1a" }}>BarberFaster</h3>
          <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "20px" }}>Selecciona el barbero de la sesión demo</p>
          
          {/* Ejemplo rápido de selector para pruebas o integración con tu lista de barberos */}
          <button 
            className="btn" 
            onClick={() => handleLogin({ id_barbero: 4, nombre: "Kleiser Regino", rol: "barbero" })}
            style={{ width: "100%", padding: "12px", background: "#d4af37", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
          >
            Ingresar como Kleiser Regino
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button 
              className="btn-secondary" 
              onClick={handleChangeBarbero}
              style={{ padding: "8px 14px", background: "#e4e4e4", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
            >
              Cambiar de Barbero / Cerrar Sesión
            </button>
          </div>
          <PerfilBarbero barbero={barbero} />
        </div>
      )}
    </div>
  );
}
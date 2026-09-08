import { useState } from "react";
import LoginDemo from "../components/LoginDemo";
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

  if (!barbero) return <LoginDemo onLogin={handleLogin} />;
  return <PerfilBarbero barbero={barbero} onChangeBarbero={handleChangeBarbero} />;
}

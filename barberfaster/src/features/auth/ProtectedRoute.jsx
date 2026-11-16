import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { BASE_URL, handleResponse } from "../../shared/services/api.js";
import { PANEL_POR_ROL } from "./auth.js";

const SUPERADMIN_LOCAL_HABILITADO = import.meta.env.DEV
  && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activa = true;

    if (roles.includes("SUPERADMIN") && !SUPERADMIN_LOCAL_HABILITADO) {
      setCargando(false);
      return () => {
        activa = false;
      };
    }

    fetch(`${BASE_URL}/Auth/sesion.php`, {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(handleResponse)
      .then((respuesta) => {
        if (!respuesta.usuario) throw new Error("La sesión no contiene un usuario válido.");
        if (!activa) return;
        localStorage.setItem("user", JSON.stringify(respuesta.usuario));
        localStorage.setItem("erpbarber_auth", "true");
        setUsuario(respuesta.usuario);
      })
      .catch(() => {
        if (!activa) return;
        localStorage.removeItem("user");
        localStorage.removeItem("erpbarber_auth");
        setUsuario(null);
      })
      .finally(() => {
        if (activa) setCargando(false);
      });

    return () => {
      activa = false;
    };
  }, []);

  if (roles.includes("SUPERADMIN") && !SUPERADMIN_LOCAL_HABILITADO) {
    return <Navigate to="/" replace />;
  }

  if (cargando) {
    return <p className="auth-route-status" role="status">Validando la sesión...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(usuario.rol)) {
    return <Navigate to={PANEL_POR_ROL[usuario.rol] || "/login"} replace />;
  }

  if (usuario.debe_cambiar_contrasena && location.pathname !== "/cambiar-contrasena") {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  return children;
}

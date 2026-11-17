import { BASE_URL, handleResponse } from "../../shared/services/api.js";

// Dominios donde se publica el panel SUPERADMIN (VITE_SUPERADMIN_HOSTS, separados por coma).
// En desarrollo también se permite localhost.
const HOSTS_SUPERADMIN = (import.meta.env.VITE_SUPERADMIN_HOSTS || "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

export const ES_HOST_SUPERADMIN = HOSTS_SUPERADMIN.includes(window.location.hostname.toLowerCase());

export const SUPERADMIN_HABILITADO = ES_HOST_SUPERADMIN
  || (import.meta.env.DEV && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname));

// Abre el panel SUPERADMIN: en su dominio (o en local) navega dentro de la app;
// en cualquier otro dominio salta al dominio del panel.
export function irAlPanelSuperadmin(navigate) {
  if (SUPERADMIN_HABILITADO || HOSTS_SUPERADMIN.length === 0) {
    navigate("/superadmin");
    return;
  }
  window.location.assign(`https://${HOSTS_SUPERADMIN[0]}/superadmin`);
}

export const PANEL_POR_ROL = {
  SUPERADMIN: "/superadmin",
  ADMINISTRADOR: "/dashboard",
  BARBERO: "/barbero",
};

export async function loginUsuario(identificador, password) {
  const response = await fetch(`${BASE_URL}/Auth/login.php`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificador, password }),
  });
  return handleResponse(response);
}

export async function solicitarRecuperacionContrasena(correo) {
  const response = await fetch(`${BASE_URL}/Auth/solicitar_recuperacion.php`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo }),
  });
  return handleResponse(response);
}

export async function restablecerContrasena(correo, codigo, contrasenaNueva) {
  const response = await fetch(`${BASE_URL}/Auth/restablecer_contrasena.php`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, codigo, contrasena_nueva: contrasenaNueva }),
  });
  return handleResponse(response);
}

export async function cerrarSesion() {
  const response = await fetch(`${BASE_URL}/Auth/logout.php`, {
    method: "POST",
    credentials: "same-origin",
  });
  return handleResponse(response);
}

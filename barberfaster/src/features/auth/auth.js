import { BASE_URL, handleResponse } from "../../shared/services/api.js";

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

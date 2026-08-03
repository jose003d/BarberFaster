// ==========================
// Configuración base
// ==========================
const BASE_URL = "http://localhost/erpbarber/barberfaster/backend";

// ==========================
// Función genérica para manejar respuestas
// ==========================
// - Verifica que la respuesta sea JSON
// - Lanza error si hay problema en la respuesta
// - Devuelve los datos si todo está correcto
async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(text || "Respuesta no JSON del servidor");
  }
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || "Error en la solicitud");
  }
  return data;
}

function extractListData(data, key) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  throw new Error("Formato de datos inesperado.");
}

// ==========================
// Barberías
// ==========================
export async function obtenerBarberias() {
  const response = await fetch(`${BASE_URL}/barberias/listarb.php`);
  const data = await handleResponse(response);
  return extractListData(data, "barberias");
}

export async function editarBarberia(barberia) {
  const response = await fetch(`${BASE_URL}/barberias/editarb.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(barberia),
  });
  return handleResponse(response);
}

export async function desactivarBarberia(idBarberia) {
  const response = await fetch(`${BASE_URL}/barberias/desactivarb.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_barberia: idBarberia }),
  });
  return handleResponse(response);
}

export async function crearBarberia(formData) {
  const response = await fetch(`${BASE_URL}/barberias/crearb.php`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(response);
}

// ==========================
// Usuarios
// ==========================
export async function obtenerUsuarios() {
  const response = await fetch(`${BASE_URL}/usuarios/listaru.php`);
  return handleResponse(response);
}

export async function editarUsuario(usuario) {
  const response = await fetch(`${BASE_URL}/usuarios/editaru.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  });
  return handleResponse(response);
}

export async function desactivarUsuario(idUsuario) {
  const response = await fetch(`${BASE_URL}/usuarios/desactivaru.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_usuario: idUsuario }),
  });
  return handleResponse(response);
}

export async function crearUsuario(formData) {
  const response = await fetch(`${BASE_URL}/usuarios/crearu.php`, {
    method: "POST",
    headers: formData instanceof FormData ? {} : { "Content-Type": "application/json" },
    body: formData instanceof FormData ? formData : JSON.stringify(formData),
  });
  return handleResponse(response);
}

export async function loginUsuario(credentials) {
  const response = await fetch(`${BASE_URL}/usuarios/login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
}

export async function obtenerUsuario(id) {
  const response = await fetch(`${BASE_URL}/usuarios/getusuario.php?id=${encodeURIComponent(id)}`);
  return handleResponse(response);
}

// ==========================
// Barberos
// ==========================
export async function crearBarbero(barbero) {
  const response = await fetch(`${BASE_URL}/barberos/crearb.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(barbero),
  });
  return handleResponse(response);
}

// ==========================
// Clientes
// ==========================
export async function obtenerClientes() {
  const response = await fetch(`${BASE_URL}/clientes/listarc.php`);
  const data = await handleResponse(response);
  return extractListData(data, "clientes");
}

export async function editarCliente(cliente) {
  const response = await fetch(`${BASE_URL}/clientes/editarc.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });
  return handleResponse(response);
}

export async function desactivarCliente(dni) {
  const response = await fetch(`${BASE_URL}/clientes/desactivarc.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dni }),
  });
  return handleResponse(response);
}

export async function crearCliente(formData) {
  const response = await fetch(`${BASE_URL}/clientes/crearc.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return handleResponse(response);
}

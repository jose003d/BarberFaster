// src/services/api.js

const BASE_URL = "/erpbarber/barberfaster/backend";
const FALLBACK_BASE_URL = "http://localhost:8000/backend";

export async function fetchJsonWithFallback(endpoint, options = {}) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const candidates = [
    `${BASE_URL}${normalizedEndpoint}`,
    `${FALLBACK_BASE_URL}${normalizedEndpoint}`,
  ];

  let lastError = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();

      if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
        throw new Error("Respuesta HTML inesperada");
      }

      try {
        const data = JSON.parse(text);
        if (!response.ok || (data && (data.status === "error" || data.error === true))) {
          throw new Error(data?.mensaje || data?.error || "Error en la solicitud");
        }
        return data;
      } catch (parseError) {
        if (text.trim()) {
          throw new Error(text || "Respuesta no válida del servidor (No es JSON)");
        }
        throw parseError;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No se pudo cargar la información del servidor.");
}

// ============================================================
// Manejadores Genéricos de Respuestas y Peticiones (CORS & JSON)
// ============================================================

async function handleResponse(response) {
  const text = await response.text();
  
  // Evita que un error 404/500 de Apache (HTML) rompa el parseo y se imprima en pantalla
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error("El servidor devolvió una página HTML en lugar de JSON (Error 404 o ruta PHP incorrecta).");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(text || "Respuesta no válida del servidor (No es JSON)");
  }

  if (!response.ok || (data && (data.status === "error" || data.error === true))) {
    throw new Error(data?.mensaje || data?.error || "Error en la solicitud al servidor");
  }
  return data;
}

function extractListData(data, key) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.datos)) return data.datos;
  if (data && Array.isArray(data[key])) return data[key];
  return [];
}

export async function apiFetch(endpoint, options = {}) {
  const config = {
    headers: {
      ...options.headers,
    },
    ...options,
  };

  if (
    config.body &&
    typeof config.body === "object" &&
    !(config.body instanceof FormData)
  ) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }

  try {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    const response = await fetch(`${BASE_URL}/${cleanEndpoint}`, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error en petición API a [${endpoint}]:`, error);
    return { status: "error", mensaje: error.message };
  }
}

// ============================================================
// MÓDULO: Barberías
// ============================================================

export async function obtenerBarberias(soloActivas = true) {
  const response = await fetch(`${BASE_URL}/barberias/listarb.php?activas=${soloActivas}`);
  const data = await handleResponse(response);
  return extractListData(data, "barberias");
}

export async function crearBarberia(barberiaData) {
  const response = await fetch(`${BASE_URL}/barberias/crearb.php`, {
    method: "POST",
    headers: barberiaData instanceof FormData ? {} : { "Content-Type": "application/json" },
    body: barberiaData instanceof FormData ? barberiaData : JSON.stringify(barberiaData),
  });
  return handleResponse(response);
}

export async function editarBarberia(barberia) {
  const response = await fetch(`${BASE_URL}/barberias/editarb.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(barberia),
  });
  return handleResponse(response);
}

export async function desactivarBarberia(idBarberia, nuevoEstado = "INACTIVA") {
  const response = await fetch(`${BASE_URL}/barberias/desactivarb.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_barberia: idBarberia, estado: nuevoEstado }),
  });
  return handleResponse(response);
}

// ============================================================
// MÓDULO: Usuarios / Barberos
// ============================================================

export async function obtenerUsuarios(idBarberia) {
  const url = idBarberia 
    ? `${BASE_URL}/usuarios/listaru.php?id_barberia=${idBarberia}`
    : `${BASE_URL}/usuarios/listaru.php`;
  const response = await fetch(url);
  const data = await handleResponse(response);
  return extractListData(data, "usuarios");
}

export async function crearUsuario(userData) {
  const response = await fetch(`${BASE_URL}/usuarios/crearu.php`, {
    method: "POST",
    headers: userData instanceof FormData ? {} : { "Content-Type": "application/json" },
    body: userData instanceof FormData ? userData : JSON.stringify(userData),
  });
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

export async function loginUsuario(email, password) {
  const response = await fetch(`${BASE_URL}/usuarios/login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

// ============================================================
// MÓDULO: Servicios
// ============================================================

export async function obtenerServicios(idBarberia) {
  if (!idBarberia) return [];
  const response = await fetch(`${BASE_URL}/servicios/listars.php?id_barberia=${idBarberia}`);
  const data = await handleResponse(response);
  return extractListData(data, "servicios");
}

export async function crearServicio(servicio) {
  const response = await fetch(`${BASE_URL}/servicios/crears.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(servicio),
  });
  return handleResponse(response);
}

export async function editarServicio(servicio) {
  const response = await fetch(`${BASE_URL}/servicios/editars.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(servicio),
  });
  return handleResponse(response);
}

export async function desactivarServicio(idServicio, nuevoEstado = "INACTIVO") {
  const response = await fetch(`${BASE_URL}/servicios/desactivars.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_servicio: idServicio, estado: nuevoEstado }),
  });
  return handleResponse(response);
}

// ============================================================
// MÓDULO: Clientes
// ============================================================

export async function buscarClientePorDni(dni) {
  const response = await fetch(`${BASE_URL}/clientes/buscar.php?dni=${dni}`);
  return handleResponse(response);
}

export async function crearCliente(clienteData) {
  const response = await fetch(`${BASE_URL}/clientes/crearc.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clienteData),
  });
  return handleResponse(response);
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

export async function obtenerClientes() {
  const response = await fetch(`${BASE_URL}/clientes/listarc.php`);
  const data = await handleResponse(response);
  return extractListData(data, "clientes");
}

// ============================================================
// MÓDULO: Agenda y Citas
// ============================================================

export async function agendarCita(citaData) {
  const response = await fetch(`${BASE_URL}/agenda/agendar_cita.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(citaData),
  });
  return handleResponse(response);
}

export async function validarDisponibilidad(params) {
  const { id_barbero, fecha, hora_inicio, servicios } = params;
  const servQuery = Array.isArray(servicios) ? servicios.join(",") : servicios;
  const response = await fetch(
    `${BASE_URL}/agenda/validar_disponibilidad.php?id_barbero=${id_barbero}&fecha=${fecha}&hora_inicio=${hora_inicio}&servicios=${servQuery}`
  );
  return handleResponse(response);
}

export async function obtenerCitas(params = {}) {
  let url = `${BASE_URL}/agenda/listar_citas.php?`;
  if (params.id_barbero) url += `id_barbero=${params.id_barbero}&`;
  if (params.id_barberia) url += `id_barberia=${params.id_barberia}&`;
  if (params.fecha) url += `fecha=${params.fecha}&`;

  const response = await fetch(url);
  const data = await handleResponse(response);
  return extractListData(data, "citas");
}

export async function completarCita(idCita) {
  const response = await fetch(`${BASE_URL}/citas/completar.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_cita: idCita }),
  });
  return handleResponse(response);
}

export async function cancelarCita(idCita) {
  const response = await fetch(`${BASE_URL}/citas/cancelar.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_cita: idCita }),
  });
  return handleResponse(response);
}

// ============================================================
// MÓDULO: Barberos
// ============================================================

export async function obtenerBarberos(idBarberia) {
  const url = idBarberia 
    ? `${BASE_URL}/barberos/listar_barberos.php?id_barberia=${idBarberia}`
    : `${BASE_URL}/barberos/listar_barberos.php`;
  
  const response = await fetch(url);
  const data = await handleResponse(response);
  return extractListData(data, "barberos");
}

// ============================================================
// MÓDULO: Dashboard / Métricas
// ============================================================

export async function obtenerMetricas(idBarberia, idBarbero = null, fecha = null) {
  let url = `${BASE_URL}/dashboard/metricas.php?`;
  if (idBarberia) url += `id_barberia=${idBarberia}&`;
  if (idBarbero) url += `id_barbero=${idBarbero}&`;
  if (fecha) url += `fecha=${fecha}&`;

  const response = await fetch(url);
  return handleResponse(response);
}
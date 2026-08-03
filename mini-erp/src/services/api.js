const BASE_URL = "http://localhost/VSC/ERPReact/backend";

// Sección para la tabla de barberías
export async function obtenerBarberias() {
  try {
    const response = await fetch(`${BASE_URL}/barberias/listar.php`);
    if (!response.ok) throw new Error("Error al obtener barberías");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearBarberia(barberia) {
  try {
    const response = await fetch(`${BASE_URL}/barberias/crear.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(barberia),
    });
    if (!response.ok) throw new Error("Error al crear barbería");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editarBarberia(barberia) {
  try {
    const response = await fetch(`${BASE_URL}/barberias/editar.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(barberia),
    });
    if (!response.ok) throw new Error("Error al actualizar barbería");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Sección para la tabla de los barberos
export async function obtenerBarberos() {
  try {
    const response = await fetch(`${BASE_URL}/barberos/listar.php`);
    if (!response.ok) throw new Error("Error al obtener barberos");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearBarbero(barbero) {
  try {
    const response = await fetch(`${BASE_URL}/barberos/crear.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(barbero),
    });
    if (!response.ok) throw new Error("Error al crear barbero");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editarBarbero(barbero) {
  try {
    const response = await fetch(`${BASE_URL}/barberos/editar.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(barbero),
    });
    if (!response.ok) throw new Error("Error al actualizar barbero");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Seccion para la tabla de los clientes
export async function obtenerClientes() {
  try {
    const response = await fetch(`${BASE_URL}/clientes/listar.php`);
    if (!response.ok) throw new Error("Error al obtener clientes");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearCliente(cliente) {
  try {
    const response = await fetch(`${BASE_URL}/clientes/crear.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente),
    });
    if (!response.ok) throw new Error("Error al crear cliente");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editarCliente(cliente) {
  try {
    const response = await fetch(`${BASE_URL}/clientes/editar.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente),
    });
    if (!response.ok) throw new Error("Error al actualizar cliente");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Sección para la tabla de los servicios
export async function obtenerServicios() {
  try {
    const response = await fetch(`${BASE_URL}/servicios/listar.php`);
    if (!response.ok) throw new Error("Error al obtener servicios");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearServicio(servicio) {
  try {
    const response = await fetch(`${BASE_URL}/servicios/crear.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(servicio),
    });
    if (!response.ok) throw new Error("Error al crear servicio");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editarServicio(servicio) {
  try {
    const response = await fetch(`${BASE_URL}/servicios/editar.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(servicio),
    });
    if (!response.ok) throw new Error("Error al actualizar servicio");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Sección para la tabla de todos los usuarios
export async function obtenerUsuarios() {
  try {
    const response = await fetch(`${BASE_URL}/usuarios/listar.php`);
    if (!response.ok) throw new Error("Error al obtener usuarios");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearUsuario(usuario) {
  try {
    const response = await fetch(`${BASE_URL}/usuarios/crear.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    });
    if (!response.ok) throw new Error("Error al crear usuario");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editarUsuario(usuario) {
  try {
    const response = await fetch(`${BASE_URL}/usuarios/editar.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    });
    if (!response.ok) throw new Error("Error al actualizar usuario");
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
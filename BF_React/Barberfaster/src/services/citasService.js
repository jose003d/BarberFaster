// Función para simular la obtención de todas las citas del usuario actual
const getTodasLasCitasUsuario = (userId) => {
  try {
    const citasSimuladas = JSON.parse(localStorage.getItem('bf_citas')) || [];
    return citasSimuladas.filter(cita => cita.usuarioId === userId);
  } catch (error) {
    console.error("Error leyendo citas:", error);
    return [];
  }
};

// Obtener Citas Activas (En espera, Aprobada, Pagada)
export const getCitasActivas = (userId) => {
  const citas = getTodasLasCitasUsuario(userId);
  const estadosActivos = ['pendiente', 'aprobada', 'pagada'];
  return citas.filter(cita => estadosActivos.includes(cita.estado));
};

// Obtener Historial de Citas por Rango de Fechas (Cancelada, Realizada)
export const getHistorialCitas = (userId, fechaInicio, fechaFin) => {
  const citas = getTodasLasCitasUsuario(userId);
  const estadosHistorial = ['cancelada', 'realizada'];
  
  // Filtro por estado
  let historial = citas.filter(cita => estadosHistorial.includes(cita.estado));

  // Filtro por rango de fecha
  if (fechaInicio && fechaFin) {
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    
    historial = historial.filter(cita => {
      const fechaCita = new Date(cita.fecha);
      return fechaCita >= start && fechaCita <= end;
    });
  }

  // Ordenamiento
  return historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 18);
};
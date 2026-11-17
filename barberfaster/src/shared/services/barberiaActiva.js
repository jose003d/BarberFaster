// Determina qué barbería maneja el panel administrativo.
// - ADMINISTRADOR / BARBERO: siempre la barbería de su cuenta (id_barberia de la sesión).
// - SUPERADMIN: la barbería que eligió para revisar (barberia_demo_admin), o la 1 si no eligió
//   (comportamiento anterior; el backend nunca deja a un ADMINISTRADOR tocar otra barbería).
export function obtenerBarberiaActivaId() {
  try {
    const usuario = JSON.parse(localStorage.getItem("user") || "null");
    if (usuario && usuario.rol !== "SUPERADMIN" && usuario.id_barberia) {
      return Number(usuario.id_barberia);
    }
  } catch {
    // Sesión ilegible: se intenta con la barbería elegida manualmente.
  }

  try {
    const guardada = localStorage.getItem("barberia_demo_admin");
    if (guardada) {
      if (/^\d+$/.test(guardada)) return Number(guardada);
      const parsed = JSON.parse(guardada);
      const id = Number(parsed?.id_barberia || parsed?.id);
      if (id > 0) return id;
    }
  } catch {
    // Valor inválido: se ignora.
  }
  return 1;
}

export const getBizData = (userId, user) => {
  const STORAGE_KEY = `bf_biz_${userId}`;
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
      const data = JSON.parse(d);
      // Migración: asegurar que las invitaciones tengan ID
      data.invitaciones.forEach((inv, i) => {
        if (!inv.id) inv.id = `inv_${i}_${Date.now()}`;
      });
      return data;
    }
  } catch (e) {
    console.warn("Error leyendo datos del negocio:", e);
  }

  const defaultData = {
    direccion: "",
    barberos: [{ id: "self", nombre: user.nombreCompleto, portafolio: [] }],
    invitaciones: [],
  };
  saveBizData(userId, defaultData);
  return defaultData;
};

export const saveBizData = (userId, data) => {
  const STORAGE_KEY = `bf_biz_${userId}`;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("No se pudo guardar:", e);
  }
};
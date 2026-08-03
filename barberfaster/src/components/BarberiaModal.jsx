import { useEffect, useState } from "react";
import { crearBarberia, editarBarberia } from "../services/api";

function BarberiaModal({ isOpen, onClose, onSuccess, barberiaSeleccionada }) {
  // ==========================
  // Estados del formulario
  // ==========================
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    estado: 1,
  });
  const [fotoFile, setFotoFile] = useState(null); // archivo de imagen
  const [error, setError] = useState(null);       // mensajes de error
  const [enviando, setEnviando] = useState(false);// estado de envío

  const esEdicion = !!barberiaSeleccionada; // true si estamos editando

  // ==========================
  // useEffect: carga datos si hay barbería seleccionada
  // ==========================
  useEffect(() => {
    if (barberiaSeleccionada) {
      // Cargar datos existentes en el formulario
      setFormData({
        nombre: barberiaSeleccionada.nombre || "",
        direccion: barberiaSeleccionada.direccion || "",
        ciudad: barberiaSeleccionada.ciudad || "",
        telefono: barberiaSeleccionada.telefono || "",
        estado: barberiaSeleccionada.estado ?? 1,
      });
    } else {
      // Resetear formulario si es creación
      setFormData({
        nombre: "",
        direccion: "",
        ciudad: "",
        telefono: "",
        estado: 1,
      });
    }
    setFotoFile(null);
    setError(null);
  }, [barberiaSeleccionada, isOpen]);

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  // ==========================
  // Manejo de cambios en inputs
  // ==========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==========================
  // Validación básica antes de enviar
  // ==========================
  const validarCampos = () => {
    if (!formData.nombre.trim()) return "El nombre es obligatorio.";
    if (!formData.direccion.trim()) return "La dirección es obligatoria.";
    if (!formData.ciudad.trim()) return "La ciudad es obligatoria.";
    return null;
  };

  // ==========================
  // Manejo del envío del formulario
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    // Validar campos obligatorios
    const errorValidacion = validarCampos();
    if (errorValidacion) {
      setError(errorValidacion);
      setEnviando(false);
      return;
    }

    try {
      let data;

      if (esEdicion) {
        // Caso edición: enviar datos simples
        data = await editarBarberia(formData);
        if (data.success) {
          onSuccess(formData, true); // notificar éxito
          onClose();                 // cerrar modal
        } else {
          setError(data.error || "Error al actualizar la barbería.");
        }
      } else {
        // Caso creación: usar FormData para incluir archivo
        const dataToSend = new FormData();
        Object.keys(formData).forEach((key) =>
          dataToSend.append(key, formData[key])
        );
        if (fotoFile) dataToSend.append("foto", fotoFile);

        data = await crearBarberia(dataToSend);
        if (data.success) {
          onSuccess(data, false); // notificar éxito
          onClose();              // cerrar modal
        } else {
          setError(data.error || "Error al registrar la barbería.");
        }
      }
    } catch (err) {
      setError("No hay conexión con el servidor backend.");
    } finally {
      setEnviando(false);
    }
  };

  // ==========================
  // Renderizado del modal
  // ==========================
  return (
    <div
      className="modal-backdrop-custom"
      onKeyDown={(e) => e.key === "Escape" && onClose()} // cerrar con ESC
    >
      <div className="modal-content-custom">
        {/* Encabezado del modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>
            {esEdicion ? "Editar Barbería" : "Registrar Nueva Barbería"}
          </h3>
          <button
            aria-label="Cerrar modal"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Mensaje de error */}
        {error && <p className="status error">{error}</p>}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Ciudad</label>
            <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select name="estado" value={formData.estado} onChange={handleChange}>
              <option value={1}>Activa</option>
              <option value={0}>Inactiva</option>
            </select>
          </div>

          {/* Campo de foto solo en creación */}
          {!esEdicion && (
            <div className="form-group">
              <label>Foto</label>
              <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files[0])} />
            </div>
          )}

          {/* Botones de acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={enviando}>
              {enviando ? "Guardando..." : esEdicion ? "Guardar Cambios" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BarberiaModal;

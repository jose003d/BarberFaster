import { useEffect, useState } from "react";
import { crearCliente, editarCliente } from "../services/api";

// ==========================
// Función auxiliar: genera un DNI temporal
// ==========================
// Se usa para clientes nuevos, tomando los últimos 8 dígitos del timestamp actual
const generarDniTemporal = () => Number(Date.now().toString().slice(-8));

function ClienteModal({ isOpen, onClose, onSuccess, clienteSeleccionado }) {
  // ==========================
  // Estados del formulario
  // ==========================
  const [formData, setFormData] = useState({
    dni: generarDniTemporal(),
    nombre: "",
    apellido: "",
    telefono: "",
    correo: ""
  });
  const [error, setError] = useState(null);       // mensajes de error
  const [enviando, setEnviando] = useState(false);// estado de envío

  const esEdicion = !!clienteSeleccionado; // true si estamos editando

  // ==========================
  // useEffect: carga datos si hay cliente seleccionado
  // ==========================
  useEffect(() => {
    if (clienteSeleccionado) {
      // Cargar datos existentes en el formulario
      setFormData(clienteSeleccionado);
    } else {
      // Resetear formulario si es creación
      setFormData({
        dni: generarDniTemporal(),
        nombre: "",
        apellido: "",
        telefono: "",
        correo: ""
      });
    }
    setError(null);
  }, [clienteSeleccionado, isOpen]);

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
  // Manejo del envío del formulario
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      // Llamar a la API según si es edición o creación
      const data = esEdicion
        ? await editarCliente(formData)
        : await crearCliente(formData);

      if (data.success) {
        // Notificar éxito al padre
        onSuccess(formData, esEdicion);
        // Resetear formulario para próxima creación
        setFormData({
          dni: generarDniTemporal(),
          nombre: "",
          apellido: "",
          telefono: "",
          correo: ""
        });
        // Cerrar modal
        onClose();
      } else {
        setError(data.error || "Error al guardar cliente.");
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
    <div className="modal-backdrop-custom">
      <div className="modal-content-custom">
        {/* Encabezado del modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>
            {esEdicion ? "Editar Cliente" : "Registrar Nuevo Cliente"}
          </h3>
          <button
            aria-label="Cerrar"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' }}
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
            <label>Apellido</label>
            <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Correo</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} required />
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={enviando}>
              {enviando ? "Guardando..." : esEdicion ? "Guardar Cambios" : "Registrar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClienteModal;

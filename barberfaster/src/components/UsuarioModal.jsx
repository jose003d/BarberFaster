import { useEffect, useState } from "react";
import { editarUsuario } from "../services/api";

// ==========================
// Función auxiliar: genera un documento temporal
// ==========================
// Se usa para usuarios nuevos, tomando los últimos 8 dígitos del timestamp actual
const generarDocumentoTemporal = () => Date.now().toString().slice(-8);

function UsuarioModal({ isOpen, onClose, onSuccess, usuarioSeleccionado }) {
  // ==========================
  // Estados del formulario
  // ==========================
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    documento: generarDocumentoTemporal(),
    rol: "barbero",
    apellido: "",
  });
  const [error, setError] = useState(null);       // mensajes de error
  const [enviando, setEnviando] = useState(false);// estado de envío
  const [barberias, setBarberias] = useState([]); // lista de barberías disponibles

  const esEdicion = !!usuarioSeleccionado; // true si estamos editando

  // ==========================
  // useEffect: carga datos si hay usuario seleccionado
  // ==========================
  useEffect(() => {
    if (usuarioSeleccionado) {
      // Cargar datos existentes en el formulario (sin contraseña)
      setFormData({ ...usuarioSeleccionado, password: "" });
    } else {
      // Resetear formulario si es creación
      setFormData({
        nombre: "",
        email: "",
        password: "",
        telefono: "",
        documento: generarDocumentoTemporal(),
        rol: "barbero",
        apellido: "",
      });
    }
    setError(null);

    // Al abrir el modal, cargar barberías desde backend
    if (isOpen) {
      fetch("http://localhost/erpbarber/barberfaster/backend/barberias/listarb.php")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setBarberias(data);
        })
        .catch(() => {});
    }
  }, [usuarioSeleccionado, isOpen]);

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
      let data;

      if (esEdicion) {
        // Caso edición: actualizar usuario
        data = await editarUsuario(formData);
        if (data.success) {
          onSuccess(formData, true);
          onClose();
        } else {
          setError(data.error || "Error al actualizar el usuario.");
        }
      } else {
        // Caso creación: enviar datos al backend
        const response = await fetch(
          "http://localhost/erpbarber/barberfaster/backend/usuarios/crearu.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );
        data = await response.json();

        if (data.success) {
          const nuevoUsuario = {
            id_usuario: data.id_usuario || Date.now(),
            ...formData,
          };

          // ==========================
          // Lógica adicional según rol
          // ==========================
          if (formData.rol === "barbero") {
            // Crear registro en tabla barberos
            try {
              await fetch("http://localhost/erpbarber/barberfaster/backend/barberos/crearb.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id_usuario: data.id_usuario,
                  id_barberia: formData.id_barberia || (barberias[0] && barberias[0].id_barberia),
                  especialidad: formData.especialidad || '',
                }),
              });
            } catch (err) {
              // No bloquear la creación del usuario si falla crear barbero
            }
          } else {
            // Crear entrada en clientes (usa documento como dni)
            try {
              await fetch("http://localhost/erpbarber/barberfaster/backend/clientes/crearc.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  dni: formData.documento || data.id_usuario,
                  nombre: formData.nombre,
                  apellido: formData.apellido,
                  telefono: formData.telefono,
                  correo: formData.email,
                }),
              });
            } catch (err) {
              // Ignorar errores de cliente
            }
          }

          // Notificar éxito y resetear formulario
          onSuccess(nuevoUsuario, false);
          setFormData({
            nombre: "",
            email: "",
            password: "",
            telefono: "",
            documento: generarDocumentoTemporal(),
            rol: formData.rol,
            apellido: "",
          });
          onClose();
        } else {
          setError(data.error || "Ocurrió un error al registrar el usuario.");
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
    <div className="modal-backdrop-custom">
      <div className="modal-content-custom">
        {/* Encabezado del modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>
            {esEdicion
              ? "Editar Usuario"
              : formData.rol === "cliente"
              ? "Registrar Nuevo Cliente"
              : "Registrar Nuevo Colaborador"}
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
            <label>Nombre Completo</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Documento</label>
            <input type="text" name="documento" value={formData.documento} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          {!esEdicion && (
            <div className="form-group">
              <label>Contraseña Temporal</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
          )}

          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Rol asignado</label>
            <select name="rol" value={formData.rol} onChange={handleChange}>
              <option value="barbero">Barbero</option>
              <option value="cliente">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

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

export default UsuarioModal;

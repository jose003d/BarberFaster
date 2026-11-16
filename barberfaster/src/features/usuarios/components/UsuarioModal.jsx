import { useEffect, useState } from "react";
import { crearUsuario, editarUsuario, obtenerBarberias } from "../../../shared/services/api.js";

function obtenerRolSesion() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null")?.rol || null;
  } catch (error) {
    console.error("No se pudo leer el rol de la sesión:", error);
    return null;
  }
}

export const UsuarioModal = ({ isOpen, onClose, usuarioEditar, onSuccess }) => {
  const [form, setForm] = useState({
    nombre_completo: "",
    documento: "",
    telefono: "",
    correo: "",
    rol: "BARBERO",
    id_barberia: "",
  });
  const [rolSesion, setRolSesion] = useState(obtenerRolSesion);
  const [barberias, setBarberias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setRolSesion(obtenerRolSesion());
    setError("");

    if (usuarioEditar) {
      setForm({
        nombre_completo: usuarioEditar.nombre || usuarioEditar.nombre_completo || "",
        documento: usuarioEditar.documento || "",
        telefono: usuarioEditar.telefono || "",
        correo: usuarioEditar.correo || usuarioEditar.email || "",
        rol: usuarioEditar.rol || "BARBERO",
        id_barberia: usuarioEditar.id_barberia || "",
      });
      return;
    }

    setForm({
      nombre_completo: "",
      documento: "",
      telefono: "",
      correo: "",
      rol: "BARBERO",
      id_barberia: "",
    });

    if (obtenerRolSesion() === "SUPERADMIN") {
      obtenerBarberias(true)
        .then((list) => {
          setBarberias(list);
          setForm((current) => ({
            ...current,
            id_barberia: current.id_barberia || list[0]?.id_barberia || "",
          }));
        })
        .catch((loadError) => {
          setError(loadError.message || "No se pudieron cargar las barberías.");
        });
    }
  }, [isOpen, usuarioEditar]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (usuarioEditar) {
        await editarUsuario({
          id_usuario: usuarioEditar.id_usuario,
          nombre_completo: form.nombre_completo.trim(),
          telefono: form.telefono.trim(),
          correo: form.correo.trim(),
        });
      } else {
        const usuario = {
          nombre_completo: form.nombre_completo.trim(),
          documento: form.documento.trim(),
          telefono: form.telefono.trim(),
          correo: form.correo.trim(),
          rol: rolSesion === "SUPERADMIN" ? form.rol : "BARBERO",
        };
        if (rolSesion === "SUPERADMIN") {
          usuario.id_barberia = Number(form.id_barberia);
        }
        await crearUsuario(usuario);
      }

      onSuccess?.();
      onClose();
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const isSuperadmin = rolSesion === "SUPERADMIN";

  return (
    <div className="usuario-modal-backdrop">
      <section className="usuario-modal" role="dialog" aria-modal="true" aria-labelledby="usuario-modal-title">
        <header className="usuario-modal-header">
          <h3 id="usuario-modal-title">{usuarioEditar ? "Editar personal" : "Registrar personal"}</h3>
          <button type="button" className="usuario-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <form className="usuario-modal-form" onSubmit={handleSubmit}>
          <label>
            Nombre completo
            <input
              type="text"
              maxLength={150}
              value={form.nombre_completo}
              onChange={(event) => setForm({ ...form, nombre_completo: event.target.value })}
              autoComplete="name"
              required
            />
          </label>

          {!usuarioEditar && (
            <label>
              Documento
              <input
                type="text"
                maxLength={30}
                value={form.documento}
                onChange={(event) => setForm({ ...form, documento: event.target.value })}
                required
              />
            </label>
          )}

          <label>
            Correo electrónico
            <input
              type="email"
              maxLength={120}
              value={form.correo}
              onChange={(event) => setForm({ ...form, correo: event.target.value })}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Teléfono
            <input
              type="tel"
              maxLength={20}
              title="El teléfono no puede superar 20 caracteres."
              value={form.telefono}
              onChange={(event) => setForm({ ...form, telefono: event.target.value })}
              autoComplete="tel"
            />
          </label>

          {!usuarioEditar && isSuperadmin && (
            <>
              <label>
                Rol
                <select
                  value={form.rol}
                  onChange={(event) => setForm({ ...form, rol: event.target.value })}
                  required
                >
                  <option value="BARBERO">Barbero</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </label>
              <label>
                Barbería
                <select
                  value={form.id_barberia}
                  onChange={(event) => setForm({ ...form, id_barberia: event.target.value })}
                  required
                >
                  <option value="" disabled>Selecciona una barbería</option>
                  {barberias.map((barberia) => (
                    <option key={barberia.id_barberia} value={barberia.id_barberia}>
                      {barberia.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {!usuarioEditar && (
            <p className="usuario-modal-hint">
              La contraseña inicial será el número de documento del empleado.
            </p>
          )}
          {error && <p className="status error" role="alert">{error}</p>}

          <footer className="usuario-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={loading || (isSuperadmin && !usuarioEditar && barberias.length === 0)}>
              {loading ? "Guardando..." : usuarioEditar ? "Guardar cambios" : "Registrar"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

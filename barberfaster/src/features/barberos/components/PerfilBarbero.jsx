import { useCallback, useEffect, useState } from "react";

import { BASE_URL } from "../../../shared/services/api.js";
const REFRESH_INTERVAL = 15000;

// Convierte las rutas guardadas de foto a URL pública del servidor.
const photoUrl = (photo) => {
  if (!photo) return "";
  if (/^https?:\/\//i.test(photo)) return photo;
  if (photo.startsWith(`${BASE_URL}/`)) return photo;
  const path = photo.replace(/^\/+/, "").replace(/^uploads\//, "");
  return `${BASE_URL}/uploads/${path.split("/").map(encodeURIComponent).join("/")}`;
};

// Presenta los datos del barbero y sus citas reales en actualización periódica.
export default function PerfilBarbero({ barbero: initialBarbero, onLogout }) {
  const [barbero, setBarbero] = useState(initialBarbero);
  const [tab, setTab] = useState("datos");
  const [form, setForm] = useState(() => ({
    nombre: initialBarbero?.nombre || "",
    apellido: initialBarbero?.apellido || "",
    email: initialBarbero?.email || "",
    telefono: initialBarbero?.telefono || "",
    documento: initialBarbero?.documento || "",
    especialidad: initialBarbero?.especialidad || "",
  }));
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [message, setMessage] = useState(null);

  // Consulta citas reales al abrir el perfil y luego cada 15 segundos.
  const loadAppointments = useCallback(async (signal) => {
    const response = await fetch(
      `${BASE_URL}/citas/listar_barbero_perfil.php?id_barbero=${encodeURIComponent(initialBarbero.id_barbero)}`,
      { signal, cache: "no-store" }
    );
    const data = await response.json();
    if (!response.ok || data.status !== "success" || !Array.isArray(data.datos)) {
      throw new Error(data.mensaje || "No se pudieron cargar las citas.");
    }

    setAppointments(data.datos);
    setAppointmentError("");
    setLastUpdated(new Date());
  }, [initialBarbero?.id_barbero]);

  useEffect(() => {
    if (!initialBarbero) return undefined;

    setBarbero(initialBarbero);
    setForm({
      nombre: initialBarbero.nombre || "",
      apellido: initialBarbero.apellido || "",
      email: initialBarbero.email || "",
      telefono: initialBarbero.telefono || "",
      documento: initialBarbero.documento || "",
      especialidad: initialBarbero.especialidad || "",
    });

    let mounted = true;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        await loadAppointments(controller.signal);
      } catch (error) {
        if (mounted && error.name !== "AbortError") {
          setAppointmentError(error.message || "No se pudieron cargar las citas.");
        }
      } finally {
        if (mounted) setLoadingAppointments(false);
      }
    };

    refresh();
    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      mounted = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [initialBarbero, loadAppointments]);

  // Sincroniza cada campo editable con su valor actual.
  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const discardChanges = () => {
    setForm({
      nombre: barbero.nombre || "",
      apellido: barbero.apellido || "",
      email: barbero.email || "",
      telefono: barbero.telefono || "",
      documento: barbero.documento || "",
      especialidad: barbero.especialidad || "",
    });
    setMessage(null);
  };

  // Guarda los datos personales y profesionales del barbero en la base.
  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${BASE_URL}/barberos/actualizarb.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_barbero: barbero.id_barbero,
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          documento: form.documento.trim(),
          especialidad: form.especialidad.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        throw new Error(data.mensaje || "No se pudo actualizar el perfil.");
      }

      const updated = { ...barbero, ...form, rol: "BARBERO" };
      setBarbero(updated);
      setMessage({ type: "success", text: "Datos actualizados correctamente." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "No se pudieron guardar los datos." });
    } finally {
      setSaving(false);
    }
  };

  // Valida y guarda una foto de perfil con tamaño y formatos permitidos.
  const changePhoto = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage({ type: "error", text: "Usa una imagen JPG, PNG o WebP." });
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "La foto no puede superar los 5 MB." });
      input.value = "";
      return;
    }
    if (!barbero.id_barbero) {
      setMessage({ type: "error", text: "No se encontró el identificador del barbero." });
      input.value = "";
      return;
    }

    const body = new FormData();
    body.append("foto", file);
    body.append("id_barbero", barbero.id_barbero);
    setSavingPhoto(true);
    setMessage(null);
    try {
      const response = await fetch(`${BASE_URL}/barberos/subir_foto.php`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok || data.status !== "success" || !data.foto) {
        throw new Error(data.mensaje || "No se pudo guardar la foto.");
      }

      const updated = { ...barbero, foto: data.foto };
      setBarbero(updated);
      window.dispatchEvent(new Event("barberfaster-profile-photo-updated"));
      setMessage({ type: "success", text: "Foto actualizada correctamente." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "No se pudo guardar la foto." });
    } finally {
      setSavingPhoto(false);
      input.value = "";
    }
  };

  if (!barbero) return null;

  const validPhoto = photoUrl(barbero.foto);
  const now = currentBogotaDateTime();
  const upcoming = appointments
    .filter((appointment) => (
      `${appointment.fecha}T${appointment.hora_fin}` >= now
      && ["PENDIENTE", "CONFIRMADA"].includes(appointment.estado)
    ))
    .sort(compareAppointments);
  const history = appointments
    .filter((appointment) => !upcoming.includes(appointment))
    .sort((first, second) => compareAppointments(second, first));

  // Renderiza las opciones desplegables de datos y citas del perfil.
  return (
    <div className="page-section">
      <div className="heading-row">
        <div>
          <h2>Perfil de {form.nombre} {form.apellido}</h2>
          <p className="page-description">Actualiza tus datos personales y consulta tus citas.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={onLogout}>Cerrar sesión</button>
      </div>
      {message && <p className={`status ${message.type}`} role="status">{message.text}</p>}

      {/* Muestra la identidad del barbero y permite cambiar su foto. */}
      <div className="profile-header card">
        <div className="profile-avatar-box">
          {validPhoto ? (
            <img className="profile-avatar" src={validPhoto} alt={`Foto de ${form.nombre}`} />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder" aria-hidden="true">
              {form.nombre ? form.nombre.charAt(0).toUpperCase() : "B"}
            </div>
          )}
          <label className="btn profile-upload-btn">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={changePhoto}
              disabled={savingPhoto}
              hidden
            />
            {savingPhoto ? "Guardando foto..." : "Cambiar foto"}
          </label>
        </div>
        <div className="profile-summary">
          <h3>{form.nombre} {form.apellido}</h3>
          <p>{form.email || "Sin correo asignado"}</p>
          <p>{form.especialidad || "Sin especialidad asignada"}</p>
          <span className="badge">Barbero · {barbero.barberia || "BarberFaster"}</span>
        </div>
      </div>

      {/* Las pestañas despliegan únicamente datos personales y citas. */}
      <div className="panel">
        <div className="tabs" role="tablist" aria-label="Opciones del perfil de barbero">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "datos"}
            className={tab === "datos" ? "btn" : "btn-secondary"}
            onClick={() => setTab("datos")}
          >
            Mis Datos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "citas"}
            className={tab === "citas" ? "btn" : "btn-secondary"}
            onClick={() => setTab("citas")}
          >
            Mis Citas
          </button>
        </div>

        {tab === "datos" && (
          <form className="form-grid" onSubmit={saveProfile} role="tabpanel">
            <Field name="nombre" label="Nombre" value={form.nombre} onChange={updateForm} required />
            <Field name="apellido" label="Apellido" value={form.apellido} onChange={updateForm} />
            <Field name="email" label="Correo electrónico" type="email" maxLength={120} value={form.email} onChange={updateForm} />
            <Field name="telefono" label="Teléfono" type="tel" maxLength={20} value={form.telefono} onChange={updateForm} />
            <Field name="documento" label="Documento" value={form.documento} onChange={updateForm} readOnly title="El documento no se puede cambiar desde el perfil." />
            <Field name="especialidad" label="Especialidad" value={form.especialidad} onChange={updateForm} />
            <div className="modal-actions" style={{ gridColumn: "1 / -1" }}>
              <button className="btn-secondary" type="button" onClick={discardChanges} disabled={saving}>
                Descartar cambios
              </button>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar datos"}
              </button>
            </div>
          </form>
        )}

        {tab === "citas" && (
          <section role="tabpanel" aria-label="Mis citas">
            <div className="appointment-sync-status" role="status">
              <span>
                {lastUpdated
                  ? `Actualizado ${lastUpdated.toLocaleTimeString("es-CO")}`
                  : "Actualizando citas cada 15 segundos"}
              </span>
              <span>Actualización automática cada 15 segundos</span>
            </div>
            {appointmentError && <p className="status error" role="alert">{appointmentError}</p>}
            <p className="appointment-readonly-notice">
              Las acciones para cancelar, reagendar o completar estarán disponibles cuando se configure la autenticación segura del barbero.
            </p>
            {loadingAppointments ? (
              <p role="status">Cargando citas...</p>
            ) : (
              <>
                <AppointmentSection title="Próximas citas" appointments={upcoming} emptyText="No tienes citas próximas." />
                <AppointmentSection title="Historial de citas" appointments={history} emptyText="Todavía no hay citas en tu historial." />
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// Ordena las citas por fecha y hora de inicio de forma cronológica.
function compareAppointments(first, second) {
  const firstStart = `${first.fecha}T${first.hora_inicio}`;
  const secondStart = `${second.fecha}T${second.hora_inicio}`;
  return firstStart.localeCompare(secondStart);
}

// Calcula el momento actual en la zona horaria usada por las citas.
function currentBogotaDateTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
}

// Despliega el listado de citas y su estado actual.
function AppointmentSection({ title, appointments, emptyText }) {
  return (
    <section className="barber-appointment-section">
      <h3>{title}</h3>
      {appointments.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Servicios</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id_cita}>
                  <td>{formatAppointmentDate(appointment.fecha)}</td>
                  <td>{appointment.hora_inicio.slice(0, 5)} – {appointment.hora_fin.slice(0, 5)}</td>
                  <td>{appointment.servicios || "Sin detalle"}</td>
                  <td><span className={`badge ${appointment.estado.toLowerCase()}`}>{appointment.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Presenta fechas como día local para evitar cambios por conversión UTC.
function formatAppointmentDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

// Mantiene etiquetas y controles de entrada consistentes en el formulario.
function Field({ name, label, type = "text", value, onChange, ...props }) {
  return (
    <div className="form-group">
      <label htmlFor={`perfil-${name}`}>{label}</label>
      <input id={`perfil-${name}`} name={name} type={type} value={value} onChange={onChange} {...props} />
    </div>
  );
}

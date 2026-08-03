import { useEffect, useState } from "react";
import { editarUsuario } from "../services/api";

// Constantes globales del componente
const BASE_URL = "/erpbarber/barberfaster/backend";
const PUBLIC_URL = "http://localhost/erpbarber/barberfaster/public";
const diasSemana = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

function Profile() {
  // Estado local del componente
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    documento: "",
    rol: "",
  });
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [schedule, setSchedule] = useState({
    dias_semana: [],
    hora_inicio: "09:00",
    hora_fin: "19:00",
    intervalo_minutos: 30,
  });

  // Carga inicial: usuario desde localStorage y horario desde backend
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    setFormData({
      nombre: parsed.nombre || "",
      apellido: parsed.apellido || "",
      email: parsed.email || "",
      telefono: parsed.telefono || "",
      documento: parsed.documento || "",
      rol: parsed.rol || "",
    });

    if (parsed.foto) {
      setPhotoPreview(`${PUBLIC_URL}/${parsed.foto}`);
    }

    if (!parsed.id_usuario) return;

    fetch(`${BASE_URL}/agenda/horario_barbero.php?id_usuario=${parsed.id_usuario}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.horario) return;

        setSchedule({
          dias_semana: data.horario.dias_semana || [],
          hora_inicio: data.horario.hora_inicio || "09:00",
          hora_fin: data.horario.hora_fin || "19:00",
          intervalo_minutos: Number(data.horario.intervalo_minutos) || 30,
        });
      })
      .catch(() => {
        // Ignoramos errores de carga de horario para no bloquear el perfil
      });
  }, []);

  // Actualiza los campos del formulario de perfil
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Actualiza los campos del formulario de horario
  const handleScheduleChange = (event) => {
    const { name, value } = event.target;
    setSchedule((prev) => ({
      ...prev,
      [name]: name === "intervalo_minutos" ? Number(value) : value,
    }));
  };

  // Marca o desmarca un día de la semana
  const handleDayToggle = (dayValue) => {
    setSchedule((prev) => {
      const current = prev.dias_semana || [];
      const exists = current.includes(dayValue);
      return {
        ...prev,
        dias_semana: exists ? current.filter((day) => day !== dayValue) : [...current, dayValue],
      };
    });
  };

  // Guarda los cambios de perfil en backend y localStorage
  const handleSave = async () => {
    if (!user?.id_usuario) {
      setMessage("Inicia sesión para actualizar tu perfil.");
      return;
    }

    setSavingProfile(true);
    setMessage("");

    try {
      const payload = {
        id_usuario: user.id_usuario,
        ...formData,
      };

      const data = await editarUsuario(payload);
      if (!data.success) {
        setMessage(data.error || "No se pudo actualizar el perfil.");
        return;
      }

      const updatedUser = { ...user, ...payload };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMessage("Perfil actualizado correctamente.");
    } catch {
      setMessage("Error al guardar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Guarda la configuración de horario en backend
  const handleScheduleSave = async () => {
    if (!user?.id_usuario) {
      setMessage("Inicia sesión para guardar tu horario.");
      return;
    }

    setSavingSchedule(true);
    setMessage("");

    try {
      const response = await fetch(`${BASE_URL}/agenda/horario_barbero.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: user.id_usuario,
          dias_semana: schedule.dias_semana,
          hora_inicio: schedule.hora_inicio,
          hora_fin: schedule.hora_fin,
          intervalo_minutos: schedule.intervalo_minutos,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setMessage(data.error || "No se pudo guardar el horario.");
        return;
      }

      setMessage("Horario actualizado correctamente. La agenda se ajustó a tu disponibilidad.");
    } catch {
      setMessage("Error al guardar el horario.");
    } finally {
      setSavingSchedule(false);
    }
  };

  // Subida de foto de perfil
  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id_usuario) return;

    const formDataUpload = new FormData();
    formDataUpload.append("foto", file);
    formDataUpload.append("id_usuario", user.id_usuario);

    setUploading(true);
    setMessage("");

    try {
      const response = await fetch(`${BASE_URL}/usuarios/subirFoto.php`, {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();
      if (!data.success) {
        setMessage(data.error || "No se pudo subir la foto.");
        return;
      }

      const updatedUser = { ...user, foto: data.foto };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPhotoPreview(`${PUBLIC_URL}/${data.foto}`);
      setMessage("Foto de perfil actualizada correctamente.");
    } catch {
      setMessage("Error al subir la foto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-section">
      <div className="heading-row">
        <div>
          <h2>Dashboard administrativo del barbero</h2>
          <p className="page-description">Actualiza tus datos de cuenta y gestiona tu disponibilidad desde el mismo perfil.</p>
        </div>
      </div>

      <div className="card profile-card">
        <div className="profile-header">
          <div className="profile-avatar-box">
            <img
              src={photoPreview || "https://via.placeholder.com/140x140?text=Foto"}
              alt="Foto de perfil"
              className="profile-avatar"
            />
            <label className="btn profile-upload-btn">
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              {uploading ? "Subiendo..." : "Cambiar foto"}
            </label>
          </div>

          <div className="profile-summary">
            <h3>{formData.nombre || "Tu nombre"}</h3>
            <p>{formData.email || "tu@email.com"}</p>
            <span className="badge">{formData.rol || "Usuario"}</span>
          </div>
        </div>

        <div className="profile-form-grid">
          <div className="field-group">
            <label>Nombre</label>
            <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Escribe tu nombre" />
          </div>

          <div className="field-group">
            <label>Apellido</label>
            <input name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Escribe tu apellido" />
          </div>

          <div className="field-group">
            <label>Correo electrónico</label>
            <input name="email" value={formData.email} onChange={handleChange} placeholder="correo@empresa.com" />
          </div>

          <div className="field-group">
            <label>Teléfono</label>
            <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Tu teléfono" />
          </div>

          <div className="field-group">
            <label>Documento</label>
            <input name="documento" value={formData.documento} onChange={handleChange} placeholder="Tu documento" />
          </div>

          <div className="field-group">
            <label>Rol</label>
            <select name="rol" value={formData.rol} onChange={handleChange}>
              <option value="barbero">Barbero</option>
              <option value="admin">Administrador</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn" onClick={handleSave} disabled={savingProfile}>
            {savingProfile ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div className="schedule-card">
          <div className="schedule-header">
            <h3>Configura tu disponibilidad</h3>
            <p>Elige los días que trabajas, la hora de inicio y fin de tu jornada, y el tiempo entre citas.</p>
          </div>

          <div className="days-grid">
            {diasSemana.map((dia) => {
              const selected = schedule.dias_semana.includes(dia.value);
              return (
                <button
                  key={dia.value}
                  type="button"
                  className={`day-chip ${selected ? "selected" : ""}`}
                  onClick={() => handleDayToggle(dia.value)}
                >
                  {dia.label}
                </button>
              );
            })}
          </div>

          <div className="schedule-form-grid">
            <div className="field-group">
              <label>Hora de inicio</label>
              <input type="time" name="hora_inicio" value={schedule.hora_inicio} onChange={handleScheduleChange} />
            </div>

            <div className="field-group">
              <label>Hora de fin</label>
              <input type="time" name="hora_fin" value={schedule.hora_fin} onChange={handleScheduleChange} />
            </div>

            <div className="field-group">
              <label>Intervalo entre citas</label>
              <select name="intervalo_minutos" value={String(schedule.intervalo_minutos)} onChange={handleScheduleChange}>
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn" onClick={handleScheduleSave} disabled={savingSchedule}>
              {savingSchedule ? "Guardando..." : "Guardar horario"}
            </button>
          </div>
        </div>

        {message && <p className="status success">{message}</p>}
      </div>
    </div>
  );
}

export default Profile;

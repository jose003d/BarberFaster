import { useEffect, useState } from "react";
import { crearServicio, desactivarServicio, editarUsuario, obtenerServicios } from "../services/api";

const BASE_URL = "http://localhost/erpbarber/barberfaster/backend";
const PUBLIC_URL = `${BASE_URL}/public`;
const days = [{ value: 1, label: "Lunes" }, { value: 2, label: "Martes" }, { value: 3, label: "Miércoles" }, { value: 4, label: "Jueves" }, { value: 5, label: "Viernes" }, { value: 6, label: "Sábado" }, { value: 7, label: "Domingo" }];
const emptyService = { id_servicio: null, nombre: "", precio: "", duracion_minutos: 30 };

const photoUrl = (photo) => photo ? (/^https?:\/\//i.test(photo) ? photo : `${PUBLIC_URL}/${photo}`) : "";

export default function PerfilBarbero({ barbero: initialBarbero, onChangeBarbero }) {
  const [barbero, setBarbero] = useState(initialBarbero);
  const [tab, setTab] = useState("datos");
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", telefono: "", documento: "" });
  const [schedule, setSchedule] = useState({ dias_semana: [], hora_inicio: "09:00", hora_fin: "19:00", intervalo_minutos: 30 });
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const current = initialBarbero;
    if (!current) return;
    setBarbero(current);
    setForm({ nombre: current.nombre || "", apellido: current.apellido || "", email: current.email || "", telefono: current.telefono || "", documento: current.documento || "" });
    Promise.all([
      fetch(`${BASE_URL}/agenda/horario_barbero.php?id_usuario=${current.id_usuario}`).then((response) => response.json()),
      obtenerServicios(),
      fetch(`${BASE_URL}/agenda/listar_eventos.php?id_barbero=${current.id_barbero}`).then((response) => response.json()),
    ]).then(([scheduleResponse, serviceData, appointmentData]) => {
      if (scheduleResponse.success && scheduleResponse.horario) setSchedule({ ...schedule, ...scheduleResponse.horario, dias_semana: (scheduleResponse.horario.dias_semana || []).map(Number) });
      setServices(serviceData.filter((service) => Number(service.id_barberia) === Number(current.id_barberia)));
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    }).catch((error) => setMessage({ type: "error", text: error.message || "No se pudieron cargar los datos del perfil." }))
      .finally(() => setLoading(false));
  }, [initialBarbero]);

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateSchedule = (event) => setSchedule((current) => ({ ...current, [event.target.name]: event.target.name === "intervalo_minutos" ? Number(event.target.value) : event.target.value }));
  const toggleDay = (day) => setSchedule((current) => ({ ...current, dias_semana: current.dias_semana.includes(day) ? current.dias_semana.filter((item) => item !== day) : [...current.dias_semana, day] }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await editarUsuario({ id_usuario: barbero.id_usuario, ...form, rol: "barbero" });
      if (!response.success) throw new Error(response.error || "No se pudo actualizar el perfil.");
      const updated = { ...barbero, ...form, rol: "barbero" };
      setBarbero(updated);
      localStorage.setItem("barbero_demo_sesion", JSON.stringify(updated));
      localStorage.setItem("user", JSON.stringify(updated));
      setMessage({ type: "success", text: "Datos actualizados correctamente." });
    } catch (error) { setMessage({ type: "error", text: error.message }); } finally { setSaving(false); }
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/agenda/horario_barbero.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_usuario: barbero.id_usuario, ...schedule }) });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "No se pudo guardar el horario.");
      setMessage({ type: "success", text: "Horario actualizado correctamente." });
    } catch (error) { setMessage({ type: "error", text: error.message }); } finally { setSaving(false); }
  };

  const changePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("foto", file);
    body.append("id_usuario", barbero.id_usuario);
    try {
      const response = await fetch(`${BASE_URL}/usuarios/subirFoto.php`, { method: "POST", body });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "No se pudo subir la foto.");
      const updated = { ...barbero, foto: data.foto };
      setBarbero(updated);
      localStorage.setItem("barbero_demo_sesion", JSON.stringify(updated));
      setMessage({ type: "success", text: "Foto actualizada correctamente." });
    } catch (error) { setMessage({ type: "error", text: error.message }); }
  };

  const saveService = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...serviceForm, id_barberia: Number(barbero.id_barberia), precio: Number(serviceForm.precio), duracion_minutos: Number(serviceForm.duracion_minutos) };
      const response = serviceForm.id_servicio
        ? await fetch(`${BASE_URL}/servicios/editar.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((res) => res.json())
        : await crearServicio(payload);
      if (!response.success) throw new Error(response.error || "No se pudo guardar el servicio.");
      const refreshed = await obtenerServicios();
      setServices(refreshed.filter((service) => Number(service.id_barberia) === Number(barbero.id_barberia)));
      setServiceForm(emptyService);
      setMessage({ type: "success", text: "Servicio guardado correctamente." });
    } catch (error) { setMessage({ type: "error", text: error.message }); } finally { setSaving(false); }
  };

  const removeService = async (service) => {
    try {
      const response = await desactivarServicio(service.id_servicio);
      if (!response.success) throw new Error(response.error || "No se pudo desactivar el servicio.");
      setServices((current) => current.map((item) => item.id_servicio === service.id_servicio ? { ...item, activo: 0 } : item));
      setMessage({ type: "success", text: "Servicio desactivado." });
    } catch (error) { setMessage({ type: "error", text: error.message }); }
  };

  if (loading) return <div className="page-section"><p>Cargando perfil...</p></div>;
  if (!barbero) return null;

  return (
    <div className="page-section">
      <div className="heading-row"><div><h2>Perfil de {form.nombre} {form.apellido}</h2><p className="page-description">Gestiona tus datos, horario y servicios.</p></div><button className="btn-secondary" onClick={onChangeBarbero}>Cambiar de Barbero</button></div>
      {message && <p className={`status ${message.type}`}>{message.text}</p>}
      <div className="profile-header card"><div className="profile-avatar-box"><img className="profile-avatar" src={photoUrl(barbero.foto) || "https://via.placeholder.com/140x140?text=Foto"} alt="Foto del barbero" /><label className="btn profile-upload-btn"><input type="file" accept="image/*" onChange={changePhoto} hidden />Cambiar foto</label></div><div className="profile-summary"><h3>{form.nombre} {form.apellido}</h3><p>{form.email}</p><span className="badge">Barbero · {barbero.barberia}</span></div></div>
      <div className="panel">
        <div className="tabs" role="tablist"><button className={tab === "datos" ? "btn" : "btn-secondary"} onClick={() => setTab("datos")}>Mis Datos</button><button className={tab === "horario" ? "btn" : "btn-secondary"} onClick={() => setTab("horario")}>Mi Horario</button><button className={tab === "citas" ? "btn" : "btn-secondary"} onClick={() => setTab("citas")}>Mis Citas</button><button className={tab === "servicios" ? "btn" : "btn-secondary"} onClick={() => setTab("servicios")}>Servicios</button></div>
        {tab === "datos" && <form className="form-grid" onSubmit={saveProfile}><Field name="nombre" label="Nombre" value={form.nombre} onChange={updateForm} required /><Field name="apellido" label="Apellido" value={form.apellido} onChange={updateForm} /><Field name="email" label="Correo" type="email" value={form.email} onChange={updateForm} required /><Field name="telefono" label="Teléfono" value={form.telefono} onChange={updateForm} /><Field name="documento" label="Documento" value={form.documento} onChange={updateForm} /><Action saving={saving} text="Guardar datos" /> </form>}
        {tab === "horario" && <form className="form-grid" onSubmit={saveSchedule}><div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Días de trabajo</label><div className="days-grid">{days.map((day) => <button type="button" key={day.value} className={`day-chip ${schedule.dias_semana.includes(day.value) ? "selected" : ""}`} onClick={() => toggleDay(day.value)}>{day.label}</button>)}</div></div><Field name="hora_inicio" label="Hora de inicio" type="time" value={schedule.hora_inicio} onChange={updateSchedule} required /><Field name="hora_fin" label="Hora de fin" type="time" value={schedule.hora_fin} onChange={updateSchedule} required /><Field name="intervalo_minutos" label="Intervalo en minutos" type="number" min="10" value={schedule.intervalo_minutos} onChange={updateSchedule} required /><Action saving={saving} text="Guardar horario" /></form>}
        {tab === "citas" && <div className="table-wrapper"><table><thead><tr><th>Horario</th><th>Estado</th><th>Observaciones</th></tr></thead><tbody>{appointments.length === 0 ? <tr><td colSpan="3">No hay citas o eventos próximos.</td></tr> : appointments.map((appointment) => <tr key={appointment.id}><td>{new Date(appointment.start).toLocaleString("es-CO")}</td><td>{appointment.title}</td><td>{appointment.extendedProps?.observaciones || "-"}</td></tr>)}</tbody></table></div>}
        {tab === "servicios" && <div><form className="form-grid" onSubmit={saveService}><Field name="nombre" label="Nombre" value={serviceForm.nombre} onChange={(event) => setServiceForm({ ...serviceForm, nombre: event.target.value })} required /><Field name="precio" label="Precio" type="number" min="0" step="0.01" value={serviceForm.precio} onChange={(event) => setServiceForm({ ...serviceForm, precio: event.target.value })} required /><Field name="duracion_minutos" label="Duración (minutos)" type="number" min="1" value={serviceForm.duracion_minutos} onChange={(event) => setServiceForm({ ...serviceForm, duracion_minutos: event.target.value })} required /><Action saving={saving} text={serviceForm.id_servicio ? "Actualizar servicio" : "Agregar servicio"} /></form><div className="table-wrapper"><table><thead><tr><th>Nombre</th><th>Precio</th><th>Duración</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{services.map((service) => <tr key={service.id_servicio}><td>{service.nombre}</td><td>${Number(service.precio).toLocaleString("es-CO")}</td><td>{service.duracion_minutos} min</td><td>{Number(service.activo) === 1 ? "Activo" : "Inactivo"}</td><td><button className="btn-secondary" type="button" onClick={() => setServiceForm({ id_servicio: service.id_servicio, nombre: service.nombre, precio: service.precio, duracion_minutos: service.duracion_minutos })}>Editar</button> <button className="btn-secondary" type="button" onClick={() => removeService(service)} disabled={Number(service.activo) !== 1}>Eliminar</button></td></tr>)}</tbody></table></div></div>}
      </div>
    </div>
  );
}

function Field({ name, label, type = "text", value, onChange, ...props }) { return <div className="form-group"><label htmlFor={`perfil-${name}`}>{label}</label><input id={`perfil-${name}`} name={name} type={type} value={value} onChange={onChange} {...props} /></div>; }
function Action({ saving, text }) { return <div className="modal-actions" style={{ gridColumn: "1 / -1" }}><button className="btn" type="submit" disabled={saving}>{saving ? "Guardando..." : text}</button></div>; }

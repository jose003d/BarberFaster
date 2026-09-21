import { useEffect, useMemo, useState } from "react";
import "./Agenda.css";

const BASE_URL = "/erpbarber/barberfaster/backend";
const emptyClient = { dni_cliente: "", nombre: "", apellido: "", telefono: "", correo: "", observaciones: "" };

const dateKey = (date) => {
  const value = new Date(date);
  const pad = (part) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const toSqlDatetime = (date) => {
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

const formatDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString("es-CO", { dateStyle: "full" });
const formatTime = (value) => new Date(value.replace(" ", "T")).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

function Agenda() {
  const [barberos, setBarberos] = useState([]);
  const [barbero, setBarbero] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [fecha, setFecha] = useState(dateKey(new Date()));
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [idServicio, setIdServicio] = useState("");
  const [cliente, setCliente] = useState(emptyClient);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/agenda/listar_barberos.php`)
      .then((response) => response.json())
      .then((data) => {
        setBarberos(Array.isArray(data) ? data : []);
        setBarbero((current) => current || (Array.isArray(data) ? data[0] : null));
      })
      .catch(() => setMensaje({ tipo: "error", texto: "No se pudieron cargar los barberos." }));
  }, []);

  useEffect(() => {
    if (!barbero) return;
    fetch(`${BASE_URL}/servicios/listars.php`)
      .then((response) => response.json())
      .then((data) => setServicios((data.servicios || []).filter((service) => Number(service.id_barberia) === Number(barbero.id_barberia) && Number(service.activo) === 1)))
      .catch(() => setMensaje({ tipo: "error", texto: "No se pudieron cargar los servicios." }));
  }, [barbero]);

  const cargarEventosDelDia = () => {
    if (!barbero || !fecha) return;
    setLoading(true);
    fetch(`${BASE_URL}/agenda/listar_eventos.php?id_barbero=${barbero.id_barbero}&fecha=${fecha}`)
      .then((response) => response.json())
      .then((data) => setEventos(Array.isArray(data) ? data : []))
      .catch(() => setMensaje({ tipo: "error", texto: "No se pudieron cargar los eventos del día." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarEventosDelDia(); }, [barbero, fecha]);

  const serviciosActivos = useMemo(() => servicios.filter((service) => Number(service.duracion_estimada || service.duracion_minutos) > 0), [servicios]);
  const servicioSeleccionado = serviciosActivos.find((service) => String(service.id_servicio) === String(idServicio));
  const eventosOcupados = eventos.filter((event) => event.extendedProps?.estado_disponibilidad !== "DISPONIBLE");

  const endDatetime = () => {
    if (!fecha || !horaInicio || !servicioSeleccionado) return null;
    const start = new Date(`${fecha}T${horaInicio}:00`);
    const duration = Number(servicioSeleccionado.duracion_estimada || servicioSeleccionado.duracion_minutos);
    return new Date(start.getTime() + duration * 60000);
  };

  const updateClient = (event) => setCliente((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const end = endDatetime();
    if (!barbero || !servicioSeleccionado || !end) {
      setMensaje({ tipo: "error", texto: "Selecciona barbero, fecha, hora y servicio." });
      return;
    }
    setSaving(true);
    try {
      const start = new Date(`${fecha}T${horaInicio}:00`);
      const payload = { ...cliente, id_barbero: Number(barbero.id_barbero), id_servicio: Number(servicioSeleccionado.id_servicio), start_datetime: toSqlDatetime(start), end_datetime: toSqlDatetime(end) };
      const response = await fetch(`${BASE_URL}/agenda/agendar_cita.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "No se pudo agendar la cita.");
      setMensaje({ tipo: "success", texto: `Cita creada. Finaliza a las ${end.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}.` });
      setCliente(emptyClient);
      setModalOpen(false);
      cargarEventosDelDia();
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally { setSaving(false); }
  };

  return <div className="agenda-page">
    <div className="agenda-header"><h1>Agenda</h1><p>Selecciona una fecha, hora de inicio y servicio. La hora final se calcula automáticamente.</p></div>
    {mensaje && <div className={`agenda-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}
    <div className="barberos-grid">{barberos.map((item) => <button type="button" className={`barbero-card ${barbero?.id_barbero === item.id_barbero ? "selected" : ""}`} key={item.id_barbero} onClick={() => setBarbero(item)}><span className="barbero-avatar">✂</span><span className="barbero-info"><strong>{item.nombre}</strong><span>{item.barberia}</span></span></button>)}</div>
    {barbero && <div className="agenda-layout">
      <section className="agenda-calendar-panel"><div className="agenda-panel-header"><h2>Fecha y eventos ocupados</h2></div><label className="date-picker-label" htmlFor="agenda-fecha">Fecha</label><input id="agenda-fecha" type="date" min={dateKey(new Date())} value={fecha} onChange={(event) => setFecha(event.target.value)} />{loading ? <p>Cargando eventos...</p> : eventosOcupados.length === 0 ? <p className="agenda-empty">No hay eventos ocupados para este día.</p> : <div className="occupied-events">{eventosOcupados.map((event) => <div className="occupied-event" key={event.id}><strong>{formatTime(event.start)} - {formatTime(event.end)}</strong><span>{event.title || "Ocupado"}</span></div>)}</div>}</section>
      <section className="agenda-schedule-panel"><div className="agenda-panel-header"><div><h2>Seleccionar horario</h2><span className="agenda-date-label">{formatDate(fecha)}</span></div></div><div className="schedule-selection"><label htmlFor="agenda-hora">Hora de inicio</label><input id="agenda-hora" type="time" value={horaInicio} onChange={(event) => setHoraInicio(event.target.value)} /><button type="button" className="btn" onClick={() => setModalOpen(true)}>Continuar con la cita</button><p>El servicio y los datos del cliente se solicitan al continuar.</p></div></section>
    </div>}
    {modalOpen && <div className="agenda-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><div className="agenda-modal" role="dialog" aria-modal="true" aria-labelledby="agenda-modal-title"><div className="modal-heading"><div><h3 id="agenda-modal-title">Nueva cita</h3><p>{formatDate(fecha)} · {horaInicio}</p></div><button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="Cerrar">&times;</button></div><form className="appointment-form" onSubmit={submit}><label>Servicio<select value={idServicio} onChange={(event) => setIdServicio(event.target.value)} required><option value="">Selecciona un servicio</option>{serviciosActivos.map((service) => <option key={service.id_servicio} value={service.id_servicio}>{service.nombre} · {service.duracion_estimada || service.duracion_minutos} min</option>)}</select></label><div className="calculated-end"><span>Hora final</span><strong>{endDatetime() ? endDatetime().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "Selecciona un servicio"}</strong></div><label>DNI del cliente<input name="dni_cliente" value={cliente.dni_cliente} onChange={updateClient} required /></label><label>Nombre<input name="nombre" value={cliente.nombre} onChange={updateClient} required /></label><label>Apellido<input name="apellido" value={cliente.apellido} onChange={updateClient} /></label><label>Teléfono<input name="telefono" value={cliente.telefono} onChange={updateClient} /></label><label>Correo<input type="email" name="correo" value={cliente.correo} onChange={updateClient} /></label><label>Observaciones<textarea name="observaciones" value={cliente.observaciones} onChange={updateClient} rows="3" /></label><div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button className="btn" type="submit" disabled={saving}>{saving ? "Agendando..." : "Agendar cita"}</button></div></form></div></div>}
  </div>;
}

export default Agenda;

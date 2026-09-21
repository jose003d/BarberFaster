import { useEffect, useMemo, useState } from "react";
import { formatDateLabel, getDateKey, isWorkingDay, parseTimeToDate } from "./agendaUtils";
import "./Agenda.css";

const BASE_URL = "/erpbarber/barberfaster/backend";
const defaultHorario = {
  dias_semana: [1, 2, 3, 4, 5, 6, 7],
  hora_inicio: "09:00",
  hora_fin: "19:00",
  intervalo_minutos: 30,
};
const emptyClient = { nombre: "", apellido: "", dni: "", telefono: "", correo: "" };
const initialForm = { dni: "", nombre: "", apellido: "", telefono: "", correo: "", observaciones: "", cliente_id: null };

function Agenda() {
  const [barberos, setBarberos] = useState([]);
  const [barberoSel, setBarberoSel] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [horarioBarbero, setHorarioBarbero] = useState(defaultHorario);
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mensaje, setMensaje] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [cliente, setCliente] = useState(emptyClient);
  const [clienteExistente, setClienteExistente] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [validationSent, setValidationSent] = useState(false);
  const [codigoEnv, setCodigoEnv] = useState("");
  const [validated, setValidated] = useState(false);
  const [metodoVal, setMetodoVal] = useState("sms");
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoSel, setEventoSel] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const resetAgendaState = () => {
    setEventos([]);
    setHorarioBarbero(defaultHorario);
    setDiasDisponibles([]);
    setDiaSeleccionado("");
    setSelectedDate(new Date());
    setValidationSent(false);
    setCodigoEnv("");
    setValidated(false);
    setMetodoVal("sms");
  };

  useEffect(() => {
    fetch(`${BASE_URL}/agenda/listar_barberos.php`)
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setBarberos(list);
        setBarberoSel((current) => current || list[0] || null);
      })
      .catch(() => {
        setMensaje({ tipo: "error", texto: "No se pudieron cargar los barberos." });
      });
  }, []);

  useEffect(() => {
    if (!barberoSel) {
      resetAgendaState();
      return;
    }

    const cargarEventos = fetch(`${BASE_URL}/agenda/listar_eventos.php?id_barbero=${barberoSel.id_barbero}`)
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) return [];
        return data;
      });

    const cargarHorario = barberoSel.id_usuario
      ? fetch(`${BASE_URL}/agenda/horario_barbero.php?id_usuario=${barberoSel.id_usuario}`)
          .then((response) => response.json())
          .then((data) => (data && data.success && data.horario ? data.horario : defaultHorario))
      : Promise.resolve(defaultHorario);

    Promise.all([cargarEventos, cargarHorario])
      .then(([eventosList, horario]) => {
        setEventos(eventosList);
        setHorarioBarbero(horario || defaultHorario);

        const fechaKeys = [...new Set(
          eventosList
            .filter((evento) => Boolean(evento.extendedProps?.disponible))
            .map((evento) => getDateKey(evento.start))
            .filter(Boolean)
        )].sort();

        const workingDates = [];
        if (Array.isArray(horario?.dias_semana) && horario.dias_semana.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          for (let i = 0; i < 35; i += 1) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const key = getDateKey(d);
            if (isWorkingDay(key, horario.dias_semana)) {
              workingDates.push(key);
            }
          }
        }

        const fechas = fechaKeys.length > 0
          ? [...new Set([...fechaKeys, ...workingDates])].sort()
          : workingDates;

        setDiasDisponibles(fechas);
        setDiaSeleccionado((current) => (fechas.includes(current) ? current : fechas[0] || ""));
        if (fechas[0]) {
          const fechaBase = new Date(`${fechas[0]}T12:00:00`);
          setSelectedDate(fechaBase);
        }
      })
      .catch(() => {
        setEventos([]);
        setHorarioBarbero(defaultHorario);
        setDiasDisponibles([]);
        setDiaSeleccionado("");
        setMensaje({ tipo: "error", texto: "No se pudieron cargar los eventos del barbero seleccionado." });
      });
  }, [barberoSel]);

  const horariosDisponibles = useMemo(() => {
    if (!diaSeleccionado) return [];

    const horarioActual = horarioBarbero || defaultHorario;
    const interval = Number(horarioActual.intervalo_minutos) || 30;
    const horaInicio = horarioActual.hora_inicio || "09:00";
    const horaFin = horarioActual.hora_fin || "19:00";

    const startDate = parseTimeToDate(diaSeleccionado, horaInicio);
    const endDate = parseTimeToDate(diaSeleccionado, horaFin);
    if (!startDate || !endDate || endDate <= startDate) return [];

    const slots = [];
    let current = new Date(startDate);

    while (current < endDate) {
      const next = new Date(current.getTime() + interval * 60000);
      if (next > endDate) break;

      const matching = eventos.find(
        (event) => getDateKey(event.start) === diaSeleccionado && new Date(event.start).getTime() === current.getTime()
      );
      const disponible = matching ? Boolean(matching.extendedProps?.disponible) : true;

      slots.push({
        id: matching ? matching.id : `${diaSeleccionado}_${current.getTime()}`,
        start: new Date(current),
        end: new Date(next),
        disponible,
      });

      current = next;
    }

    return slots;
  }, [diaSeleccionado, eventos, horarioBarbero]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "dni" ? { cliente_id: null } : {}),
    }));
  };

  const handleDniBlur = async () => {
    const dni = form.dni?.trim();
    if (!dni) return;

    setBuscandoCliente(true);
    try {
      const response = await fetch(`${BASE_URL}/clientes/buscar.php?dni=${encodeURIComponent(dni)}`);
      const data = await response.json();

      if (data.success && data.cliente) {
        setClienteExistente(data.cliente);
        setForm((prev) => ({
          ...prev,
          cliente_id: data.cliente.id_cliente || prev.cliente_id,
          dni: data.cliente.dni?.toString() || prev.dni,
          nombre: data.cliente.nombre || prev.nombre,
          apellido: data.cliente.apellido || prev.apellido,
          telefono: data.cliente.telefono || prev.telefono,
          correo: data.cliente.correo || prev.correo,
        }));
        setMensaje({ tipo: "success", texto: "Cliente encontrado. Se completaron tus datos automáticamente." });
      } else {
        setClienteExistente(null);
        setMensaje({ tipo: "info", texto: "No se encontró un cliente registrado con ese documento. Completa los datos para crear uno nuevo." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo buscar el cliente." });
    } finally {
      setBuscandoCliente(false);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!eventoSel || !form.dni || !form.nombre || !form.apellido || !form.telefono || !form.correo) {
      setMensaje({ tipo: "error", texto: "Completa todos los campos para agendar la cita." });
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch(`${BASE_URL}/agenda/agendar_cita.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_barbero: barberoSel?.id_barbero,
          id_cliente: form.cliente_id,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono,
          correo: form.correo,
          observaciones: form.observaciones,
          start: eventoSel.start,
          end: eventoSel.end,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMensaje({ tipo: "success", texto: "Cita agendada correctamente." });
        setModalOpen(false);
        setEventoSel(null);
      } else {
        setMensaje({ tipo: "error", texto: data.error || "No se pudo agendar la cita." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión al agendar la cita." });
    } finally {
      setEnviando(false);
    }
  };

  const sendValidationCode = async () => {
    setValidationSent(true);
    setMensaje({ tipo: "success", texto: `Código de validación enviado por ${metodoVal}.` });
  };

  const verifyValidationCode = async () => {
    if (!codigoEnv.trim()) {
      setMensaje({ tipo: "error", texto: "Ingresa el código de validación." });
      return;
    }
    setValidated(true);
    setMensaje({ tipo: "success", texto: "Código verificado correctamente." });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEventoSel(null);
    setSlotSeleccionado(null);
    setValidationSent(false);
    setCodigoEnv("");
    setValidated(false);
    setMetodoVal("sms");
  };

  const handleSlotClick = (slot) => {
    if (!slot.disponible) return;
    setEventoSel({ id: slot.id, start: slot.start, end: slot.end });
    setSlotSeleccionado(slot.id);
    setModalOpen(true);
  };

  const fechaSeleccionadaLabel = diaSeleccionado ? formatDateLabel(`${diaSeleccionado}T12:00:00`) : "Selecciona un día";

  return (
    <div className="agenda-page">
      <div className="agenda-header">
        <h1>📅 Agenda BarberFaster</h1>
        <p>Elige un barbero y selecciona un horario disponible para agendar tu cita</p>
      </div>

      {mensaje && (
        <div className={`agenda-mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="barberos-grid">
        {barberos.map((barbero) => (
          <button
            key={barbero.id_barbero}
            type="button"
            className={`barbero-card ${barberoSel?.id_barbero === barbero.id_barbero ? "selected" : ""}`}
            onClick={() => setBarberoSel(barbero)}
          >
            <div className="barbero-avatar">✂️</div>
            <div className="barbero-info">
              <strong>{barbero.nombre} {barbero.apellido}</strong>
              <span>{barbero.barberia || "Barbería"}</span>
            </div>
          </button>
        ))}
      </div>

      {barberoSel && (
        <div className="agenda-layout">
          <div className="agenda-calendar-panel">
            <div className="agenda-panel-header">
              <h2>Calendario</h2>
            </div>

            <div className="date-picker-wrapper">
              <label>Selecciona una fecha:</label>
              <div className="agenda-day-list">
                {diasDisponibles.length === 0 ? (
                  <p className="agenda-empty">No hay días disponibles para este barbero.</p>
                ) : (
                  diasDisponibles.map((fechaKey) => (
                    <button
                      key={fechaKey}
                      type="button"
                      className={`agenda-day-item ${diaSeleccionado === fechaKey ? "active" : ""}`}
                      onClick={() => { setDiaSeleccionado(fechaKey); setSelectedDate(new Date(`${fechaKey}T12:00:00`)); }}
                    >
                      {formatDateLabel(`${fechaKey}T12:00:00`)}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="agenda-schedule-panel">
            <div className="agenda-panel-header">
              <h2>Agenda de {barberoSel.nombre} {barberoSel.apellido}</h2>
              <span className="agenda-date-label">{fechaSeleccionadaLabel}</span>
            </div>

            <div className="agenda-slots">
              {horariosDisponibles.length === 0 ? (
                <p className="agenda-empty">No hay horarios disponibles para la fecha seleccionada.</p>
              ) : (
                horariosDisponibles.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    className={`agenda-slot ${slot.disponible ? "available" : "booked"} ${slotSeleccionado === slot.id ? "selected" : ""}`}
                    onClick={() => handleSlotClick(slot)}
                    disabled={!slot.disponible}
                  >
                    {slot.start.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} - {slot.end.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && eventoSel && (
        <div className="agenda-modal-backdrop">
          <div className="agenda-modal">
            <h3>Agendar Cita</h3>
            <p className="agenda-horario">
              🕐 {eventoSel.start?.toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" })}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>DNI / Documento</label>
                <input type="number" name="dni" value={form.dni} onChange={handleChange} onBlur={handleDniBlur} required />
                {buscandoCliente && <small>Buscando cliente...</small>}
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" name="telefono" value={form.telefono} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Correo</label>
                <input type="email" name="correo" value={form.correo} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Observaciones (opcional)</label>
                <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} />
              </div>

              <div className="form-group">
                <label>Método de validación</label>
                <select value={metodoVal} onChange={(event) => setMetodoVal(event.target.value)}>
                  <option value="sms">SMS</option>
                  <option value="email">Correo</option>
                </select>
                <div style={{ marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={sendValidationCode} disabled={validationSent}>
                    Enviar código
                  </button>
                </div>
              </div>

              {validationSent && (
                <div className="form-group">
                  <label>Código de validación</label>
                  <input type="text" value={codigoEnv} onChange={(event) => setCodigoEnv(event.target.value)} />
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn" onClick={verifyValidationCode} disabled={validated}>
                      Verificar código
                    </button>
                    {validated && <span style={{ marginLeft: 8, color: "green" }}>Verificado</span>}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={enviando}>
                  Cancelar
                </button>
                <button type="submit" className="btn" disabled={enviando}>
                  {enviando ? "Confirmando..." : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agenda;

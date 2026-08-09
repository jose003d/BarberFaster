import { useEffect, useState } from "react";
import "./Agenda.css";
import {
  formatDateLabel,
  formatRangeLabel,
  formatTimeLabel,
  getDateKey,
  isWorkingDay,
  parseTimeToDate,
} from "./agendaUtils";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

const BASE_URL = "/erpbarber/barberfaster/backend";
const initialForm = { dni: "", nombre: "", apellido: "", telefono: "", correo: "", observaciones: "", cliente_id: null };

function Agenda() {
  const [barberos, setBarberos] = useState([]);
  const [barberoSel, setBarberoSel] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [horarioBarbero, setHorarioBarbero] = useState(null);
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState("");
  const [eventoSel, setEventoSel] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteExistente, setClienteExistente] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [metodoVal, setMetodoVal] = useState('sms');
  const [codigoEnv, setCodigoEnv] = useState('');
  const [validationSent, setValidationSent] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/agenda/listar_barberos.php`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBarberos(data);
          const storedUser = JSON.parse(localStorage.getItem("user") || "null");
          const matchingBarbero = data.find((barbero) => Number(barbero.id_usuario) === Number(storedUser?.id_usuario));
          const defaultBarbero = matchingBarbero || data[0] || null;
          setBarberoSel(defaultBarbero);
        } else {
          setBarberos([]);
          setMensaje({ tipo: "error", texto: "No se encontró la lista de barberos." });
        }
      })
      .catch(() => {
        setBarberos([]);
        setMensaje({ tipo: "error", texto: "No se pudo cargar la lista de barberos." });
      });
  }, []);

  const resetAgendaState = () => {
    setEventos([]);
    setHorarioBarbero(null);
    setDiasDisponibles([]);
    setDiaSeleccionado("");
    setEventoSel(null);
    setSlotSeleccionado(null);
  };

  useEffect(() => {
    if (!barberoSel) {
      resetAgendaState();
      return;
    }

    resetAgendaState();

    const cargarEventos = fetch(`${BASE_URL}/agenda/listar_eventos.php?id_barbero=${barberoSel.id_barbero}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("No se encontraron eventos para el barbero seleccionado.");
        }
        return data;
      });

    const cargarHorario = barberoSel.id_usuario
      ? fetch(`${BASE_URL}/agenda/horario_barbero.php?id_usuario=${barberoSel.id_usuario}`)
          .then((r) => r.json())
          .then((data) => (data.success ? data.horario : null))
      : Promise.resolve(null);

    Promise.all([cargarEventos, cargarHorario])
      .then(([eventosList, horario]) => {
        setEventos(eventosList);
        setHorarioBarbero(horario);

        let fechas = [...new Set(
          eventosList
            .filter((evento) => Boolean(evento.extendedProps?.disponible))
            .map((evento) => getDateKey(evento.start))
            .filter(Boolean)
        )].sort();

        const workingDates = [];
        if (horario && Array.isArray(horario.dias_semana) && horario.dias_semana.length > 0) {
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

        if (fechas.length === 0) {
          fechas = workingDates;
        } else if (workingDates.length > 0) {
          fechas = [...new Set([...fechas, ...workingDates])].sort();
        }

        setDiasDisponibles(fechas);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const initialDate = fechas[0] || "";
        setDiaSeleccionado((prev) => (fechas.includes(prev) ? prev : initialDate));
      })
      .catch(() => {
        setEventos([]);
        setHorarioBarbero(null);
        setDiasDisponibles([]);
        setDiaSeleccionado("");
        setMensaje({ tipo: "error", texto: "No se pudieron cargar los eventos del barbero seleccionado." });
      });
  }, [barberoSel]);

  const generateSlotsForDay = (key) => {
    if (!key) return [];

    const dateStr = key;
    const diasSemana = horarioBarbero?.dias_semana || [];
    if (!isWorkingDay(dateStr, diasSemana)) {
      return [];
    }

    const interval = horarioBarbero?.intervalo_minutos ? Number(horarioBarbero.intervalo_minutos) : null;
    const horaInicio = horarioBarbero?.hora_inicio;
    const horaFin = horarioBarbero?.hora_fin;

    if (!interval || !horaInicio || !horaFin) {
      return [];
    }

    const startDate = parseTimeToDate(dateStr, horaInicio);
    const endDate = parseTimeToDate(dateStr, horaFin);
    if (!startDate || !endDate || endDate <= startDate) {
      return [];
    }

    const slots = [];
    try {
      let current = new Date(startDate);
      while (current < endDate) {
        const next = new Date(current.getTime() + interval * 60000);
        if (next > endDate) break;

        const matching = eventos.find((ev) => getDateKey(ev.start) === dateStr && new Date(ev.start).getTime() === current.getTime());
        const disponible = matching ? Boolean(matching.extendedProps?.disponible) : true;
        slots.push({
          id: matching ? matching.id : `${dateStr}_${current.getTime()}`,
          start: new Date(current),
          end: new Date(next),
          disponible,
        });

        current = next;
      }
    } catch (e) {
      return [];
    }

    return slots;
  };

  const handleEventClick = (info) => {
    const disponible = info?.extendedProps?.disponible ?? info.disponible;
    if (!disponible) return;

    const evento = {
      id: info.id,
      start: info.start,
      end: info.end,
      extendedProps: {
        disponible,
      },
    };

    setEventoSel({
      id: evento.id,
      start: evento.start,
      end: evento.end,
    });
    setSlotSeleccionado(evento.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEventoSel(null);
    setSlotSeleccionado(null);
    setValidationSent(false);
    setCodigoEnv('');
    setValidated(false);
    setMetodoVal('sms');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      if (name === 'dni') {
        return { ...prev, [name]: value, cliente_id: null };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleDniBlur = async () => {
    const dni = form.dni?.trim();
    if (!dni) return;

    setBuscandoCliente(true);
    try {
      const res = await fetch(`${BASE_URL}/clientes/buscar.php?dni=${encodeURIComponent(dni)}`);
      const data = await res.json();

      if (data.success && data.cliente) {
        setClienteExistente(data.cliente);
        setForm(prev => ({
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
      setClienteExistente(null);
      setMensaje({ tipo: "error", texto: "No se pudo buscar el cliente." });
    } finally {
      setBuscandoCliente(false);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const formatSqlDatetime = (date) => {
    if (!date) return null;
    const pad = (value) => String(value).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const payload = {
        ...form,
        id_evento: eventoSel?.id || null,
        start: formatSqlDatetime(eventoSel?.start),
        end: formatSqlDatetime(eventoSel?.end),
        id_barbero: barberoSel?.id_barbero || null,
      };

      const payloadWithCode = {
        ...payload,
        validation_code: codigoEnv,
        metodo_validacion: metodoVal,
      };

      const res = await fetch(`${BASE_URL}/agenda/agendar_cita.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadWithCode),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje({ tipo: "success", texto: data.message });
        closeModal();
        setForm(initialForm);
        setClienteExistente(null);
        setEventos(prev => prev.map(ev =>
          ev.id == eventoSel?.id
            ? { ...ev, title: "❌ Ocupado", color: "#dc2626", extendedProps: { disponible: false } }
            : ev
        ));
      } else {
        setMensaje({ tipo: "error", texto: data.error });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión" });
    } finally {
      setEnviando(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  };

  const sendValidationCode = async () => {
    if (!form.dni) {
      setMensaje({ tipo: 'error', texto: 'Introduce DNI primero' });
      return;
    }
    setValidationSent(true);
    try {
      const res = await fetch(`${BASE_URL}/agenda/enviar_codigo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: form.dni, metodo: metodoVal, telefono: form.telefono, correo: form.correo })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje({ tipo: 'success', texto: 'Código enviado. Revisa tu ' + (metodoVal === 'sms' ? 'teléfono' : 'correo') });
        // En modo debug el endpoint devuelve debug_code
        if (data.debug_code) setCodigoEnv(data.debug_code);
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'No se pudo enviar el código' });
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    }
    setTimeout(() => setMensaje(null), 4000);
  };

  const verifyValidationCode = async () => {
    if (!form.dni || !codigoEnv) {
      setMensaje({ tipo: 'error', texto: 'Falta DNI o código' });
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/agenda/verificar_codigo.php?dni=${encodeURIComponent(form.dni)}&codigo=${encodeURIComponent(codigoEnv)}`);
      const data = await res.json();
      if (data.success) {
        setValidated(true);
        setMensaje({ tipo: 'success', texto: 'Código verificado. Ahora confirma la cita.' });
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Código inválido' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    }
    setTimeout(() => setMensaje(null), 4000);
  };

  const horarios = diaSeleccionado ? generateSlotsForDay(diaSeleccionado) : [];
  const fechaSeleccionadaLabel = diaSeleccionado
    ? formatDateLabel(`${diaSeleccionado}T12:00:00`)
    : "Selecciona un día";

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

      {/* Lista de barberos */}
      <div className="barberos-grid">
        {barberos.map(b => (
          <div
            key={b.id_barbero}
            className={`barbero-card ${barberoSel?.id_barbero === b.id_barbero ? "selected" : ""}`}
            onClick={() => setBarberoSel(b)}
          >
            <div className="barbero-avatar">✂️</div>
            <div className="barbero-info">
              <strong>{b.nombre} {b.apellido}</strong>
              <span>{b.barberia}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Calendario */}
      {barberoSel && (
        <div className="calendario-wrapper">
          <h2>Agenda de {barberoSel.nombre} {barberoSel.apellido}</h2>
          <div className="leyenda">
            <span className="leyenda-item disponible">✅ Disponible</span>
            <span className="leyenda-item ocupado">❌ Ocupado</span>
          </div>
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              events={eventos}
              eventClick={(info) => handleEventClick(info.event)}
              nowIndicator={true}
              allDaySlot={false}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
            />
          </div>
        </div>
      )}

      {/* Modal de agendamiento */}
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
                <input
                  type="number"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  onBlur={handleDniBlur}
                  required
                />
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
                <select value={metodoVal} onChange={(e) => setMetodoVal(e.target.value)}>
                  <option value="sms">SMS</option>
                  <option value="email">Correo</option>
                </select>
                <div style={{ marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={sendValidationCode} disabled={validationSent}>Enviar código</button>
                </div>
              </div>

              {validationSent && (
                <div className="form-group">
                  <label>Código de validación</label>
                  <input type="text" value={codigoEnv} onChange={(e) => setCodigoEnv(e.target.value)} />
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn" onClick={verifyValidationCode} disabled={validated}>Verificar código</button>
                    {validated && <span style={{ marginLeft: 8, color: 'green' }}>Verificado</span>}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={enviando}>
                  Cancelar
                </button>
                <button type="submit" className="btn" disabled={enviando}>
                  {enviando ? "Agendando..." : "Confirmar Cita"}
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
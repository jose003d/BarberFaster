import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import es from 'date-fns/locale/es';
import './Agenda.css';
import TimeSlotGrid from './TimeSlotGrid';
import { getAvailableTimeSlots } from './timeSlotUtils';

const BASE_URL = 'http://localhost/erpbarber/barberfaster/backend';

registerLocale('es', es);

const formatearFechaLocal = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Agenda() {
  const [pasoActual, setPasoActual] = useState(1);

  const [barberos, setBarberos] = useState([]);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [citasOcupadas, setCitasOcupadas] = useState([]);
  const [cargandoOcupaciones, setCargandoOcupaciones] = useState(false);
  const [errorOcupaciones, setErrorOcupaciones] = useState('');

  // Horario configurado de la barbería
  const [horarioBarberia, setHorarioBarberia] = useState({
    apertura: '08:00',
    cierre: '19:00'
  });
  const [horarioCargado, setHorarioCargado] = useState(false);
  const [errorHorario, setErrorHorario] = useState('');

  // Fechas
  const [fechaObjeto, setFechaObjeto] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    formatearFechaLocal(new Date())
  );

  const [horaSeleccionada, setHoraSeleccionada] = useState('');

  // Modales
  const [mostrarModalDatePicker, setMostrarModalDatePicker] = useState(false);
  const [mostrarModalCita, setMostrarModalCita] = useState(false);

  // Formulario cliente
  const [dniCliente, setDniCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [mensaje, setMensaje] = useState(null);

  // ==========================================
  // FUNCIONES AUXILIARES
  // ==========================================
  const formatearHoraLimpiaStr = (time24) => {
    if (!time24) return '';
    const [hh, mm] = time24.split(':').map(Number);
    const dateObj = new Date();
    dateObj.setHours(hh, mm, 0, 0);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatearFechaCabecera = (strFecha) => {
    if (!strFecha) return '';
    const [anio, mes, dia] = strFecha.split('-');
    const fechaObj = new Date(anio, mes - 1, dia);
    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const obtenerBarberiaActivaId = () => {
    try {
      const stored = localStorage.getItem("barberia_demo_admin");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.id_barberia || parsed.id || 1;
      }
    } catch (e) {
      const raw = localStorage.getItem("barberia_demo_admin");
      if (raw && !isNaN(raw)) return Number(raw);
    }
    return 1;
  };

  // 1. Cargar horario de la barbería
  useEffect(() => {
    const idBarberia = obtenerBarberiaActivaId();
    fetch(`${BASE_URL}/barberias/perfil.php?id_barberia=${idBarberia}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.status !== 'success' || !data.data) {
          throw new Error(data.mensaje || 'No se pudo cargar el horario de atención.');
        }
        const apertura = data.data.hora_apertura?.substring(0, 5);
        const cierre = data.data.hora_cierre?.substring(0, 5);
        if (!apertura || !cierre) throw new Error('El horario de atención no está configurado.');
        setHorarioBarberia({ apertura, cierre });
      })
      .catch((error) => setErrorHorario(error.message || 'No se pudo cargar el horario de atención.'))
      .finally(() => setHorarioCargado(true));
  }, []);

  // 2. Cargar Barberos
  useEffect(() => {
    fetch(`${BASE_URL}/barberos/listar_barberos.php`)
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.barberos || data.datos || [];
        setBarberos(lista);
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los barberos.' }));
  }, []);

  // 3. Cargar Servicios del Barbero
  const seleccionarBarberoYAvanzar = (b) => {
    setBarberoSeleccionado(b);
    const idBarbero = b.id_barbero || b.id;

    fetch(`${BASE_URL}/servicios/servicios_por_barbero.php?id_barbero=${idBarbero}`)
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.servicios || data.datos || [];
        setServicios(lista);
        if (lista.length > 0) {
          const idInicial = String(lista[0].id_servicio || lista[0].id);
          setServiciosSeleccionados([idInicial]);
        } else {
          setServiciosSeleccionados([]);
        }
        setPasoActual(2);
      })
      .catch(() => {
        setServicios([]);
        setPasoActual(2);
      });
  };

  // 4. Cargar únicamente las ocupaciones activas del día seleccionado.
  const cargarCitasOcupadas = useCallback(async (signal) => {
    if (!barberoSeleccionado) return;
    const idBarbero = barberoSeleccionado.id_barbero || barberoSeleccionado.id;

    setCargandoOcupaciones(true);
    setErrorOcupaciones('');
    try {
      const query = new URLSearchParams({ id_barbero: idBarbero, fecha: fechaSeleccionada });
      const response = await fetch(`${BASE_URL}/agenda/listar_ocupaciones.php?${query}`, { signal });
      const data = await response.json();
      if (!response.ok || data.status !== 'success' || !Array.isArray(data.datos)) {
        throw new Error(data.mensaje || 'No se pudieron consultar las citas ocupadas.');
      }
      setCitasOcupadas(data.datos);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setCitasOcupadas([]);
      setErrorOcupaciones(error.message || 'No se pudieron consultar las citas ocupadas.');
    } finally {
      if (!signal?.aborted) setCargandoOcupaciones(false);
    }
  }, [barberoSeleccionado, fechaSeleccionada]);

  useEffect(() => {
    const controller = new AbortController();
    setCitasOcupadas([]);
    cargarCitasOcupadas(controller.signal);
    return () => controller.abort();
  }, [cargarCitasOcupadas]);

  const handleToggleServicio = (idServicioStr) => {
    setHoraSeleccionada('');
    setServiciosSeleccionados((prev) => {
      if (prev.includes(idServicioStr)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== idServicioStr);
      } else {
        return [...prev, idServicioStr];
      }
    });
  };

  const duracionTotalMinutos = servicios
    .filter((s) => serviciosSeleccionados.includes(String(s.id_servicio || s.id)))
    .reduce((acc, curr) => acc + parseInt(curr.duracion_minutos || curr.duracion || 30, 10), 0);

  const precioTotal = servicios
    .filter((s) => serviciosSeleccionados.includes(String(s.id_servicio || s.id)))
    .reduce((acc, curr) => acc + parseFloat(curr.precio || 0), 0);

  const citasOcupadasDelDia = citasOcupadas;
  const horariosDisponibles = useMemo(
    () => getAvailableTimeSlots({
      openingTime: horarioBarberia.apertura,
      closingTime: horarioBarberia.cierre,
      durationMinutes: duracionTotalMinutos,
      appointments: citasOcupadas,
      date: fechaSeleccionada,
    }),
    [horarioBarberia, duracionTotalMinutos, citasOcupadas, fechaSeleccionada]
  );
  const horarioElegido = horariosDisponibles.find(
    (slot) => slot.hora_inicio.slice(0, 5) === horaSeleccionada
  );
  const estadoDisponibilidad = horarioElegido
    ? {
        disponible: true,
        horaInicioStr: horarioElegido.hora_inicio.slice(0, 5),
        horaFinStr: horarioElegido.hora_fin.slice(0, 5),
      }
    : { disponible: false };

  const handleFechaChange = (date) => {
    if (!date) return;
    setFechaObjeto(date);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setFechaSeleccionada(`${yyyy}-${mm}-${dd}`);
    setHoraSeleccionada('');
    setMostrarModalDatePicker(false);
  };

  // ABRE EL MODAL DE RESERVA
  const handleAbrirModalConfirmacion = () => {
    if (!estadoDisponibilidad.disponible) {
      setMensaje({ tipo: 'error', texto: 'Selecciona una hora válida dentro del horario disponible.' });
      return;
    }
    setMensaje(null);
    setMostrarModalCita(true);
  };

  // PROCESA EL AGENDAMIENTO AL PRESIONAR EL FORMULARIO
  const handleAgendarCita = (e) => {
    e.preventDefault();

    if (!dniCliente.trim() || !nombreCliente.trim()) {
      setMensaje({ tipo: 'error', texto: 'Por favor, completa la cédula y el nombre del cliente.' });
      return;
    }

    if (!estadoDisponibilidad.disponible) {
      setMensaje({ tipo: 'error', texto: 'La hora seleccionada no está disponible.' });
      return;
    }

    const payload = {
      id_barberia: obtenerBarberiaActivaId(),
      id_barbero: barberoSeleccionado.id_barbero || barberoSeleccionado.id,
      fecha: fechaSeleccionada,
      hora_inicio: `${estadoDisponibilidad.horaInicioStr}:00`,
      servicios: serviciosSeleccionados.map((id) => parseInt(id, 10)),
      dni_cliente: dniCliente,
      nombre_cliente: nombreCliente,
      telefono_cliente: telefonoCliente,
      notas: `${nombreCliente}${telefonoCliente ? ` - Teléfono: ${telefonoCliente}` : ''}${observaciones ? ` - ${observaciones}` : ''}`,
    };

    fetch(`${BASE_URL}/agenda/agendar_cita.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success || resData.status === 'success') {
          setMensaje({ tipo: 'success', texto: '¡Cita agendada exitosamente!' });
          setMostrarModalCita(false);
          setDniCliente('');
          setNombreCliente('');
          setTelefonoCliente('');
          setObservaciones('');
          
          cargarCitasOcupadas();
        } else {
          setMensaje({ tipo: 'error', texto: resData.error || resData.mensaje || 'Error al agendar cita.' });
        }
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' }));
  };

  return (
    <div className="agenda-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div className="agenda-header" style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h1>🗓️ Agenda BarberFaster</h1>
        <p style={{ color: '#666' }}>Reserva tu cita rápida en 3 sencillos pasos</p>
      </div>

      {/* PROGRESO DE PASOS */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '8px 16px', borderRadius: '20px', background: pasoActual === 1 ? '#d4af37' : '#e5e7eb', color: pasoActual === 1 ? '#fff' : '#4b5563', fontWeight: 'bold' }}>
          1. Barbero
        </div>
        <div style={{ padding: '8px 16px', borderRadius: '20px', background: pasoActual === 2 ? '#d4af37' : '#e5e7eb', color: pasoActual === 2 ? '#fff' : '#4b5563', fontWeight: 'bold' }}>
          2. Servicios
        </div>
        <div style={{ padding: '8px 16px', borderRadius: '20px', background: pasoActual === 3 ? '#d4af37' : '#e5e7eb', color: pasoActual === 3 ? '#fff' : '#4b5563', fontWeight: 'bold' }}>
          3. Horario
        </div>
      </div>

      {mensaje && <div className={`agenda-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      {/* PASO 1 */}
      {pasoActual === 1 && (
        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>¿Con quién te deseas atender hoy?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {barberos.map((b) => (
              <div
                key={b.id_barbero || b.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                {b.foto ? (
                  <img
                    src={`${BASE_URL}/uploads/${b.foto}`}
                    alt={b.nombre}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #d4af37', marginBottom: '12px' }}
                  />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fefce8', border: '2px solid #d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '12px' }}>
                    💈
                  </div>
                )}
                
                <h3 style={{ margin: '0 0 4px 0', color: '#111827' }}>{b.nombre || b.nombre_barbero}</h3>
                <span style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '8px' }}>{b.especialidad || 'Especialista en Barbería'}</span>
                {b.descripcion && <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 16px 0' }}>{b.descripcion}</p>}
                
                <button
                  onClick={() => seleccionarBarberoYAvanzar(b)}
                  style={{ width: '100%', padding: '12px', background: '#d4af37', color: '#111', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: 'auto' }}
                >
                  Elegir a {b.nombre?.split(' ')[0]} ➔
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2 */}
      {pasoActual === 2 && barberoSeleccionado && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Servicios de {barberoSeleccionado.nombre}</h2>
              <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Marca los servicios que deseas realizarte:</p>
            </div>
            <button onClick={() => setPasoActual(1)} style={{ background: '#f3f4f6', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              ← Cambiar Barbero
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {servicios.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Este barbero no tiene servicios asignados actualmente.</p>
            ) : (
              servicios.map((s) => {
                const idStr = String(s.id_servicio || s.id);
                const estaChequeado = serviciosSeleccionados.includes(idStr);

                return (
                  <label
                    key={idStr}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      border: `2px solid ${estaChequeado ? '#d4af37' : '#e5e7eb'}`,
                      background: estaChequeado ? '#fefce8' : '#fff',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={estaChequeado}
                      onChange={() => handleToggleServicio(idStr)}
                    />
                    <div>
                      <strong>{s.nombre}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{s.duracion_minutos || 30} min · ${s.precio}</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#374151' }}>Duración total: <strong>{duracionTotalMinutos} min</strong></div>
              <div style={{ fontSize: '1.2rem', color: '#16a34a', fontWeight: 'bold' }}>Total: ${precioTotal}</div>
            </div>

            <button
              disabled={serviciosSeleccionados.length === 0}
              onClick={() => setPasoActual(3)}
              style={{
                padding: '12px 24px',
                background: serviciosSeleccionados.length > 0 ? '#d4af37' : '#ccc',
                color: '#111',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '8px',
                cursor: serviciosSeleccionados.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '1rem'
              }}
            >
              Elegir Horario ➔
            </button>
          </div>
        </div>
      )}

      {/* PASO 3 */}
      {pasoActual === 3 && barberoSeleccionado && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Reserva con {barberoSeleccionado.nombre}</h2>
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{duracionTotalMinutos} min · ${precioTotal}</span>
            </div>
            <button onClick={() => setPasoActual(2)} style={{ background: '#f3f4f6', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              ← Cambiar Servicios
            </button>
          </div>

          <div className="booking-date-time-layout">
            {/* PANEL IZQUIERDO */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Fecha de Cita:</label>
              <button
                type="button"
                onClick={() => setMostrarModalDatePicker(true)}
                style={{ width: '100%', padding: '12px', background: '#f9fafb', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', marginBottom: '20px' }}
              >
                📅 {formatearFechaCabecera(fechaSeleccionada)}
              </button>

              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#374151' }}>
                  📌 Horarios ya reservados en este día ({barberoSeleccionado.nombre}):
                </h4>
                {cargandoOcupaciones ? (
                  <p className="time-slot-message" role="status">Consultando reservas...</p>
                ) : errorOcupaciones ? (
                  <p className="time-slot-error" role="alert">{errorOcupaciones}</p>
                ) : citasOcupadasDelDia.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#16a34a', margin: 0, fontWeight: 'bold' }}>
                    ¡Sin reservas previas para este día!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {citasOcupadasDelDia.map((ev, idx) => {
                      const horaIni = ev.hora_inicio.substring(0, 5);
                      const horaFin = ev.hora_fin.substring(0, 5);

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            padding: '10px 14px',
                            background: '#fee2e2',
                            borderLeft: '4px solid #ef4444',
                            borderRadius: '8px',
                            color: '#991b1b',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          <span>🚫 Ocupado</span>
                          <span>
                            {formatearHoraLimpiaStr(horaIni)} — {formatearHoraLimpiaStr(horaFin)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* PANEL DERECHO */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                Selecciona un horario disponible:
              </label>

              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 12px 0' }}>
                🕒 Atención: <strong>{formatearHoraLimpiaStr(horarioBarberia.apertura)}</strong> a <strong>{formatearHoraLimpiaStr(horarioBarberia.cierre)}</strong>
                {' · '}Turnos cada 30 minutos · Servicio de {duracionTotalMinutos} min
              </p>

              {errorHorario ? (
                <p className="time-slot-error" role="alert">{errorHorario}</p>
              ) : errorOcupaciones ? (
                <p className="time-slot-error" role="alert">{errorOcupaciones}</p>
              ) : (
                <TimeSlotGrid
                  slots={horariosDisponibles}
                  selectedTime={horaSeleccionada}
                  onSelect={setHoraSeleccionada}
                  isLoading={!horarioCargado || cargandoOcupaciones}
                />
              )}

              {estadoDisponibilidad.disponible && horarioCargado && !errorHorario && !cargandoOcupaciones && !errorOcupaciones && (
                <button
                  type="button"
                  onClick={handleAbrirModalConfirmacion}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#d4af37',
                    color: '#111',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  Confirmar y Reservar Cita ➔
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CALENDARIO */}
      {mostrarModalDatePicker && (
        <div className="agenda-modal-backdrop" onClick={() => setMostrarModalDatePicker(false)}>
          <div className="agenda-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <h3>Selecciona el día de tu cita</h3>
              <button className="modal-close" onClick={() => setMostrarModalDatePicker(false)}>&times;</button>
            </div>
            <div className="date-picker-wrapper">
              <DatePicker selected={fechaObjeto} onChange={handleFechaChange} inline locale="es" minDate={new Date()} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FORMULARIO RESERVA */}
      {mostrarModalCita && (
        <div className="agenda-modal-backdrop" onClick={() => setMostrarModalCita(false)}>
          <div className="agenda-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <h3>Confirmar Cita con {barberoSeleccionado?.nombre}</h3>
              <button className="modal-close" onClick={() => setMostrarModalCita(false)}>&times;</button>
            </div>

            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#374151' }}>
                📅 <strong>{formatearFechaCabecera(fechaSeleccionada)}</strong>
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#374151' }}>
                ⏰ <strong>{formatearHoraLimpiaStr(estadoDisponibilidad.horaInicioStr)} a {formatearHoraLimpiaStr(estadoDisponibilidad.horaFinStr)}</strong> ({duracionTotalMinutos} min)
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#16a34a', fontWeight: 'bold' }}>
                💰 Total a pagar: ${precioTotal}
              </p>
            </div>

            <form onSubmit={handleAgendarCita} className="appointment-form">
              <div className="form-group">
                <label>Documento (DNI / Cédula):</label>
                <input type="text" placeholder="Ej. 1001234567" value={dniCliente} onChange={(e) => setDniCliente(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Nombre Completo:</label>
                <input type="text" placeholder="Tu nombre y apellido" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Teléfono de contacto:</label>
                <input type="tel" placeholder="300 000 0000" value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Observaciones (opcional):</label>
                <textarea rows="2" placeholder="Notas adicionales..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setMostrarModalCita(false)} style={{ padding: '10px 16px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 16px', background: '#d4af37', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Confirmar Cita</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
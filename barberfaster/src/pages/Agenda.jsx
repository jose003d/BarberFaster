import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import es from 'date-fns/locale/es';
import './Agenda.css';
import ProfileCard from '../components/ProfileCard';
import Stepper, { Step } from '../components/Stepper';
import TimeSlotGrid from './TimeSlotGrid';
import { getAvailableTimeSlots } from './timeSlotUtils';

const BASE_URL = '/erpbarber/barberfaster/backend';

registerLocale('es', es);

// Convierte respuestas del backend y prepara mensajes y formatos usados en la reserva.
const leerRespuestaJson = async (response) => {
  const contenido = await response.text();
  try {
    return JSON.parse(contenido);
  } catch {
    throw new Error(`El servidor no devolvió JSON válido (HTTP ${response.status}). Revisa la configuración de Apache/PHP.`);
  }
};

const mensajeErrorCodigoWhatsapp = (data, status) => {
  if (data.codigo_error === 'credenciales_no_configuradas') {
    return 'Wuapi no está configurado en Apache. Define WUAPI_ACCOUNT_ID y WUAPI_API_KEY y reinicia Apache.';
  }
  if (data.codigo_error === 'curl_no_disponible') {
    return 'PHP no tiene habilitada la extensión cURL. Actívala en php.ini y reinicia Apache.';
  }
  if (data.codigo_error === 'error_proveedor') {
    if (data.http_code === 401 || data.http_code === 403) {
      return 'Wuapi rechazó la autenticación. Revisa que WUAPI_API_KEY y WUAPI_ACCOUNT_ID correspondan a la misma cuenta y estén configurados en Apache.';
    }
    if (data.http_code === 0) {
      return 'No se pudo conectar con Wuapi. Revisa la conexión del servidor a Internet.';
    }
    if (data.http_code === 404 && data.codigo_proveedor === 'not_found') {
      return 'Wuapi no encuentra ese Account ID para esta API key. Verifica que el ID sea de la cuenta correcta y que la API key tenga acceso a esa cuenta/proyecto.';
    }
    if (data.http_code === 404) {
      return 'Wuapi respondió 404. Verifica el Account ID y que la API key tenga acceso a esa cuenta/proyecto.';
    }
    return `Wuapi rechazó el envío (HTTP ${data.http_code || status}). Revisa la cuenta, el destinatario y el estado del servicio.`;
  }
  return data.mensaje || 'No se pudo enviar el código por WhatsApp.';
};

const formatearFechaLocal = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const obtenerUrlFotoBarbero = (foto) => {
  if (!foto) return '';
  if (/^https?:\/\//i.test(foto)) return foto;
  const ruta = foto.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `${BASE_URL}/uploads/${ruta.split('/').map(encodeURIComponent).join('/')}`;
};

export default function Agenda({ reservaPublica = false }) {
  // Estado del flujo, personal, servicios, disponibilidad, fecha y datos del cliente.
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [mostrarModalCita, setMostrarModalCita] = useState(false);

  // Formulario cliente
  const [dniCliente, setDniCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [codigoTelefono, setCodigoTelefono] = useState('');
  const [telefonoVerificado, setTelefonoVerificado] = useState(null);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [verificandoTelefono, setVerificandoTelefono] = useState(false);
  const [mensajeVerificacion, setMensajeVerificacion] = useState(null);

  const invalidarVerificacionCliente = () => {
    setTelefonoVerificado(null);
    setCodigoEnviado(false);
    setCodigoTelefono('');
    setMensajeVerificacion(null);
    localStorage.removeItem('barberfaster_cliente_session');
  };

  const [mensaje, setMensaje] = useState(null);
  const idBarberiaEnlace = searchParams.get('barberia');
  const esReservaPublica = reservaPublica;
  const barberiaPublicaValida = Boolean(
    idBarberiaEnlace && /^\d+$/.test(idBarberiaEnlace) && Number(idBarberiaEnlace) > 0
  );
  const [nombreBarberia, setNombreBarberia] = useState('');

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
    if (esReservaPublica) {
      return idBarberiaEnlace && /^\d+$/.test(idBarberiaEnlace)
        ? Number(idBarberiaEnlace)
        : null;
    }
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

  // Carga el horario general y el nombre del local asociado a la reserva.
  useEffect(() => {
    const idBarberia = obtenerBarberiaActivaId();
    if (!idBarberia) {
      setErrorHorario('Selecciona primero una barbería para continuar.');
      setHorarioCargado(true);
      return;
    }
    fetch(`${BASE_URL}/barberias/perfil.php?id_barberia=${idBarberia}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.status !== 'success' || !data.data) {
          throw new Error(data.mensaje || 'No se pudo cargar el horario de atención.');
        }
        setNombreBarberia(data.data.nombre || 'Barbería seleccionada');
        const apertura = data.data.hora_apertura?.substring(0, 5);
        const cierre = data.data.hora_cierre?.substring(0, 5);
        if (!apertura || !cierre) throw new Error('El horario de atención no está configurado.');
        setHorarioBarberia({ apertura, cierre });
      })
      .catch((error) => setErrorHorario(error.message || 'No se pudo cargar el horario de atención.'))
      .finally(() => setHorarioCargado(true));
  }, []);

  // Carga los barberos registrados para la barbería seleccionada.
  useEffect(() => {
    const idBarberia = obtenerBarberiaActivaId();
    if (!idBarberia) return;
    fetch(`${BASE_URL}/barberos/listar_barberos.php?id_barberia=${encodeURIComponent(idBarberia)}`)
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.barberos || data.datos || [];
        setBarberos(lista);
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los barberos.' }));
  }, []);

  // Selecciona un profesional, consulta sus servicios y avanza al segundo paso.
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

  // Consulta las citas ocupadas y mantiene la disponibilidad del día actualizada.
  const cargarCitasOcupadas = useCallback(async (signal) => {
    if (!barberoSeleccionado) return;
    const idBarbero = barberoSeleccionado.id_barbero || barberoSeleccionado.id;

    setCargandoOcupaciones(true);
    setErrorOcupaciones('');
    try {
      const query = new URLSearchParams({ id_barbero: idBarbero, fecha: fechaSeleccionada });
      const response = await fetch(`${BASE_URL}/agenda/listar_ocupaciones.php?${query}`, {
        signal,
        cache: 'no-store',
      });
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

  useEffect(() => {
    if (pasoActual !== 3 || !barberoSeleccionado) return undefined;

    const actualizarDisponibilidad = () => {
      if (document.visibilityState === 'visible') cargarCitasOcupadas();
    };
    const intervalo = window.setInterval(actualizarDisponibilidad, 15000);
    window.addEventListener('focus', actualizarDisponibilidad);
    document.addEventListener('visibilitychange', actualizarDisponibilidad);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener('focus', actualizarDisponibilidad);
      document.removeEventListener('visibilitychange', actualizarDisponibilidad);
    };
  }, [barberoSeleccionado, cargarCitasOcupadas, pasoActual]);

  // Actualiza la selección de servicios y deriva duración, precio y turnos libres.
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

  const serviciosElegidos = useMemo(
    () => servicios.filter((servicio) => serviciosSeleccionados.includes(String(servicio.id_servicio || servicio.id))),
    [servicios, serviciosSeleccionados]
  );

  const precioTotal = servicios
    .filter((s) => serviciosSeleccionados.includes(String(s.id_servicio || s.id)))
    .reduce((acc, curr) => acc + parseFloat(curr.precio || 0), 0);

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

  useEffect(() => {
    if (!horaSeleccionada || horariosDisponibles.some((slot) => slot.hora_inicio.slice(0, 5) === horaSeleccionada)) return;

    setHoraSeleccionada('');
    setMensaje({ tipo: 'error', texto: 'Ese horario acaba de ocuparse. Elige otro horario disponible.' });
  }, [horaSeleccionada, horariosDisponibles]);

  const handleFechaChange = (date) => {
    if (!date) return;
    setFechaObjeto(date);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setFechaSeleccionada(`${yyyy}-${mm}-${dd}`);
    setHoraSeleccionada('');
  };

  // Valida el horario antes de abrir el formulario de confirmación.
  const handleAbrirModalConfirmacion = () => {
    if (!estadoDisponibilidad.disponible) {
      setMensaje({ tipo: 'error', texto: 'Selecciona una hora válida dentro del horario disponible.' });
      return;
    }
    setMensaje(null);
    setMostrarModalCita(true);
  };

  // Envía un código de verificación al teléfono antes de aceptar la reserva.
  const solicitarCodigoTelefono = async () => {
    if (!dniCliente.trim() || !nombreCliente.trim()) {
      setMensajeVerificacion({ tipo: 'error', texto: 'Ingresa tu nombre y documento antes de verificar el teléfono.' });
      return;
    }

    if (!/^\d{10}$/.test(telefonoCliente)) {
      setMensajeVerificacion({ tipo: 'error', texto: 'Ingresa un celular colombiano de 10 dígitos.' });
      return;
    }

    setTelefonoVerificado(null);
    setCodigoEnviado(false);
    setCodigoTelefono('');
    setMensajeVerificacion(null);
    setVerificandoTelefono(true);
    try {
      const response = await fetch(`${BASE_URL}/verificacion/solicitar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: `+57${telefonoCliente}` }),
      });
      const data = await leerRespuestaJson(response);
      if (!response.ok || data.status !== 'success') {
        throw new Error(mensajeErrorCodigoWhatsapp(data, response.status));
      }
      setCodigoEnviado(true);
      setMensajeVerificacion({ tipo: 'success', texto: 'Te enviamos un código por WhatsApp. Vence en 5 minutos.' });
    } catch (error) {
      setMensajeVerificacion({ tipo: 'error', texto: error.message || 'No se pudo enviar el código por WhatsApp.' });
    } finally {
      setVerificandoTelefono(false);
    }
  };

  // Comprueba el código recibido y conserva el ticket de verificación del backend.
  const verificarCodigoTelefono = async () => {
    if (!/^\d{6}$/.test(codigoTelefono)) {
      setMensajeVerificacion({ tipo: 'error', texto: 'Ingresa el código de 6 dígitos recibido por WhatsApp.' });
      return;
    }

    setVerificandoTelefono(true);
    setMensajeVerificacion(null);
    try {
      const response = await fetch(`${BASE_URL}/verificacion/verificar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: `+57${telefonoCliente}`,
          codigo: codigoTelefono,
          dni_cliente: dniCliente.trim(),
          nombre_cliente: nombreCliente.trim(),
        }),
      });
      const data = await leerRespuestaJson(response);
      if (!response.ok || data.status !== 'success' || !data.ticket_verificacion) {
        throw new Error(data.mensaje || 'No se pudo verificar el código.');
      }
      if (data.sesion_cliente) {
        localStorage.setItem('barberfaster_cliente_session', data.sesion_cliente);
      }
      setTelefonoVerificado({ numero: telefonoCliente, ticket: data.ticket_verificacion });
      setMensajeVerificacion({ tipo: 'success', texto: 'Teléfono verificado. Ya puedes confirmar la cita.' });
    } catch (error) {
      setTelefonoVerificado(null);
      setMensajeVerificacion({ tipo: 'error', texto: error.message || 'No se pudo verificar el código.' });
    } finally {
      setVerificandoTelefono(false);
    }
  };

  // Valida cliente, horario y teléfono; luego crea la cita y limpia el formulario.
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

    if (!telefonoVerificado || telefonoVerificado.numero !== telefonoCliente) {
      setMensajeVerificacion({ tipo: 'error', texto: 'Verifica tu teléfono antes de confirmar la cita.' });
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
      telefono_cliente: telefonoCliente ? `+57${telefonoCliente}` : '',
      ticket_verificacion: telefonoVerificado.ticket,
      notas: `${nombreCliente}${telefonoCliente ? ` - Teléfono: +57${telefonoCliente}` : ''}`,
    };

    fetch(`${BASE_URL}/agenda/agendar_cita.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success || resData.status === 'success') {
          if (resData.sesion_cliente) {
            localStorage.setItem('barberfaster_cliente_session', resData.sesion_cliente);
          }
          setMensaje({ tipo: 'success', texto: '¡Cita agendada exitosamente!' });
          setMostrarModalCita(false);
          setDniCliente('');
          setNombreCliente('');
          setTelefonoCliente('');
          setCodigoTelefono('');
          setTelefonoVerificado(null);
          setCodigoEnviado(false);
          setMensajeVerificacion(null);
          
          cargarCitasOcupadas();
        } else {
          setMensaje({ tipo: 'error', texto: resData.error || resData.mensaje || 'Error al agendar cita.' });
        }
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' }));
  };

  // Renderiza los tres pasos de reserva y el modal con los datos de confirmación.
  return (
    <div className="agenda-page">
      {esReservaPublica && (
        <button className="booking-back-link" type="button" onClick={() => navigate('/')}>
          ← Cambiar barbería
        </button>
      )}
      <div className="agenda-header">
        <div className="agenda-brand-mark" aria-hidden="true">📅</div>
        <h1>Agenda <span className="agenda-brand-name">{nombreBarberia || 'BarberFaster'}</span></h1>
        <p>Reserva tu cita rápida en 3 sencillos pasos</p>
      </div>

      {mensaje && <div className={`agenda-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      <Stepper
        currentStep={pasoActual}
        onStepChange={setPasoActual}
        onFinalStepCompleted={handleAbrirModalConfirmacion}
        backButtonText="Anterior"
        nextButtonText={pasoActual === 1 ? 'Elige un barbero' : 'Elegir horario'}
        finalButtonText="Confirmar y reservar"
        disableStepIndicators
        hideNextButton={pasoActual === 1}
        canContinue={
          pasoActual === 2
            ? serviciosSeleccionados.length > 0
            : pasoActual === 3
              ? estadoDisponibilidad.disponible
                && horarioCargado
                && !errorHorario
                && !cargandoOcupaciones
                && !errorOcupaciones
              : false
        }
      >
      {/* Paso 1: selección del profesional que atenderá la cita. */}
      <Step label="Barbero">
        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>¿Con quién te deseas atender hoy?</h2>
          {esReservaPublica && !barberiaPublicaValida ? (
            <div role="alert" style={{ padding: '24px', borderRadius: '12px', background: '#fff7ed', color: '#9a3412', textAlign: 'center' }}>
              <p>Primero elige una barbería para consultar sus barberos y horarios.</p>
              <Link to="/">Ver barberías disponibles</Link>
            </div>
          ) : barberos.length === 0 ? (
            <p role="status" style={{ textAlign: 'center', color: '#6b7280' }}>
              No hay barberos disponibles en esta barbería por el momento.
            </p>
          ) : (
          <div className="barber-profile-grid">
            {barberos.map((b) => (
              <ProfileCard
                key={b.id_barbero || b.id}
                className={String(barberoSeleccionado?.id_barbero || barberoSeleccionado?.id) === String(b.id_barbero || b.id) ? 'selected' : ''}
                name={b.nombre || b.nombre_barbero}
                title={b.especialidad || 'Especialista en barbería'}
                contactText="Elegir"
                avatarUrl={obtenerUrlFotoBarbero(b.foto)}
                onContactClick={() => seleccionarBarberoYAvanzar(b)}
              />
            ))}
          </div>
          )}
        </div>
      </Step>

      {/* Paso 2: selección de servicios y cálculo de duración y precio. */}
      <Step label="Servicios">
        {barberoSeleccionado ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Servicios de {barberoSeleccionado.nombre}</h2>
              <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Marca los servicios que deseas realizarte:</p>
            </div>
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
                    className={`booking-service-option${estaChequeado ? ' is-selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={estaChequeado}
                      onChange={() => handleToggleServicio(idStr)}
                    />
                    <div>
                      <strong>{s.nombre}</strong>
                      <div className="booking-service-details">{s.duracion_minutos || 30} min · ${s.precio}</div>
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
          </div>
        </div>
        ) : (
          <p role="status">Selecciona un barbero para consultar sus servicios.</p>
        )}
      </Step>

      {/* Paso 3: consulta de disponibilidad y elección de fecha y hora. */}
      <Step label="Horario">
        {barberoSeleccionado ? (
          <div className="booking-schedule-card">
            <section className="booking-selection-summary" aria-label="Resumen de tu cita">
              <div className="booking-selection-heading">
                <span className="booking-selection-eyebrow">TU CITA</span>
                <h2>Con {barberoSeleccionado.nombre}</h2>
              </div>
              <div className="booking-selected-services" aria-label="Servicios seleccionados">
                {serviciosElegidos.map((servicio) => (
                  <span className="booking-selected-service" key={servicio.id_servicio || servicio.id}>
                    <span aria-hidden="true">✂</span>
                    {servicio.nombre}
                  </span>
                ))}
              </div>
              <div className="booking-selection-totals">
                <span><small>Duración</small><strong>{duracionTotalMinutos} min</strong></span>
                <span><small>Total</small><strong>${precioTotal.toLocaleString('es-CO')}</strong></span>
              </div>
            </section>

            <div className="booking-date-time-layout">
              <section className="booking-calendar-column" aria-label="Selecciona el día">
                <div className="booking-column-heading">
                  <span className="booking-column-number">01</span>
                  <div>
                    <h3>Elige el día</h3>
                    <p className="booking-selected-date">{formatearFechaCabecera(fechaSeleccionada)}</p>
                  </div>
                </div>
                <div className="date-picker-wrapper booking-calendar-panel">
                  <DatePicker
                    selected={fechaObjeto}
                    onChange={handleFechaChange}
                    inline
                    locale="es"
                    minDate={new Date()}
                    calendarClassName="booking-inline-calendar"
                  />
                </div>
              </section>

              <section className="booking-time-column" aria-label="Horarios disponibles">
                <div className="booking-column-heading">
                  <span className="booking-column-number">02</span>
                  <div>
                    <h3>Elige la hora</h3>
                    <p>
                      Atención {formatearHoraLimpiaStr(horarioBarberia.apertura)}–{formatearHoraLimpiaStr(horarioBarberia.cierre)}
                      {' · '}Turnos de {duracionTotalMinutos} min
                    </p>
                  </div>
                </div>
                <p className="booking-availability-note">
                  Los horarios reservados dejan de mostrarse y la disponibilidad se actualiza automáticamente.
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

                {estadoDisponibilidad.disponible && (
                  <div className="booking-selected-time" role="status">
                    <span>Horario seleccionado</span>
                    <strong>
                      {formatearHoraLimpiaStr(estadoDisponibilidad.horaInicioStr)}
                      {' – '}
                      {formatearHoraLimpiaStr(estadoDisponibilidad.horaFinStr)}
                    </strong>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : (
          <p role="status">Selecciona un barbero y un servicio para consultar horarios.</p>
        )}
      </Step>
      </Stepper>

      {/* Modal final: datos del cliente y verificación del teléfono. */}
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
                <input
                  type="text"
                  placeholder="Ej. 1001234567"
                  value={dniCliente}
                  onChange={(e) => {
                    setDniCliente(e.target.value);
                    invalidarVerificacionCliente();
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nombre Completo:</label>
                <input
                  type="text"
                  placeholder="Tu nombre y apellido"
                  value={nombreCliente}
                  onChange={(e) => {
                    setNombreCliente(e.target.value);
                    invalidarVerificacionCliente();
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono de contacto:</label>
                <div className="phone-input-group">
                  <span className="phone-country-code" aria-hidden="true">+57</span>
                  <input
                    id="telefono-cliente"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="3000000000"
                    aria-label="Número de teléfono, sin código de país"
                    value={telefonoCliente}
                    onChange={(e) => {
                      let digits = e.target.value.replace(/\D/g, '');
                      if (digits.startsWith('57') && digits.length > 10) digits = digits.slice(2);
                      const numero = digits.slice(0, 10);
                      setTelefonoCliente(numero);
                      if (numero !== telefonoVerificado?.numero) invalidarVerificacionCliente();
                    }}
                    required
                    disabled={verificandoTelefono}
                  />
                </div>
                {telefonoVerificado?.numero === telefonoCliente ? (
                  <p className="phone-verification-status success" role="status">
                    Teléfono verificado por WhatsApp.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="phone-verification-button"
                    onClick={solicitarCodigoTelefono}
                    disabled={verificandoTelefono || telefonoCliente.length !== 10}
                  >
                    {verificandoTelefono ? 'Procesando...' : codigoEnviado ? 'Enviar otro código' : 'Enviar código por WhatsApp'}
                  </button>
                )}
              </div>

              {codigoEnviado && telefonoVerificado?.numero !== telefonoCliente && (
                <div className="form-group">
                  <label htmlFor="codigo-verificacion">Código de verificación:</label>
                  <div className="phone-verification-row">
                    <input
                      id="codigo-verificacion"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="000000"
                      value={codigoTelefono}
                      onChange={(e) => setCodigoTelefono(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                    <button
                      type="button"
                      className="phone-verification-button"
                      onClick={verificarCodigoTelefono}
                      disabled={verificandoTelefono || codigoTelefono.length !== 6}
                    >
                      {verificandoTelefono ? 'Verificando...' : 'Verificar'}
                    </button>
                  </div>
                </div>
              )}
              {mensajeVerificacion && (
                <p className={`phone-verification-status ${mensajeVerificacion.tipo}`} role="status">
                  {mensajeVerificacion.texto}
                </p>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setMostrarModalCita(false)} style={{ padding: '10px 16px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button
                  type="submit"
                  disabled={!telefonoVerificado || telefonoVerificado.numero !== telefonoCliente || verificandoTelefono}
                  style={{
                    padding: '10px 16px',
                    background: telefonoVerificado?.numero === telefonoCliente ? 'var(--bauhaus-cyan)' : '#e5e5e7',
                    color: '#393939',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: telefonoVerificado?.numero === telefonoCliente ? 'pointer' : 'not-allowed'
                  }}
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
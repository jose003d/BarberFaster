import { useEffect, useState } from "react";
import { BASE_URL, handleResponse } from "../../../shared/services/api.js";
import "./ReprogramarCita.css";

function fechaLocalHoy() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function formatoHora(hora) {
  const [h, m] = String(hora).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`;
}

// Cambia el horario de una cita del cliente. Al elegir un día pide al servidor los turnos
// que de verdad están libres (horario de la barbería, duración de la cita y citas del
// barbero), así el cliente solo puede escoger una hora posible.
export default function ReprogramarCita({ cita, token, onReprogramada, onError }) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(() => {
    const fechaCita = String(cita.fecha).slice(0, 10);
    return fechaCita < fechaLocalHoy() ? fechaLocalHoy() : fechaCita;
  });
  const [turnos, setTurnos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [hora, setHora] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto || !fecha) return undefined;
    let activo = true;
    setCargando(true);
    setHora("");
    setMensaje("");
    fetch(
      `${BASE_URL}/citas/horarios_reprogramar.php?id_cita=${encodeURIComponent(cita.id_cita)}&fecha=${encodeURIComponent(fecha)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    )
      .then(handleResponse)
      .then((data) => {
        if (!activo) return;
        setTurnos(data.turnos || []);
        if (!data.abre) setMensaje(data.mensaje);
        else if ((data.turnos || []).length === 0) setMensaje("No quedan turnos libres ese día. Prueba con otra fecha.");
      })
      .catch((errorCarga) => {
        if (!activo) return;
        setTurnos([]);
        setMensaje(errorCarga.message || "No se pudieron cargar los turnos.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [abierto, fecha, cita.id_cita, token]);

  const guardar = async () => {
    if (!hora) return;
    setGuardando(true);
    try {
      const respuesta = await fetch(`${BASE_URL}/citas/reprogramar_cliente.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_cita: cita.id_cita, fecha, hora_inicio: hora }),
      });
      const data = await handleResponse(respuesta);
      setAbierto(false);
      onReprogramada?.(data.mensaje || "La cita se reprogramó correctamente.");
    } catch (errorGuardar) {
      onError?.(errorGuardar.message || "No se pudo cambiar el horario.");
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) {
    return (
      <button className="client-reschedule-button" type="button" onClick={() => setAbierto(true)}>
        Cambiar horario
      </button>
    );
  }

  return (
    <div className="reprogramar" role="group" aria-label="Cambiar el horario de la cita">
      <label className="reprogramar-fecha">
        Nuevo día
        <input
          type="date"
          min={fechaLocalHoy()}
          value={fecha}
          onChange={(event) => {
            const elegida = event.target.value;
            if (elegida) setFecha(elegida < fechaLocalHoy() ? fechaLocalHoy() : elegida);
          }}
        />
      </label>

      <div className="reprogramar-turnos" aria-live="polite">
        <span className="reprogramar-titulo">Turnos libres</span>
        {cargando ? (
          <p className="reprogramar-mensaje">Buscando turnos…</p>
        ) : mensaje ? (
          <p className="reprogramar-mensaje">{mensaje}</p>
        ) : (
          <div className="reprogramar-grilla">
            {turnos.map((turno) => (
              <button
                key={turno.hora}
                type="button"
                className={`time-slot-button btn-quiet reprogramar-turno${hora === turno.hora ? " selected" : ""}`}
                aria-pressed={hora === turno.hora}
                disabled={turno.actual}
                title={turno.actual ? "Es el horario actual de tu cita" : `Hasta las ${formatoHora(turno.hora_fin)}`}
                onClick={() => setHora(turno.hora)}
              >
                {formatoHora(turno.hora)}
                {turno.actual && <small>actual</small>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="reprogramar-acciones">
        <button className="client-reschedule-button" type="button" onClick={guardar} disabled={!hora || guardando}>
          {guardando ? "Guardando…" : hora ? `Mover a las ${formatoHora(hora)}` : "Elige un turno"}
        </button>
        <button className="client-discard-button" type="button" onClick={() => setAbierto(false)} disabled={guardando}>
          No cambiar
        </button>
      </div>
    </div>
  );
}

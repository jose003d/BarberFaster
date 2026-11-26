import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

// Convierte "13:30" en { hora: "1:30", periodo: "p.m." } (formato de 12 horas).
function aDoceHoras(hora24) {
  const [hh, mm] = hora24.split(":").map(Number);
  return {
    hora: `${hh % 12 || 12}:${String(mm).padStart(2, "0")}`,
    periodo: hh < 12 ? "a.m." : "p.m.",
  };
}

const textoDoceHoras = (hora24) => {
  const { hora, periodo } = aDoceHoras(hora24);
  return `${hora} ${periodo}`;
};

// Presenta estados de espera/vacío y permite seleccionar un horario disponible.
export default function TimeSlotGrid({ slots, selectedTime, onSelect, isLoading }) {
  // Informa que la disponibilidad todavía se está consultando.
  if (isLoading) {
    return <p className="time-slot-message" role="status">Cargando horarios disponibles...</p>;
  }

  // Explica cuando no existen turnos que se puedan reservar.
  if (slots.length === 0) {
    // Muestra cada horario y marca el que coincide con la selección actual.
    return (
      <p className="time-slot-message" role="status">
        No hay horarios disponibles para esta fecha y duración.
      </p>
    );
  }

  return (
    <div className="time-slot-grid" role="group" aria-label="Horarios disponibles">
      {slots.map((slot) => {
        const selected = selectedTime === slot.hora_inicio.slice(0, 5);
        const inicio = aDoceHoras(slot.hora_inicio.slice(0, 5));
        return (
          <button
            key={slot.hora_inicio}
            type="button"
            className={`time-slot-button btn-quiet${selected ? " selected" : ""}`}
            aria-pressed={selected}
            aria-label={`${textoDoceHoras(slot.hora_inicio.slice(0, 5))} hasta ${textoDoceHoras(slot.hora_fin.slice(0, 5))}${selected ? ", horario seleccionado" : ""}`}
            onClick={() => onSelect(slot.hora_inicio.slice(0, 5))}
          >
            <span>
              {inicio.hora} <span className="time-slot-period">{inicio.periodo}</span>
            </span>
            <small>Hasta {textoDoceHoras(slot.hora_fin.slice(0, 5))}</small>
            {selected && (
              <span className="time-slot-selected-indicator" aria-hidden="true">
                <FontAwesomeIcon icon={faCheck} />
                <span>Elegido</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

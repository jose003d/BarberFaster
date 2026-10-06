import React from "react";

export default function TimeSlotGrid({ slots, selectedTime, onSelect, isLoading }) {
  if (isLoading) {
    return <p className="time-slot-message" role="status">Cargando horarios disponibles...</p>;
  }

  if (slots.length === 0) {
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
        return (
          <button
            key={slot.hora_inicio}
            type="button"
            className={`time-slot-button${selected ? " selected" : ""}`}
            aria-pressed={selected}
            onClick={() => onSelect(slot.hora_inicio.slice(0, 5))}
          >
            <span>{slot.hora_inicio.slice(0, 5)}</span>
            <small>Hasta {slot.hora_fin.slice(0, 5)}</small>
          </button>
        );
      })}
    </div>
  );
}

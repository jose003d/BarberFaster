const DEFAULT_SLOT_INTERVAL_MINUTES = 30;

const timeToMinutes = (time) => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(String(time || ""));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const minutesToTime = (minutes, includeSeconds = false) => {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 24 * 60) return null;
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const remainingMinutes = String(minutes % 60).padStart(2, "0");
  return `${hours}:${remainingMinutes}${includeSeconds ? ":00" : ""}`;
};

const getAppointmentTime = (appointment, field) => {
  const value = appointment?.[field] ?? appointment?.[field === "hora_inicio" ? "start" : "end"];
  if (!value) return null;
  return String(value).split(/[T ]/).pop();
};

const getAvailableTimeSlots = ({
  openingTime,
  closingTime,
  durationMinutes,
  appointments = [],
  date,
  intervalMinutes = DEFAULT_SLOT_INTERVAL_MINUTES,
  now = new Date(),
}) => {
  const opening = timeToMinutes(openingTime);
  const closing = timeToMinutes(closingTime);
  if (
    opening === null ||
    closing === null ||
    closing <= opening ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0 ||
    !Number.isInteger(intervalMinutes) ||
    intervalMinutes <= 0
  ) {
    return [];
  }

  const occupiedRanges = appointments
    .map((appointment) => ({
      start: timeToMinutes(getAppointmentTime(appointment, "hora_inicio")),
      end: timeToMinutes(getAppointmentTime(appointment, "hora_fin")),
    }))
    .filter(({ start, end }) => start !== null && end !== null && end > start);

  const dateIsToday = date === [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const slots = [];

  for (let start = opening; start + durationMinutes <= closing; start += intervalMinutes) {
    const end = start + durationMinutes;
    if (dateIsToday && start <= currentMinute) continue;

    const overlapsAppointment = occupiedRanges.some(
      (occupied) => start < occupied.end && end > occupied.start
    );
    if (!overlapsAppointment) {
      slots.push({
        hora_inicio: minutesToTime(start, true),
        hora_fin: minutesToTime(end, true),
      });
    }
  }

  return slots;
};

export { timeToMinutes, minutesToTime, getAvailableTimeSlots };

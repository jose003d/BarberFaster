// Utilidades de fecha y calendario para la agenda.
const LOCALE = "es-CO";

const formatDateLabel = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTimeLabel = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(LOCALE, { hour: "2-digit", minute: "2-digit" });
};

const formatRangeLabel = (start, end) => {
  return `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
};

const formatDayLabel = (value) => {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const getDateKey = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayNumber = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

const parseTimeToDate = (dateStr, timeValue) => {
  if (!dateStr || !timeValue) return null;
  const [hours = 0, minutes = 0, seconds = 0] = String(timeValue)
    .split(":")
    .map((part) => Number(part) || 0);
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(hours, minutes, seconds, 0);
  return date;
};

const isWorkingDay = (dateStr, diasSemana = []) => {
  if (!Array.isArray(diasSemana) || diasSemana.length === 0) return false;
  return diasSemana.includes(getDayNumber(`${dateStr}T12:00:00`));
};

export {
  formatDateLabel,
  formatTimeLabel,
  formatRangeLabel,
  formatDayLabel,
  getDateKey,
  parseTimeToDate,
  isWorkingDay,
};

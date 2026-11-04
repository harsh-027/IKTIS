function pad(value) {
  return String(value).padStart(2, '0');
}

export function toUtcDateString(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function toUtcDateTimeString(date) {
  return `${toUtcDateString(date)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${String(date.getUTCMilliseconds()).padStart(3, '0')}`;
}

export function toPeriodDateString(yearMonth) {
  return `${yearMonth}-01`;
}

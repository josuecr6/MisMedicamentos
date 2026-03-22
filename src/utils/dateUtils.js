export function padDateUnit(value) {
  return String(value).padStart(2, '0');
}

export function getLocalDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    padDateUnit(date.getMonth() + 1),
    padDateUnit(date.getDate()),
  ].join('-');
}

export function getCurrentDayIndex(date = new Date()) {
  return date.getDay();
}

export function isScheduledForDate(selectedDays, date = new Date()) {
  if (!selectedDays?.length) {
    return true;
  }

  return selectedDays.includes(getCurrentDayIndex(date));
}

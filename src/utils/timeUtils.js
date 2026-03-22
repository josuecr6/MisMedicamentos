export const convertTo24Hour = (time) => {
  const [timePart = '08:00', period = 'AM'] = (time || '').split(' ');
  const [hourStr = '8', minuteStr = '0'] = timePart.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;

  return { hour, minute };
};

export const sortTimes = (timesArray) => {
  return [...timesArray].sort((a, b) => {
    const toMinutes = (time) => {
      const { hour, minute } = convertTo24Hour(time);
      return hour * 60 + minute;
    };
    return toMinutes(a) - toMinutes(b);
  });
};

export const hasTimePassed = (time, referenceDate = new Date()) => {
  const { hour, minute } = convertTo24Hour(time);
  const eventTime = new Date(referenceDate);
  eventTime.setHours(hour, minute, 0, 0);
  return referenceDate >= eventTime;
};

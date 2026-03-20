export const convertTo24Hour = (time) => {
  const [timePart, period] = time.split(' ');
  let [hour, minute] = timePart.split(':').map(Number);
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

export const hasTimePassed = (time) => {
  const now = new Date();
  const { hour, minute } = convertTo24Hour(time);
  const eventTime = new Date();
  eventTime.setHours(hour, minute, 0, 0);
  return now > eventTime;
};
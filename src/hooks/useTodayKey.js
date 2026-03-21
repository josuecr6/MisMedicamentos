import { useEffect, useState } from 'react';
import { getLocalDateKey } from '../utils/dateUtils';

export default function useTodayKey(refreshMs = 60000) {
  const [todayKey, setTodayKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayKey(getLocalDateKey());
    }, refreshMs);

    return () => clearInterval(interval);
  }, [refreshMs]);

  return todayKey;
}

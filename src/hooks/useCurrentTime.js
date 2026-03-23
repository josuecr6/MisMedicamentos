import { useEffect, useState } from 'react';

// Se refresca cada 30 segundos para que hasTimePassed se recalcule
export default function useCurrentTime(refreshMs = 30000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);

  return now;
}

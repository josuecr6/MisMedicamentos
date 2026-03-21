import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { registerPushToken } from '../utils/pushNotifications';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // useRef persiste entre renders sin causar re-renders.
  // Evita que registerPushToken se llame múltiples veces si el estado
  // de auth cambia rápidamente (hot reload, re-mounts, etc.)
  const tokenRegistered = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser && !tokenRegistered.current) {
        tokenRegistered.current = true;
        await registerPushToken();
      }

      // Si el usuario cerró sesión, reseteamos el flag
      // para que el próximo login lo registre de nuevo
      if (!currentUser) {
        tokenRegistered.current = false;
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

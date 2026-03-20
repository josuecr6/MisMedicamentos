import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { registerPushToken } from '../utils/pushNotifications';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';

const AuthContext = createContext();

const DAYS_TO_KEEP = 30;

// Calcula la fecha límite — entradas anteriores a esta se eliminan
const getCutoffDate = () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_TO_KEEP);
  // Formato YYYY-MM-DD para comparar con las claves de takenTimes
  return cutoff.toISOString().split('T')[0];
};

// Limpia las entradas viejas de takenTimes en todos los medicamentos del usuario
const cleanOldTakenTimes = async (uid) => {
  try {
    const cutoffDate = getCutoffDate();

    const q = query(
      collection(db, 'medications'),
      where('userId', '==', uid)
    );
    const snapshot = await getDocs(q);

    const updates = [];

    snapshot.forEach((medicationDoc) => {
      const data = medicationDoc.data();
      const takenTimes = data.takenTimes || [];

      if (takenTimes.length === 0) return;

      // Filtrar solo las entradas dentro de los últimos 30 días
      // El formato de cada entrada es "YYYY-MM-DD_HH:MM AM/PM"
      const cleaned = takenTimes.filter((entry) => {
        const datePart = entry.split('_')[0];
        return datePart >= cutoffDate;
      });

      // Solo actualizar si realmente hubo entradas eliminadas
      if (cleaned.length < takenTimes.length) {
        updates.push(
          updateDoc(doc(db, 'medications', medicationDoc.id), {
            takenTimes: cleaned
          })
        );
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(
        `[CleanUp] Se limpiaron entradas antiguas en ${updates.length} medicamento(s)`
      );
    }
  } catch (error) {
    // La limpieza es una operación de mantenimiento secundaria
    // Un error aquí no debe afectar el funcionamiento de la app
    console.log('[CleanUp] Error al limpiar takenTimes:', error);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Registrar push token y limpiar datos antiguos en paralelo
        // sin bloquear la carga de la app
        Promise.all([
          registerPushToken(),
          cleanOldTakenTimes(user.uid)
        ]).catch((error) => {
          console.log('[AuthContext] Error en tareas de inicio:', error);
        });
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

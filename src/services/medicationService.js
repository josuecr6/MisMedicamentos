import { doc, deleteDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { cancelNotification } from '../utils/notifications';

export const deleteMedication = async (medication, saveToHistory = false) => {
  // H3 — verificar que el medicamento pertenece al usuario actual
  // antes de intentar cualquier operación
  const currentUid = auth.currentUser?.uid;

  if (!currentUid) {
    throw new Error('No hay sesión activa');
  }

  // Doble verificación: contra el objeto local y contra Firestore
  if (medication.userId !== currentUid) {
    throw new Error('No tienes permiso para eliminar este medicamento');
  }

  // Verificación server-side: leer el documento directamente de Firestore
  // para asegurarse de que el objeto local no fue manipulado
  const medicationRef = doc(db, 'medications', medication.id);
  const medicationSnap = await getDoc(medicationRef);

  if (!medicationSnap.exists()) {
    throw new Error('El medicamento no existe');
  }

  if (medicationSnap.data().userId !== currentUid) {
    throw new Error('No tienes permiso para eliminar este medicamento');
  }

  // Cancelar notificaciones programadas
  if (medication.notificationIds) {
    for (const id of medication.notificationIds) {
      await cancelNotification(id);
    }
  }

  // Guardar en historial si se solicitó
  if (saveToHistory) {
    await addDoc(collection(db, 'medicationHistory'), {
      name: medication.name,
      reason: medication.reason,
      doctor: medication.doctor,
      times: medication.times,
      selectedDays: medication.selectedDays,
      createdAt: medication.createdAt,
      deletedAt: new Date(),
      userId: currentUid
    });
  }

  await deleteDoc(medicationRef);
};

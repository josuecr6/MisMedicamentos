import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from './firebase';
import { cancelNotification } from '../utils/notifications';

export const deleteMedication = async (medication, saveToHistory = false) => {
  // Cancelar todas las notificaciones programadas del medicamento
  if (medication.notificationIds && medication.notificationIds.length > 0) {
    for (const id of medication.notificationIds) {
      await cancelNotification(id);
    }
  }

  if (saveToHistory) {
    await addDoc(collection(db, 'medicationHistory'), {
      name: medication.name,
      reason: medication.reason,
      doctor: medication.doctor,
      times: medication.times,
      selectedDays: medication.selectedDays,
      createdAt: medication.createdAt,
      deletedAt: new Date(),
      userId: auth.currentUser.uid,
    });
  }

  await deleteDoc(doc(db, 'medications', medication.id));
};

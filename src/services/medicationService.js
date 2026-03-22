import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from './firebase';
import { cancelNotifications } from '../utils/notifications';

export const deleteMedication = async (medication, saveToHistory = false) => {
  await cancelNotifications(medication.notificationIds);

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

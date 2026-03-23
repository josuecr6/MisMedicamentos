import React, { useState } from 'react';
import { Alert } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';

import MedicationForm from '../components/MedicationForm';
import { db, auth } from '../services/firebase';
import { requestPermissions, scheduleNotification } from '../utils/notifications';
import { convertTo24Hour } from '../utils/timeUtils';

export default function AddMedicationScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleSave = async ({ name, reason, dosage, doctor, times, selectedDays }) => {
    try {
      setLoading(true);

      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Error', 'Necesitas permitir las notificaciones');
        return;
      }

      const notificationIds = (
        await Promise.all(
          times.map((time) => {
            const { hour, minute } = convertTo24Hour(time);
            return scheduleNotification(name, hour, minute, selectedDays);
          })
        )
      ).flat();

      await addDoc(collection(db, 'medications'), {
        name,
        reason,
        dosage,
        doctor,
        times,
        selectedDays,
        notificationIds,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });

      Alert.alert('Éxito', 'Medicamento guardado correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el medicamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MedicationForm
      title="Agregar medicamento"
      initialValues={{
        name: '',
        reason: '',
        dosage: '',
        doctor: '',
        times: [],
        selectedDays: [0, 1, 2, 3, 4, 5, 6],
      }}
      loading={loading}
      onSubmit={handleSave}
    />
  );
}

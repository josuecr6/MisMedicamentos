import React, { useState } from 'react';
import { Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';

import MedicationForm from '../components/MedicationForm';
import { db } from '../services/firebase';
import { deleteMedication } from '../services/medicationService';
import { requestPermissions, scheduleNotification, cancelNotifications } from '../utils/notifications';
import { convertTo24Hour } from '../utils/timeUtils';

export default function EditMedicationScreen({ route, navigation }) {
  const { medication } = route.params;
  const [loading, setLoading] = useState(false);

  const handleSave = async ({ name, reason, dosage, doctor, times, selectedDays }) => {
    try {
      setLoading(true);

      await cancelNotifications(medication.notificationIds);

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

      await updateDoc(doc(db, 'medications', medication.id), {
        name,
        reason,
        dosage,
        doctor,
        times,
        selectedDays,
        notificationIds,
      });

      Alert.alert('Éxito', 'Medicamento actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el medicamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar medicamento',
      `¿Qué deseas hacer con ${medication.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar sin guardar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(medication, false);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el medicamento');
            }
          },
        },
        {
          text: 'Guardar en historial',
          onPress: async () => {
            try {
              await deleteMedication(medication, true);
              Alert.alert('Éxito', 'Medicamento guardado en el historial');
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el medicamento');
            }
          },
        },
      ]
    );
  };

  return (
    <MedicationForm
      title="Editar medicamento"
      initialValues={{
        name: medication.name,
        reason: medication.reason,
        dosage: medication.dosage ?? '',
        doctor: medication.doctor,
        times: medication.times ?? [],
        selectedDays: medication.selectedDays ?? [0, 1, 2, 3, 4, 5, 6],
      }}
      loading={loading}
      onSubmit={handleSave}
      onDelete={handleDelete}
    />
  );
}

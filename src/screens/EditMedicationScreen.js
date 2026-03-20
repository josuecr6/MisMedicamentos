import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { deleteMedication } from '../services/medicationService';
import { requestPermissions, scheduleNotification } from '../utils/notifications';
import { COLORS, DAYS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';
import { convertTo24Hour, sortTimes } from '../utils/timeUtils';
import TimePicker from '../components/TimePicker';

export default function EditMedicationScreen({ route, navigation }) {
  const { medication } = route.params;

  const [name, setName] = useState(medication.name);
  const [reason, setReason] = useState(medication.reason);
  const [doctor, setDoctor] = useState(medication.doctor);
  const [times, setTimes] = useState(medication.times || ['08:00 AM']);
  const [selectedDays, setSelectedDays] = useState(medication.selectedDays || [0,1,2,3,4,5,6]);
  const [loading, setLoading] = useState(false);

  const addTime = () => setTimes(sortTimes([...times, '08:00 AM']));

  const updateTime = (index, value) => {
    const updated = [...times];
    updated[index] = value;
    setTimes(sortTimes(updated));
  };

  const removeTime = (index) => {
    if (times.length === 1) {
      Alert.alert('Error', 'Debe tener al menos un horario');
      return;
    }
    setTimes(times.filter((_, i) => i !== index));
  };

  const toggleDay = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length === 1) {
        Alert.alert('Error', 'Debe seleccionar al menos un día');
        return;
      }
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const handleSave = async () => {
    if (!name || !reason || !doctor) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      if (medication.notificationIds) {
        for (const id of medication.notificationIds) {
          await scheduleNotification(name, 0, 0, []);
        }
      }
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Error', 'Necesitas permitir las notificaciones');
        return;
      }
      const notificationIds = [];
      for (const time of times) {
        const { hour, minute } = convertTo24Hour(time);
        const id = await scheduleNotification(name, hour, minute, selectedDays);
        notificationIds.push(id);
      }
      await updateDoc(doc(db, 'medications', medication.id), {
        name, reason, doctor, times, selectedDays, notificationIds
      });
      Alert.alert('Éxito', 'Medicamento actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el medicamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar medicamento',
      `¿Qué deseas hacer con ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar sin guardar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(medication, false);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el medicamento');
            }
          }
        },
        {
          text: 'Guardar en historial',
          onPress: async () => {
            try {
              await deleteMedication(medication, true);
              Alert.alert('Éxito', 'Medicamento guardado en el historial');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el medicamento');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={commonStyles.scrollContainer}>
      <Text style={commonStyles.title}>Editar medicamento</Text>

      <Text style={commonStyles.label}>Nombre del medicamento</Text>
      <TextInput
        style={commonStyles.input}
        value={name}
        onChangeText={setName}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={commonStyles.label}>¿Para qué fue recetado?</Text>
      <TextInput
        style={commonStyles.input}
        value={reason}
        onChangeText={setReason}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={commonStyles.label}>Doctor que lo recetó</Text>
      <TextInput
        style={commonStyles.input}
        value={doctor}
        onChangeText={setDoctor}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={commonStyles.label}>Horarios</Text>
      {times.map((time, index) => (
        <View key={index} style={styles.timeRow}>
          <View style={styles.timePickerWrapper}>
            <TimePicker
              value={time}
              onChange={(value) => updateTime(index, value)}
            />
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeTime(index)}
          >
            <Text style={styles.removeButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
        <Text style={styles.addTimeText}>+ Agregar horario</Text>
      </TouchableOpacity>

      <Text style={commonStyles.label}>Días de la semana</Text>
      <View style={styles.daysRow}>
        {DAYS.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              selectedDays.includes(index) && styles.dayButtonActive
            ]}
            onPress={() => toggleDay(index)}
          >
            <Text style={[
              styles.dayText,
              selectedDays.includes(index) && styles.dayTextActive
            ]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={commonStyles.button}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={commonStyles.buttonText}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={commonStyles.deleteButton}
        onPress={handleDelete}
      >
        <Text style={commonStyles.deleteButtonText}>Eliminar medicamento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  timePickerWrapper: {
    flex: 1
  },
  removeButton: {
    backgroundColor: COLORS.danger,
    padding: 12,
    borderRadius: 8
  },
  removeButtonText: {
    color: COLORS.text,
    fontSize: 14
  },
  addTimeButton: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  addTimeText: {
    color: COLORS.accent,
    fontSize: 14
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24
  },
  dayButton: {
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 8,
    padding: 10,
    minWidth: 44,
    alignItems: 'center',
    backgroundColor: COLORS.secondary
  },
  dayButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent
  },
  dayText: {
    color: COLORS.textMuted,
    fontSize: 13
  },
  dayTextActive: {
    color: COLORS.bg,
    fontWeight: 'bold'
  }
});
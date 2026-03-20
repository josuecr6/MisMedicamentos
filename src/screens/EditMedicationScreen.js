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
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { cancelNotification, scheduleNotification, requestPermissions } from '../utils/notifications';
import TimePicker from '../components/TimePicker';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function EditMedicationScreen({ route, navigation }) {
  const { medication } = route.params;

  const [name, setName] = useState(medication.name);
  const [reason, setReason] = useState(medication.reason);
  const [doctor, setDoctor] = useState(medication.doctor);
  const [times, setTimes] = useState(medication.times || ['08:00 AM']);
  const [selectedDays, setSelectedDays] = useState(medication.selectedDays || [0,1,2,3,4,5,6]);
  const [loading, setLoading] = useState(false);

  const sortTimes = (timesArray) => {
    return timesArray.sort((a, b) => {
      const toMinutes = (time) => {
        const [timePart, period] = time.split(' ');
        let [hour, minute] = timePart.split(':').map(Number);
        if (period === 'AM' && hour === 12) hour = 0;
        if (period === 'PM' && hour !== 12) hour += 12;
        return hour * 60 + minute;
      };
      return toMinutes(a) - toMinutes(b);
    });
  };

  const addTime = () => {
    setTimes(sortTimes([...times, '08:00 AM']));
  };

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

  const convertTo24Hour = (time) => {
    const [timePart, period] = time.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (period === 'AM' && hour === 12) hour = 0;
    if (period === 'PM' && hour !== 12) hour += 12;
    return { hour, minute };
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
          await cancelNotification(id);
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
        name,
        reason,
        doctor,
        times,
        selectedDays,
        notificationIds
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
              if (medication.notificationIds) {
                for (const id of medication.notificationIds) {
                  await cancelNotification(id);
                }
              }
              await deleteDoc(doc(db, 'medications', medication.id));
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
              if (medication.notificationIds) {
                for (const id of medication.notificationIds) {
                  await cancelNotification(id);
                }
              }
              await addDoc(collection(db, 'medicationHistory'), {
                name: medication.name,
                reason: medication.reason,
                doctor: medication.doctor,
                times: medication.times,
                selectedDays: medication.selectedDays,
                createdAt: medication.createdAt,
                deletedAt: new Date(),
                userId: auth.currentUser.uid
              });
              await deleteDoc(doc(db, 'medications', medication.id));
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Editar medicamento</Text>

      <Text style={styles.label}>Nombre del medicamento</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>¿Para qué fue recetado?</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
      />

      <Text style={styles.label}>Doctor que lo recetó</Text>
      <TextInput
        style={styles.input}
        value={doctor}
        onChangeText={setDoctor}
      />

      <Text style={styles.label}>Horarios</Text>
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

      <Text style={styles.label}>Días de la semana</Text>
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
        style={styles.button}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Text style={styles.deleteButtonText}>Eliminar medicamento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginBottom: 24,
    marginTop: 16
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16
  },
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
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14
  },
  addTimeButton: {
    borderWidth: 1,
    borderColor: '#2d6a4f',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  addTimeText: {
    color: '#2d6a4f',
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
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minWidth: 44,
    alignItems: 'center'
  },
  dayButtonActive: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f'
  },
  dayText: {
    color: '#444',
    fontSize: 13
  },
  dayTextActive: {
    color: '#fff'
  },
  button: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
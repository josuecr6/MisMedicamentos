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
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { requestPermissions, scheduleNotification } from '../utils/notifications';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AddMedicationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [doctor, setDoctor] = useState('');
  const [times, setTimes] = useState(['08:00']);
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [loading, setLoading] = useState(false);

  const addTime = () => {
    setTimes([...times, '08:00']);
  };

  const updateTime = (index, value) => {
    const updated = [...times];
    updated[index] = value;
    setTimes(updated);
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
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Error', 'Necesitas permitir las notificaciones para las alarmas');
        return;
      }

      const notificationIds = [];
      for (const time of times) {
        const [hour, minute] = time.split(':').map(Number);
        const id = await scheduleNotification(name, hour, minute, selectedDays);
        notificationIds.push(id);
      }

      await addDoc(collection(db, 'medications'), {
        name,
        reason,
        doctor,
        times,
        selectedDays,
        notificationIds,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });

      Alert.alert('Éxito', 'Medicamento guardado correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Agregar medicamento</Text>

      <Text style={styles.label}>Nombre del medicamento</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Paracetamol"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>¿Para qué fue recetado?</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Dolor de cabeza"
        value={reason}
        onChangeText={setReason}
      />

      <Text style={styles.label}>Doctor que lo recetó</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Dr. Juan Pérez"
        value={doctor}
        onChangeText={setDoctor}
      />

      <Text style={styles.label}>Horarios</Text>
      {times.map((time, index) => (
        <View key={index} style={styles.timeRow}>
          <TextInput
            style={styles.timeInput}
            value={time}
            onChangeText={(value) => updateTime(index, value)}
            placeholder="HH:MM"
            keyboardType="numbers-and-punctuation"
          />
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
          {loading ? 'Guardando...' : 'Guardar medicamento'}
        </Text>
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
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
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
    marginBottom: 32
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
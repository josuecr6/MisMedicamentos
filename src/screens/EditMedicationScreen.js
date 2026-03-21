import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { deleteMedication } from '../services/medicationService';
import { requestPermissions, scheduleNotification, cancelNotification } from '../utils/notifications';
import { COLORS, DAYS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';
import { convertTo24Hour, sortTimes } from '../utils/timeUtils';
import Svg, { Rect } from 'react-native-svg';
import TimePicker from '../components/TimePicker';

function DisketteIcon({ size = 26, color = COLORS.accent }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="2" width="20" height="20" rx="3" fill={color} />
      <Rect x="6" y="2" width="10" height="7" rx="1" fill={COLORS.bgCard ?? '#16181f'} />
      <Rect x="8" y="3.5" width="2" height="4" rx="0.5" fill={color} opacity="0.45" />
      <Rect x="5" y="13" width="14" height="7" rx="1.5" fill={COLORS.bgCard ?? '#16181f'} />
      <Rect x="8" y="15" width="8" height="3" rx="0.75" fill={color} opacity="0.35" />
    </Svg>
  );
}

export default function EditMedicationScreen({ route, navigation }) {
  const { medication } = route.params;

  const [name,         setName]         = useState(medication.name);
  const [reason,       setReason]       = useState(medication.reason);
  const [doctor,       setDoctor]       = useState(medication.doctor);
  const [times,        setTimes]        = useState(medication.times || []);
  const [selectedDays, setSelectedDays] = useState(medication.selectedDays || [0,1,2,3,4,5,6]);
  const [loading,      setLoading]      = useState(false);

  // Control del picker
  const [pickerVisible,   setPickerVisible]   = useState(false);
  const [editingIndex,    setEditingIndex]    = useState(null);
  const [pickerInitValue, setPickerInitValue] = useState('08:00 AM');

  const handleAddTime = () => {
    setEditingIndex(null);
    setPickerInitValue('08:00 AM');
    setPickerVisible(true);
  };

  const handleEditTime = (index) => {
    setEditingIndex(index);
    setPickerInitValue(times[index]);
    setPickerVisible(true);
  };

  const handlePickerConfirm = (value) => {
    if (editingIndex === null) {
      setTimes(prev => sortTimes([...prev, value]));
    } else {
      const updated = [...times];
      updated[editingIndex] = value;
      setTimes(sortTimes(updated));
    }
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

      // Cancelar notificaciones anteriores
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
        name, reason, doctor, times, selectedDays, notificationIds,
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
    <ScrollView style={commonStyles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Editar medicamento</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.7}
        >
          <DisketteIcon size={26} color={loading ? COLORS.textMuted : COLORS.accent} />
        </TouchableOpacity>
      </View>

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

      {times.length > 0 && (
        <View style={styles.chipsContainer}>
          {times.map((time, index) => (
            <View key={index} style={styles.chip}>
              <TouchableOpacity
                style={styles.chipLabel}
                onPress={() => handleEditTime(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{time}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chipRemove}
                onPress={() => removeTime(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.addTimeButton} onPress={handleAddTime}>
        <Text style={styles.addTimeText}>+ Agregar horario</Text>
      </TouchableOpacity>

      <Text style={commonStyles.label}>Días de la semana</Text>
      <View style={styles.daysRow}>
        {DAYS.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dayButton, selectedDays.includes(index) && styles.dayButtonActive]}
            onPress={() => toggleDay(index)}
          >
            <Text style={[styles.dayText, selectedDays.includes(index) && styles.dayTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={commonStyles.deleteButton} onPress={handleDelete}>
        <Text style={commonStyles.deleteButtonText}>Eliminar medicamento</Text>
      </TouchableOpacity>

      <TimePicker
        value={pickerInitValue}
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onChange={handlePickerConfirm}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  saveButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 10,
    overflow: 'hidden',
  },
  chipLabel: {
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  chipRemove: {
    backgroundColor: COLORS.danger,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRemoveText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 20,
  },
  addTimeButton: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addTimeText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayButton: {
    borderRadius: 8,
    padding: 10,
    minWidth: 44,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  dayButtonActive: {
    backgroundColor: COLORS.accent,
  },
  dayText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  dayTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

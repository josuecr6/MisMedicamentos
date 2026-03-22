import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import TimePicker from './TimePicker';
import { commonStyles } from '../utils/commonStyles';
import { COLORS, DAYS } from '../utils/theme';
import { sortTimes } from '../utils/timeUtils';

function DisketteIcon({ size = 26, color = COLORS.accent }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="2" width="20" height="20" rx="3" fill={color} />
      <Rect x="6" y="2" width="10" height="7" rx="1" fill={COLORS.bgCard} />
      <Rect x="8" y="3.5" width="2" height="4" rx="0.5" fill={color} opacity="0.45" />
      <Rect x="5" y="13" width="14" height="7" rx="1.5" fill={COLORS.bgCard} />
      <Rect x="8" y="15" width="8" height="3" rx="0.75" fill={color} opacity="0.35" />
    </Svg>
  );
}

export default function MedicationForm({
  title,
  initialValues,
  loading,
  onSubmit,
  onDelete,
  submitDisabled,
}) {
  const [name, setName] = useState(initialValues.name ?? '');
  const [reason, setReason] = useState(initialValues.reason ?? '');
  const [doctor, setDoctor] = useState(initialValues.doctor ?? '');
  const [times, setTimes] = useState(sortTimes(initialValues.times ?? []));
  const [selectedDays, setSelectedDays] = useState(initialValues.selectedDays ?? [0, 1, 2, 3, 4, 5, 6]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [pickerInitValue, setPickerInitValue] = useState('08:00 AM');

  const canSubmit = useMemo(
    () => !loading && !submitDisabled,
    [loading, submitDisabled]
  );

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
      setTimes((prev) => sortTimes([...prev, value]));
      return;
    }

    const updated = [...times];
    updated[editingIndex] = value;
    setTimes(sortTimes(updated));
  };

  const removeTime = (index) => {
    if (times.length === 1) {
      Alert.alert('Error', 'Debe tener al menos un horario');
      return;
    }

    setTimes((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const toggleDay = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length === 1) {
        Alert.alert('Error', 'Debe seleccionar al menos un día');
        return;
      }

      setSelectedDays((prev) => prev.filter((day) => day !== dayIndex));
      return;
    }

    setSelectedDays((prev) => [...prev, dayIndex].sort((a, b) => a - b));
  };

  const handleSubmit = () => {
    if (!name.trim() || !reason.trim() || !doctor.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (times.length === 0) {
      Alert.alert('Error', 'Agrega al menos un horario');
      return;
    }

    onSubmit({
      name: name.trim(),
      reason: reason.trim(),
      doctor: doctor.trim(),
      times,
      selectedDays,
    });
  };

  return (
    <ScrollView style={commonStyles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity
          style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.7}
        >
          <DisketteIcon size={26} color={canSubmit ? COLORS.accent : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={commonStyles.label}>Nombre del medicamento</Text>
      <TextInput
        style={commonStyles.input}
        placeholder="Ej: Paracetamol"
        placeholderTextColor={COLORS.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={commonStyles.label}>¿Para qué fue recetado?</Text>
      <TextInput
        style={commonStyles.input}
        placeholder="Ej: Dolor de cabeza"
        placeholderTextColor={COLORS.textMuted}
        value={reason}
        onChangeText={setReason}
      />

      <Text style={commonStyles.label}>Doctor que lo recetó</Text>
      <TextInput
        style={commonStyles.input}
        placeholder="Ej: Dr. Juan Pérez"
        placeholderTextColor={COLORS.textMuted}
        value={doctor}
        onChangeText={setDoctor}
      />

      <Text style={commonStyles.label}>Horarios</Text>
      {times.length > 0 && (
        <View style={styles.chipsContainer}>
          {times.map((time, index) => (
            <View key={`${time}-${index}`} style={styles.chip}>
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
            key={day}
            style={[styles.dayButton, selectedDays.includes(index) && styles.dayButtonActive]}
            onPress={() => toggleDay(index)}
          >
            <Text style={[styles.dayText, selectedDays.includes(index) && styles.dayTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {onDelete ? (
        <TouchableOpacity style={commonStyles.deleteButton} onPress={onDelete}>
          <Text style={commonStyles.deleteButtonText}>Eliminar medicamento</Text>
        </TouchableOpacity>
      ) : null}

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
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surface,
    overflow: 'hidden',
  },
  chipLabel: {
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
  },
  chipText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  chipRemove: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
  },
  chipRemoveText: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 20,
  },
  addTimeButton: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addTimeText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayButton: {
    minWidth: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surface,
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dayButtonActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  dayText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#ffffff',
  },
});

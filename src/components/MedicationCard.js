import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { deleteMedication } from '../services/medicationService';
import { COLORS } from '../utils/theme';
import { hasTimePassed } from '../utils/timeUtils';
import DayBadges from './DayBadges';

// React.memo evita re-renders cuando las props no cambian
function MedicationCard({ item, navigation, today }) {
  const isTakenAtTime = useCallback(
    (time) => {
      const key = `${today}_${time}`;
      return item.takenTimes ? item.takenTimes.includes(key) : false;
    },
    [today, item.takenTimes]
  );

  // Función combinada: un solo cálculo por time en vez de dos
  const getTimeBadgeProps = useCallback(
    (time) => {
      const taken = isTakenAtTime(time);
      const passed = !taken && hasTimePassed(time);

      if (taken) {
        return {
          containerStyle: styles.timeBadgeTaken,
          textStyle: styles.timeBadgeTextTaken,
          label: `✓ ${time}`,
        };
      }
      if (passed) {
        return {
          containerStyle: styles.timeBadgePending,
          textStyle: styles.timeBadgeTextPending,
          label: time,
        };
      }
      return {
        containerStyle: styles.timeBadgeUpcoming,
        textStyle: styles.timeBadgeTextUpcoming,
        label: time,
      };
    },
    [isTakenAtTime]
  );

  // arrayUnion/arrayRemove: operación atómica en Firestore,
  // evita condiciones de carrera si se toca dos badges rápido
  const handleToggleTime = useCallback(
    async (time) => {
      const key = `${today}_${time}`;
      const alreadyTaken = isTakenAtTime(time);

      await updateDoc(doc(db, 'medications', item.id), {
        takenTimes: alreadyTaken ? arrayRemove(key) : arrayUnion(key),
      });
    },
    [today, item.id, isTakenAtTime]
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Eliminar medicamento',
      `¿Qué deseas hacer con ${item.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar sin guardar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(item, false);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el medicamento');
            }
          },
        },
        {
          text: 'Guardar en historial',
          onPress: async () => {
            try {
              await deleteMedication(item, true);
              Alert.alert('Éxito', 'Medicamento guardado en el historial');
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el medicamento');
            }
          },
        },
      ]
    );
  }, [item]);

  const handleEdit = useCallback(() => {
    navigation.navigate('EditMedication', { medication: item });
  }, [navigation, item]);

  // Calculado una sola vez por render, no en cada badge
  const allTakenToday = useMemo(
    () => item.times && item.times.length > 0 && item.times.every(isTakenAtTime),
    [item.times, isTakenAtTime]
  );

  return (
    <View style={[styles.card, allTakenToday && styles.cardTaken]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {allTakenToday && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Completo</Text>
          </View>
        )}
        <TouchableOpacity style={styles.editIcon} onPress={handleEdit}>
          <Svg width="18" height="18" viewBox="0 0 24 24">
            <Path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              fill={COLORS.accent}
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <Text style={styles.cardText}>Para: {item.reason}</Text>
      <Text style={styles.cardText}>Doctor: {item.doctor}</Text>

      <Text style={styles.timesLabel}>Toca la hora cuando lo tomes:</Text>
      <View style={styles.timesList}>
        {item.times &&
          item.times.map((time, index) => {
            const { containerStyle, textStyle, label } = getTimeBadgeProps(time);
            return (
              // Key estable: combina valor + índice para evitar colisiones con horarios duplicados
              <TouchableOpacity
                key={`${time}-${index}`}
                style={containerStyle}
                onPress={() => handleToggleTime(time)}
              >
                <Text style={textStyle}>{label}</Text>
              </TouchableOpacity>
            );
          })}
      </View>

      <Text style={styles.timesLabel}>Días:</Text>
      <DayBadges selectedDays={item.selectedDays} />
    </View>
  );
}

export default React.memo(MedicationCard);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.secondary,
  },
  cardTaken: {
    borderColor: COLORS.success,
    backgroundColor: '#1a2e1a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  completedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: 'bold',
  },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  timesLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 6,
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeBadgeUpcoming: {
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  timeBadgePending: {
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2d1a1a',
  },
  timeBadgeTaken: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a2e1a',
  },
  timeBadgeTextUpcoming: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeBadgeTextPending: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeBadgeTextTaken: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: 'bold',
  },
});

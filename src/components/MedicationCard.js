import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { deleteMedication } from '../services/medicationService';
import { COLORS, DAYS } from '../utils/theme';
import { hasTimePassed } from '../utils/timeUtils';
import DayBadges from './DayBadges';

export default function MedicationCard({ item, navigation }) {
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new Date().toISOString().split('T')[0]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isTakenAtTime = (time) => {
    const key = `${today}_${time}`;
    return item.takenTimes && item.takenTimes.includes(key);
  };

  const getTimeBadgeStyle = (time) => {
    const taken = isTakenAtTime(time);
    const passed = hasTimePassed(time);
    if (taken)  return styles.timeBadgeTaken;
    if (passed) return styles.timeBadgePending;
    return styles.timeBadgeUpcoming;
  };

  const getTimeTextStyle = (time) => {
    const taken = isTakenAtTime(time);
    const passed = hasTimePassed(time);
    if (taken)  return styles.timeBadgeTextTaken;
    if (passed) return styles.timeBadgeTextPending;
    return styles.timeBadgeTextUpcoming;
  };

  const handleToggleTime = async (time) => {
    const key = `${today}_${time}`;
    const currentTakenTimes = item.takenTimes || [];
    let updatedTakenTimes;

    if (currentTakenTimes.includes(key)) {
      updatedTakenTimes = currentTakenTimes.filter(t => t !== key);
    } else {
      updatedTakenTimes = [...currentTakenTimes, key];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    updatedTakenTimes = updatedTakenTimes.filter(t => {
      const datePart = t.split('_')[0];
      return new Date(datePart) >= thirtyDaysAgo;
    });

    await updateDoc(doc(db, 'medications', item.id), { takenTimes: updatedTakenTimes });
  };

  const handleDelete = () => {
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
          }
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
          }
        }
      ]
    );
  };

  const allTakenToday = item.times && item.times.every(time => isTakenAtTime(time));

  return (
    <View style={[styles.card, allTakenToday && styles.cardTaken]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {allTakenToday && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Completo</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.editIcon}
          onPress={() => navigation.navigate('EditMedication', { medication: item })}
        >
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
        {item.times && item.times.map((time, index) => {
          const taken = isTakenAtTime(time);
          return (
            <TouchableOpacity
              key={index}
              style={getTimeBadgeStyle(time)}
              onPress={() => handleToggleTime(time)}
              activeOpacity={0.7}
            >
              <Text style={getTimeTextStyle(time)}>
                {taken ? `✓ ${time}` : time}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.timesLabel}>Días:</Text>
      <DayBadges selectedDays={item.selectedDays} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.bgCard,
  },
  cardTaken: {
    backgroundColor: 'rgba(50,215,75,0.07)',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    letterSpacing: -0.3,
  },
  completedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: COLORS.bg,
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  timesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Sin bordes — solo fondo y texto
  timeBadgeUpcoming: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  timeBadgePending: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,77,77,0.12)',
  },
  timeBadgeTaken: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(50,215,75,0.12)',
  },

  timeBadgeTextUpcoming: {
    color: COLORS.textSub,
    fontSize: 15,
    fontWeight: '700',
  },
  timeBadgeTextPending: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  timeBadgeTextTaken: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: '700',
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function MedicationCard({ item }) {
  const today = new Date().toISOString().split('T')[0];

  const isTakenToday = item.takenDates && item.takenDates.includes(today);

  const handleToggleTaken = async () => {
    const ref = doc(db, 'medications', item.id);
    if (isTakenToday) {
      await updateDoc(ref, {
        takenDates: arrayRemove(today)
      });
    } else {
      await updateDoc(ref, {
        takenDates: arrayUnion(today)
      });
    }
  };

  return (
    <View style={[styles.card, isTakenToday && styles.cardTaken]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <TouchableOpacity
          style={[styles.takenButton, isTakenToday && styles.takenButtonActive]}
          onPress={handleToggleTaken}
        >
          <Text style={styles.takenButtonText}>
            {isTakenToday ? '✓ Tomado' : 'Marcar tomado'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cardText}>Para: {item.reason}</Text>
      <Text style={styles.cardText}>Doctor: {item.doctor}</Text>

      <View style={styles.timesContainer}>
        <Text style={styles.timesLabel}>Horarios:</Text>
        <View style={styles.timesList}>
          {item.times && item.times.map((time, index) => (
            <View key={index} style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{time}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.daysContainer}>
        <Text style={styles.timesLabel}>Días:</Text>
        <View style={styles.daysList}>
          {DAYS.map((day, index) => (
            <View
              key={index}
              style={[
                styles.dayBadge,
                item.selectedDays && item.selectedDays.includes(index)
                  ? styles.dayBadgeActive
                  : styles.dayBadgeInactive
              ]}
            >
              <Text style={[
                styles.dayBadgeText,
                item.selectedDays && item.selectedDays.includes(index)
                  ? styles.dayBadgeTextActive
                  : styles.dayBadgeTextInactive
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  cardTaken: {
    borderColor: '#2d6a4f',
    backgroundColor: '#f0faf4'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d6a4f',
    flex: 1
  },
  takenButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  takenButtonActive: {
    backgroundColor: '#2d6a4f'
  },
  takenButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2
  },
  timesContainer: {
    marginTop: 8
  },
  timesLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 4
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  timeBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  timeBadgeText: {
    color: '#2d6a4f',
    fontSize: 13,
    fontWeight: 'bold'
  },
  daysContainer: {
    marginTop: 8
  },
  daysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  },
  dayBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  dayBadgeActive: {
    backgroundColor: '#2d6a4f'
  },
  dayBadgeInactive: {
    backgroundColor: '#f0f0f0'
  },
  dayBadgeText: {
    fontSize: 12
  },
  dayBadgeTextActive: {
    color: '#fff'
  },
  dayBadgeTextInactive: {
    color: '#999'
  }
});
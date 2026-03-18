import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { cancelNotification } from '../utils/notifications';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function MedicationCard({ item, navigation }) {
  const today = new Date().toISOString().split('T')[0];

  const isTakenAtTime = (time) => {
    const key = `${today}_${time}`;
    return item.takenTimes && item.takenTimes.includes(key);
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

    const ref = doc(db, 'medications', item.id);
    await updateDoc(ref, { takenTimes: updatedTakenTimes });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar medicamento',
      `¿Estás seguro que deseas eliminar ${item.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.notificationIds) {
                for (const id of item.notificationIds) {
                  await cancelNotification(id);
                }
              }
              await deleteDoc(doc(db, 'medications', item.id));
            } catch (error) {
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
              style={[styles.timeBadge, taken && styles.timeBadgeTaken]}
              onPress={() => handleToggleTime(time)}
            >
              <Text style={[styles.timeBadgeText, taken && styles.timeBadgeTextTaken]}>
                {taken ? `✓ ${time}` : time}
              </Text>
            </TouchableOpacity>
          );
        })}
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditMedication', { medication: item })}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
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
  completedBadge: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2
  },
  timesLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 10,
    marginBottom: 6
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  timeBadge: {
    borderWidth: 1.5,
    borderColor: '#2d6a4f',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff'
  },
  timeBadgeTaken: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f'
  },
  timeBadgeText: {
    color: '#2d6a4f',
    fontSize: 15,
    fontWeight: 'bold'
  },
  timeBadgeTextTaken: {
    color: '#fff'
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
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  editButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2d6a4f',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  editButtonText: {
    color: '#2d6a4f',
    fontSize: 14,
    fontWeight: 'bold'
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
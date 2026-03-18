import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function SharedStatusScreen({ route }) {
  const { ownerId, ownerName } = route.params;
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const q = query(
      collection(db, 'medications'),
      where('userId', '==', ownerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMedications(list);
      setLoading(false);
    });

    return unsubscribe;
  }, [ownerId]);

  const isTakenAtTime = (item, time) => {
    const key = `${today}_${time}`;
    return item.takenTimes && item.takenTimes.includes(key);
  };

  const renderItem = ({ item }) => {
    const allTakenToday = item.times && item.times.every(time => isTakenAtTime(item, time));

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

        <Text style={styles.timesLabel}>Estado de hoy:</Text>
        <View style={styles.timesList}>
          {item.times && item.times.map((time, index) => {
            const taken = isTakenAtTime(item, time);
            return (
              <View
                key={index}
                style={[styles.timeBadge, taken && styles.timeBadgeTaken]}
              >
                <Text style={[styles.timeBadgeText, taken && styles.timeBadgeTextTaken]}>
                  {taken ? `✓ ${time}` : time}
                </Text>
              </View>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medicamentos de {ownerName}</Text>
      <Text style={styles.subtitle}>Estado en tiempo real de hoy</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />
      ) : medications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hay medicamentos registrados</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginTop: 40,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 24
  },
  loader: {
    flex: 1
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#999',
    fontSize: 16
  },
  list: {
    paddingBottom: 16
  },
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
    borderColor: '#ccc',
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
    color: '#666',
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
  }
});
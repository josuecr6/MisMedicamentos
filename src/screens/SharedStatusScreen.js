import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

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

  const renderItem = ({ item }) => {
    const isTakenToday = item.takenDates && item.takenDates.includes(today);

    return (
      <View style={[styles.card, isTakenToday && styles.cardTaken]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.statusBadge, isTakenToday && styles.statusBadgeTaken]}>
            <Text style={styles.statusBadgeText}>
              {isTakenToday ? '✓ Tomado hoy' : 'Pendiente'}
            </Text>
          </View>
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
  statusBadge: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusBadgeTaken: {
    backgroundColor: '#2d6a4f'
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
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
  }
});
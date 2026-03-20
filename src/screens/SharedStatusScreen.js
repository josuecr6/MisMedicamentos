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
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';
import DayBadges from '../components/DayBadges';

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
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      <View style={[commonStyles.card, allTakenToday && styles.cardTaken]}>
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
                style={taken ? styles.timeBadgeTaken : styles.timeBadgePending}
              >
                <Text style={taken ? styles.timeBadgeTextTaken : styles.timeBadgeTextPending}>
                  {taken ? `✓ ${time}` : time}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.timesLabel}>Días:</Text>
        <DayBadges selectedDays={item.selectedDays} />
      </View>
    );
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Medicamentos de {ownerName}</Text>
      <Text style={commonStyles.subtitle}>Estado en tiempo real de hoy</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} />
      ) : medications.length === 0 ? (
        <View style={commonStyles.empty}>
          <Text style={commonStyles.emptyText}>No hay medicamentos registrados</Text>
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
  list: {
    paddingBottom: 16
  },
  cardTaken: {
    borderColor: COLORS.success,
    backgroundColor: '#1a2e1a'
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
    color: COLORS.text,
    flex: 1
  },
  completedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  completedBadgeText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: 'bold'
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 2
  },
  timesLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 6
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  timeBadgePending: {
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface
  },
  timeBadgeTaken: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a2e1a'
  },
  timeBadgeTextPending: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: 'bold'
  },
  timeBadgeTextTaken: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: 'bold'
  }
});
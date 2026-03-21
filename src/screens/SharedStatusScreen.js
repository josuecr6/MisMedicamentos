import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';

import { db } from '../services/firebase';
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';
import { isScheduledForDate } from '../utils/dateUtils';
import DayBadges from '../components/DayBadges';
import useTodayKey from '../hooks/useTodayKey';

export default function SharedStatusScreen({ route }) {
  const { ownerId, ownerName } = route.params;
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = useTodayKey();

  useEffect(() => {
    const q = query(
      collection(db, 'medications'),
      where('userId', '==', ownerId),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
        setMedications(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [ownerId]);

  const isTakenAtTime = useCallback(
    (item, time) => {
      const key = `${today}_${time}`;
      return item.takenTimes?.includes(key) ?? false;
    },
    [today]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const scheduledToday = isScheduledForDate(item.selectedDays);
      const allTakenToday = scheduledToday && item.times?.every((time) => isTakenAtTime(item, time));

      return (
        <View style={[commonStyles.card, allTakenToday && styles.cardTaken]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {allTakenToday ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓ Completo</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.cardText}>Para: {item.reason}</Text>
          <Text style={styles.cardText}>Doctor: {item.doctor}</Text>

          <Text style={styles.timesLabel}>
            {scheduledToday ? 'Estado de hoy:' : 'Hoy no corresponde este medicamento'}
          </Text>
          <View style={styles.timesList}>
            {item.times?.map((time, index) => {
              const taken = isTakenAtTime(item, time);
              return (
                <View
                  key={`${time}-${index}`}
                  style={
                    !scheduledToday
                      ? styles.timeBadgeInactive
                      : taken
                        ? styles.timeBadgeTaken
                        : styles.timeBadgePending
                  }
                >
                  <Text
                    style={
                      !scheduledToday
                        ? styles.timeBadgeTextInactive
                        : taken
                          ? styles.timeBadgeTextTaken
                          : styles.timeBadgeTextPending
                    }
                  >
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
    },
    [isTakenAtTime]
  );

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
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 16,
  },
  cardTaken: {
    borderColor: COLORS.success,
    backgroundColor: '#1a2e1a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  timeBadgePending: {
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  timeBadgeTaken: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a2e1a',
  },
  timeBadgeInactive: {
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.secondary,
  },
  timeBadgeTextPending: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeBadgeTextTaken: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: 'bold',
  },
  timeBadgeTextInactive: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: 'bold',
  },
});

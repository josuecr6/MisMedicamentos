import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';
import MedicationCard from '../components/MedicationCard';

export default function HomeScreen({ navigation }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 'today' se calcula aquí y se pasa como prop a cada MedicationCard.
  // Así el setInterval vive en un solo lugar en vez de N timers simultáneos.
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new Date().toISOString().split('T')[0]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'medications'),
      where('userId', '==', auth.currentUser.uid),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        // Ordenar en cliente: máximo 50 docs, costo despreciable,
        // evita necesitar índice compuesto en Firestore
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() ?? new Date(0);
          const dateB = b.createdAt?.toDate?.() ?? new Date(0);
          return dateB - dateA;
        });
      setMedications(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // useCallback evita recrear la función en cada render de HomeScreen,
  // lo que a su vez evita que FlatList re-renderice todos los items.
  const renderItem = useCallback(
    ({ item }) => <MedicationCard item={item} navigation={navigation} today={today} />,
    [navigation, today]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Medicamentos</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={styles.loader} />
      ) : medications.length === 0 ? (
        <View style={commonStyles.empty}>
          <Text style={commonStyles.emptyText}>No tienes medicamentos agregados</Text>
          <Text style={styles.emptyHint}>Toca el botón + para agregar uno</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          // Mejoras de rendimiento nativas de FlatList
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loader: {
    flex: 1,
  },
  emptyHint: {
    color: COLORS.surface,
    fontSize: 13,
    marginTop: 8,
  },
  list: {
    paddingBottom: 16,
  },
});

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
import { COLORS, DAYS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';

export default function ReportsScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'medicationHistory'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => b.deletedAt?.toDate() - a.deletedAt?.toDate());
      setHistory(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha desconocida';
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = ({ item }) => (
    <View style={commonStyles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDate}>Eliminado: {formatDate(item.deletedAt)}</Text>
      </View>

      <View style={styles.divider} />

      <Text style={commonStyles.label}>Uso:</Text>
      <Text style={styles.cardValue}>{item.reason}</Text>

      <Text style={commonStyles.label}>Doctor:</Text>
      <Text style={styles.cardValue}>{item.doctor}</Text>

      <Text style={commonStyles.label}>Horarios:</Text>
      <Text style={styles.cardValue}>{item.times?.join(', ')}</Text>

      <Text style={commonStyles.label}>Días:</Text>
      <Text style={styles.cardValue}>
        {item.selectedDays?.map(d => DAYS[d]).join(', ')}
      </Text>

      <Text style={commonStyles.label}>Fecha de inicio:</Text>
      <Text style={styles.cardValue}>{formatDate(item.createdAt)}</Text>
    </View>
  );

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Historial de medicamentos</Text>
      <Text style={commonStyles.subtitle}>Registro de medicamentos eliminados</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} />
      ) : history.length === 0 ? (
        <View style={commonStyles.empty}>
          <Text style={commonStyles.emptyText}>No hay registros en el historial</Text>
        </View>
      ) : (
        <FlatList
          data={history}
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
  cardHeader: {
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 4
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.surface,
    marginBottom: 12
  },
  cardValue: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
    marginBottom: 4
  }
});
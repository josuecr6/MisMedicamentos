import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export default function ReportsScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'medicationHistory'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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

  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDate}>Eliminado: {formatDate(item.deletedAt)}</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.cardLabel}>Uso:</Text>
      <Text style={styles.cardValue}>{item.reason}</Text>

      <Text style={styles.cardLabel}>Doctor:</Text>
      <Text style={styles.cardValue}>{item.doctor}</Text>

      <Text style={styles.cardLabel}>Horarios:</Text>
      <Text style={styles.cardValue}>{item.times?.join(', ')}</Text>

      <Text style={styles.cardLabel}>Días:</Text>
      <Text style={styles.cardValue}>
        {item.selectedDays?.map(d => DAYS[d]).join(', ')}
      </Text>

      <Text style={styles.cardLabel}>Fecha de inicio:</Text>
      <Text style={styles.cardValue}>{formatDate(item.createdAt)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de medicamentos</Text>
      <Text style={styles.subtitle}>
        Registro de medicamentos eliminados
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2d6a4f" />
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hay registros en el historial</Text>
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
    marginBottom: 8
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 24
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  cardHeader: {
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginBottom: 4
  },
  cardDate: {
    fontSize: 12,
    color: '#999'
  },
  divider: {
    height: 0.5,
    backgroundColor: '#eee',
    marginBottom: 12
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  cardValue: {
    fontSize: 14,
    color: '#333',
    marginTop: 2
  }
});
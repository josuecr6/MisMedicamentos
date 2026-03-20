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
import MedicationCard from '../components/MedicationCard';

export default function HomeScreen({ navigation }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'medications'),
      where('userId', '==', auth.currentUser.uid)
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
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Medicamentos</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />
      ) : medications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No tienes medicamentos agregados</Text>
          <Text style={styles.emptyHint}>Toca el botón + para agregar uno</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MedicationCard item={item} navigation={navigation} />}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a4f'
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
    fontSize: 16,
    marginBottom: 8
  },
  emptyHint: {
    color: '#ccc',
    fontSize: 13
  },
  list: {
    paddingBottom: 16
  }
});
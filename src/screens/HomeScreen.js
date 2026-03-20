import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Medicamentos</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddMedication')}
        >
          <Text style={styles.actionButtonText}>+ Agregar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate('Persons')}
        >
          <Text style={styles.actionButtonTextSecondary}>Accesos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate('SharedWithMe')}
        >
          <Text style={styles.actionButtonTextSecondary}>Compartido</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />
      ) : medications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No tienes medicamentos agregados</Text>
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
  logoutText: {
    color: '#2d6a4f',
    fontSize: 14
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2d6a4f'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  actionButtonTextSecondary: {
    color: '#2d6a4f',
    fontSize: 13,
    fontWeight: 'bold'
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
  }
});
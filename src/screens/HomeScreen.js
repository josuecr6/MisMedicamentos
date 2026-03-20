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
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';
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
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedications(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MedicationCard item={item} navigation={navigation} />}
          contentContainerStyle={styles.list}
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
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text
  },
  loader: {
    flex: 1
  },
  emptyHint: {
    color: COLORS.surface,
    fontSize: 13,
    marginTop: 8
  },
  list: {
    paddingBottom: 16
  }
});
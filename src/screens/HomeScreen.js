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

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Medicamentos</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
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
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AddMedication')}
      >
        <Text style={styles.buttonText}>+ Agregar medicamento</Text>
      </TouchableOpacity>
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
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginBottom: 4
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
  },
  button: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
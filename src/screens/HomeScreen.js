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
import { db, auth } from '../services/firebase';
import MedicationCard from '../components/MedicationCard';

export default function HomeScreen({ navigation }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

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

  const handleMenuOption = (screen) => {
    setMenuVisible(false);
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(!menuVisible)}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
          <Text style={styles.title}>Mis Medicamentos</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileButtonText}>Mi perfil</Text>
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <>
          <TouchableOpacity
            style={styles.menuOverlay}
            onPress={() => setMenuVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('Persons')}
            >
              <Text style={styles.menuItemText}>👥 Gestionar accesos</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('SharedWithMe')}
            >
              <Text style={styles.menuItemText}>🔗 Compartido conmigo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddMedication')}
      >
        <Text style={styles.addButtonText}>+ Agregar medicamento</Text>
      </TouchableOpacity>

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
    padding: 24,
    zIndex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 8
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a4f'
  },
  profileButton: {
    borderWidth: 1,
    borderColor: '#2d6a4f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  profileButtonText: {
    color: '#2d6a4f',
    fontSize: 13,
    fontWeight: 'bold'
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: '#2d6a4f',
    borderRadius: 2
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998
  },
  menuContainer: {
    position: 'absolute',
    top: 80,
    left: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#ccc',
    elevation: 10,
    zIndex: 999,
    minWidth: 200
  },
  menuItem: {
    padding: 16
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500'
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: '#eee',
    marginHorizontal: 16
  },
  addButton: {
    backgroundColor: '#2d6a4f',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
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
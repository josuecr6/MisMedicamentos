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

export default function SharedWithMeScreen({ navigation }) {
  const [sharedList, setSharedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'sharedAccess'),
      where('guestId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSharedList(list);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SharedStatus', {
        ownerId: item.ownerId,
        ownerName: item.ownerEmail
      })}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.cardEmail}>{item.ownerEmail}</Text>
        <Text style={styles.cardHint}>Toca para ver sus medicamentos</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compartido conmigo</Text>
      <Text style={styles.subtitle}>
        Estas personas te dieron acceso a ver sus medicamentos
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2d6a4f" />
      ) : sharedList.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nadie ha compartido contigo aún</Text>
        </View>
      ) : (
        <FlatList
          data={sharedList}
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12
  },
  cardInfo: {
    flex: 1
  },
  cardEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  cardHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  arrow: {
    fontSize: 20,
    color: '#2d6a4f',
    fontWeight: 'bold'
  }
});
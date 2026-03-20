import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export default function PersonsScreen({ navigation }) {
  const [persons, setPersons] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'sharedAccess'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPersons(list);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAddPerson = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa un correo');
      return;
    }
    if (email === auth.currentUser.email) {
      Alert.alert('Error', 'No puedes agregarte a ti mismo');
      return;
    }
    try {
      setSearching(true);
      const q = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase().trim())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert('Error', 'No existe ningún usuario con ese correo');
        return;
      }

      const userFound = snapshot.docs[0].data();

      const alreadyAdded = persons.find(p => p.guestId === userFound.uid);
      if (alreadyAdded) {
        Alert.alert('Error', 'Ya tienes acceso compartido con ese usuario');
        return;
      }

      await setDoc(doc(db, 'sharedAccess', `${auth.currentUser.uid}_${userFound.uid}`), {
        ownerId: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email,
        guestId: userFound.uid,
        guestEmail: userFound.email,
        guestName: userFound.name,
        createdAt: new Date()
      });

      setEmail('');
      Alert.alert('Éxito', `${userFound.name} ahora puede ver tus medicamentos`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la persona');
    } finally {
      setSearching(false);
    }
  };

  const handleDeletePerson = async (id) => {
    Alert.alert(
      'Eliminar acceso',
      '¿Estás seguro que deseas quitar el acceso a esta persona?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'sharedAccess', id));
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.guestName}</Text>
        <Text style={styles.cardEmail}>{item.guestEmail}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePerson(item.id)}
      >
        <Text style={styles.deleteButtonText}>Quitar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personas con acceso</Text>
      <Text style={styles.subtitle}>
        Ingresa el correo de un usuario registrado para darle acceso a tus medicamentos
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico del usuario"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleAddPerson}
          disabled={searching}
        >
          <Text style={styles.buttonText}>
            {searching ? 'Buscando...' : '+ Dar acceso'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2d6a4f" />
      ) : persons.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No has dado acceso a nadie aún</Text>
        </View>
      ) : (
        <FlatList
          data={persons}
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
  form: {
    marginBottom: 24
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16
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
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  cardEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  }
});
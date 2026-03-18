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
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export default function PersonsScreen({ navigation }) {
  const [persons, setPersons] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'persons'),
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
    if (!name || !email) {
      Alert.alert('Error', 'Por favor completa el nombre y correo');
      return;
    }
    try {
      setSaving(true);
      await addDoc(collection(db, 'persons'), {
        name,
        email,
        ownerId: auth.currentUser.uid,
        createdAt: new Date()
      });
      setName('');
      setEmail('');
      Alert.alert('Éxito', 'Persona agregada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la persona');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePerson = async (id) => {
    Alert.alert(
      'Eliminar persona',
      '¿Estás seguro que deseas eliminar esta persona?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'persons', id));
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
      </View>
      <View style={styles.cardButtons}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.navigate('SharedStatus', {
            ownerId: auth.currentUser.uid,
            ownerName: 'mis'
          })}
        >
          <Text style={styles.viewButtonText}>Ver estado</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePerson(item.id)}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personas</Text>
      <Text style={styles.subtitle}>
        Estas personas recibirán notificaciones y podrán ver el estado de tus medicamentos
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleAddPerson}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Agregando...' : '+ Agregar persona'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2d6a4f" />
      ) : persons.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No tienes personas agregadas</Text>
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12
  },
  cardInfo: {
    marginBottom: 12
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
  cardButtons: {
    flexDirection: 'row',
    gap: 8
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  }
});
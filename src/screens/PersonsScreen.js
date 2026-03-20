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
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';

export default function PersonsScreen() {
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
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
          onPress: async () => await deleteDoc(doc(db, 'sharedAccess', id))
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={commonStyles.card}>
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
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Personas con acceso</Text>
      <Text style={commonStyles.subtitle}>
        Ingresa el correo de un usuario registrado para darle acceso
      </Text>

      <View style={styles.form}>
        <TextInput
          style={commonStyles.input}
          placeholder="Correo electrónico del usuario"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={commonStyles.button}
          onPress={handleAddPerson}
          disabled={searching}
        >
          <Text style={commonStyles.buttonText}>
            {searching ? 'Buscando...' : '+ Dar acceso'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} />
      ) : persons.length === 0 ? (
        <View style={commonStyles.empty}>
          <Text style={commonStyles.emptyText}>No has dado acceso a nadie aún</Text>
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
  form: {
    marginBottom: 24
  },
  list: {
    paddingBottom: 16
  },
  cardInfo: {
    flex: 1
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text
  },
  cardEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  deleteButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold'
  }
});
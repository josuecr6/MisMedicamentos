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

// Valida formato de email antes de consultar Firestore
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

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
    const sanitizedEmail = email.toLowerCase().trim();

    // H2 — validar formato antes de tocar Firestore
    if (!sanitizedEmail) {
      Alert.alert('Error', 'Por favor ingresa un correo');
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      Alert.alert('Error', 'El formato del correo no es válido');
      return;
    }

    if (sanitizedEmail === auth.currentUser.email) {
      Alert.alert('Error', 'No puedes agregarte a ti mismo');
      return;
    }

    const alreadyAdded = persons.find(
      p => p.guestEmail === sanitizedEmail
    );
    if (alreadyAdded) {
      // Mensaje genérico — no confirma si el email existe o no
      Alert.alert('Aviso', 'Ya tienes acceso compartido con ese usuario');
      return;
    }

    try {
      setSearching(true);
      const q = query(
        collection(db, 'users'),
        where('email', '==', sanitizedEmail)
      );
      const snapshot = await getDocs(q);

      // Mensaje genérico tanto si no existe como si hubo error
      // para no permitir enumeración de usuarios registrados
      if (snapshot.empty) {
        Alert.alert(
          'Aviso',
          'Si ese correo está registrado, se ha dado acceso correctamente.'
        );
        return;
      }

      const userFound = snapshot.docs[0].data();

      await setDoc(
        doc(db, 'sharedAccess', `${auth.currentUser.uid}_${userFound.uid}`),
        {
          ownerId: auth.currentUser.uid,
          ownerEmail: auth.currentUser.email,
          guestId: userFound.uid,
          guestEmail: userFound.email,
          guestName: userFound.name,
          createdAt: new Date()
        }
      );

      setEmail('');
      Alert.alert(
        'Aviso',
        'Si ese correo está registrado, se ha dado acceso correctamente.'
      );
    } catch (error) {
      // Error genérico — no revela detalles internos
      Alert.alert('Error', 'No se pudo completar la operación');
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
          autoCorrect={false}
        />
        <TouchableOpacity
          style={commonStyles.button}
          onPress={handleAddPerson}
          disabled={searching}
        >
          <Text style={commonStyles.buttonText}>
            {searching ? 'Procesando...' : '+ Dar acceso'}
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

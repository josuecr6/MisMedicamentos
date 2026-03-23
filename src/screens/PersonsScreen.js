import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  limit,
} from 'firebase/firestore';
import Svg, { Path } from 'react-native-svg';

import { db, auth } from '../services/firebase';
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';

function TrashIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24">
      <Path
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        fill={COLORS.danger}
      />
    </Svg>
  );
}

function PersonCard({ item, onDelete }) {
  const initials = item.guestName
    ? item.guestName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={styles.personCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.guestName}</Text>
        <Text style={styles.personEmail}>{item.guestEmail}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        activeOpacity={0.7}
      >
        <TrashIcon />
      </TouchableOpacity>
    </View>
  );
}

export default function PersonsScreen() {
  const [persons, setPersons] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'sharedAccess'),
      where('ownerId', '==', auth.currentUser.uid),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPersons(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAddPerson = useCallback(async () => {
    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail) {
      Alert.alert('Error', 'Por favor ingresa un correo');
      return;
    }
    if (trimmedEmail === auth.currentUser.email) {
      Alert.alert('Error', 'No puedes agregarte a ti mismo');
      return;
    }
    try {
      setSearching(true);
      const q = query(
        collection(db, 'users'),
        where('emailNormalized', '==', trimmedEmail),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        Alert.alert('Error', 'No existe ningún usuario con ese correo');
        return;
      }
      const userFound = snapshot.docs[0].data();
      const alreadyAdded = persons.find((p) => p.guestId === userFound.uid);
      if (alreadyAdded) {
        Alert.alert('Error', 'Ya tienes acceso compartido con ese usuario');
        return;
      }

      const ownerDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const ownerName = ownerDoc.exists() ? ownerDoc.data().name : auth.currentUser.email;

      await setDoc(
        doc(db, 'sharedAccess', `${auth.currentUser.uid}_${userFound.uid}`),
        {
          ownerId: auth.currentUser.uid,
          ownerEmail: auth.currentUser.email,
          ownerName: ownerName,
          guestId: userFound.uid,
          guestEmail: userFound.email,
          guestName: userFound.name,
          createdAt: new Date(),
        }
      );
      setEmail('');
      Alert.alert('Éxito', `${userFound.name} ahora puede ver tus medicamentos`);
    } catch (error) {
      console.error('handleAddPerson error:', error.code, error.message);
      Alert.alert('Error', error.message || 'No se pudo agregar la persona');
    } finally {
      setSearching(false);
    }
  }, [email, persons]);

  const handleDeletePerson = useCallback((id) => {
    Alert.alert(
      'Quitar acceso',
      '¿Deseas quitar el acceso a esta persona?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => await deleteDoc(doc(db, 'sharedAccess', id)),
        },
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }) => <PersonCard item={item} onDelete={handleDeletePerson} />,
    [handleDeletePerson]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={commonStyles.container}>
      <Text style={styles.title}>Accesos compartidos</Text>
      <Text style={styles.subtitle}>
        Las personas agregadas pueden ver tus medicamentos en tiempo real
      </Text>

      {/* Formulario */}
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Correo del usuario</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@correo.com"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.addButton, searching && styles.addButtonDisabled]}
          onPress={handleAddPerson}
          disabled={searching}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>
            {searching ? 'Buscando...' : '+ Dar acceso'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 32 }} />
      ) : persons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Svg width="32" height="32" viewBox="0 0 24 24">
              <Path
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                fill={COLORS.surface}
              />
            </Svg>
          </View>
          <Text style={styles.emptyText}>Nadie tiene acceso aún</Text>
          <Text style={styles.emptyHint}>Agrega un correo arriba para compartir</Text>
        </View>
      ) : (
        <>
          <Text style={styles.listTitle}>
            {persons.length} {persons.length === 1 ? 'persona' : 'personas'} con acceso
          </Text>
          <FlatList
            data={persons}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 40,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 24,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 16,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent + '22',
    borderWidth: 1.5,
    borderColor: COLORS.accent + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  personEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,77,77,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Svg, { Path } from 'react-native-svg';

import { db, auth } from '../services/firebase';
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';
import MedicationCard from '../components/MedicationCard';
import useTodayKey from '../hooks/useTodayKey';
import useCurrentTime from '../hooks/useCurrentTime';

function LogoutIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24">
      <Path
        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
        fill={COLORS.textMuted}
      />
    </Svg>
  );
}

function LogoBadgePulse() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.logoWrapper}>
      <Text style={styles.logoMis}>Mis</Text>
      <Text style={styles.logoMedicamentos}>Medicamentos</Text>
      <View style={styles.badgeContainer}>
        <Animated.View
          style={[
            styles.badgePulse,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <View style={styles.badgeCore} />
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = useTodayKey();
  const now = useCurrentTime(30000);

  useEffect(() => {
    const q = query(
      collection(db, 'medications'),
      where('userId', '==', auth.currentUser.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((document) => ({ id: document.id, ...document.data() }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() ?? new Date(0);
            const dateB = b.createdAt?.toDate?.() ?? new Date(0);
            return dateB - dateA;
          });
        setMedications(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => await signOut(auth),
        },
      ]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <MedicationCard
        item={item}
        navigation={navigation}
        today={today}
        now={now}
      />
    ),
    [navigation, today, now]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <LogoBadgePulse />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogoutIcon />
        </TouchableOpacity>
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
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
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
    marginBottom: 24,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingRight: 24,
  },
  logoMis: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
    marginRight: 6,
  },
  logoMedicamentos: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: 0,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
  },
  badgeCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
  },
  emptyHint: {
    color: COLORS.surface,
    fontSize: 13,
    marginTop: 8,
  },
  list: {
    paddingBottom: 16,
  },
});

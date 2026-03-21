import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Detecta si estamos en Expo Go (donde las notificaciones push no funcionan desde SDK 53)
const isExpoGo = Constants.appOwnership === 'expo';

export async function requestPermissions() {
  // En Expo Go avisamos pero no bloqueamos el flujo
  if (isExpoGo) {
    console.log(
      '[Notifications] Expo Go detectado: las notificaciones push requieren un development build.'
    );
    return true; // Retornamos true para no bloquear el guardado del medicamento
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medicamentos', {
      name: 'Medicamentos',
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotification(medicationName, hour, minute) {
  // En Expo Go no intentamos programar, retornamos un id ficticio
  if (isExpoGo) {
    console.log(
      `[Notifications] Expo Go: no se programa notificación para "${medicationName}" a las ${hour}:${minute}`
    );
    return `mock_${Date.now()}`;
  }

  const trigger =
    Platform.OS === 'android'
      ? {
          type: 'daily',
          hour,
          minute,
          channelId: 'medicamentos',
        }
      : {
          hour,
          minute,
          repeats: true,
        };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de tu medicamento',
      body: `Es hora de tomar ${medicationName}`,
      sound: true,
    },
    trigger,
  });

  return id;
}

export async function cancelNotification(notificationId) {
  if (isExpoGo || !notificationId || notificationId.startsWith('mock_')) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications() {
  if (isExpoGo) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
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
  const trigger = Platform.OS === 'android'
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
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
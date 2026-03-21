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

export async function scheduleNotification(medicationName, hour, minute, selectedDays = []) {
  const ids = [];

  if (selectedDays.length === 0) {
    // Si no hay días seleccionados, programar diario como fallback
    const trigger = Platform.OS === 'android'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'medicamentos',
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          repeats: true,
        };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Hora de tu medicamento',
        body: `Es hora de tomar ${medicationName}`,
        sound: true,
      },
      trigger,
    });

    ids.push(id);
    return ids;
  }

  // Programar una notificación por cada día seleccionado
  // Expo usa: 1=Domingo, 2=Lunes, ..., 7=Sábado
  // Nuestra app usa: 0=Dom, 1=Lun, ..., 6=Sáb
  const expoWeekdayMap = {
    0: 1, // Domingo
    1: 2, // Lunes
    2: 3, // Martes
    3: 4, // Miércoles
    4: 5, // Jueves
    5: 6, // Viernes
    6: 7, // Sábado
  };

  for (const day of selectedDays) {
    const weekday = expoWeekdayMap[day];

    const trigger = Platform.OS === 'android'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
          channelId: 'medicamentos',
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
          repeats: true,
        };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Hora de tu medicamento',
        body: `Es hora de tomar ${medicationName}`,
        sound: true,
      },
      trigger,
    });

    ids.push(id);
  }

  return ids;
}

export async function cancelNotification(notificationId) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

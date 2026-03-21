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

    return [id];
  }

  const expoWeekdayMap = {
    0: 1,
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 6,
    6: 7,
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
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelNotifications(notificationIds = []) {
  const flatIds = notificationIds.flat().filter(Boolean);
  await Promise.all(flatIds.map(cancelNotification));
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

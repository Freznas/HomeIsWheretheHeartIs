import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Konfigurera hur notifikationer ska visas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [settings, setSettings] = useState({
    reminders: true,
    visitors: true,
    bills: true,
    chores: false,
  });
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Ladda inställningar från AsyncStorage
    loadSettings();

    // Registrera för push notifications
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Lyssna på notifikationer när appen är öppen
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Lyssna på användarens interaktion med notifikationen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('@notification_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('@notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  // Schemalägg en lokal notifikation
  const scheduleNotification = async ({ title, body, data, trigger, category }) => {
    // Kolla om den här typen av notifikationer är aktiverad
    if (!settings[category]) {
      console.log(`Notifications for ${category} are disabled`);
      return null;
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  // Skicka omedelbar notifikation
  const sendNotification = async ({ title, body, data, category }) => {
    if (!settings[category]) {
      console.log(`Notifications for ${category} are disabled`);
      return null;
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Omedelbar
      });
      return id;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  };

  // Avboka en specifik notifikation
  const cancelNotification = async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  // Avboka alla notifikationer
  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  };

  // Schemalägg påminnelse för kalender-event
  const scheduleEventReminder = async (event) => {
    const eventDate = new Date(event.date);
    const reminderDate = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1 timme innan

    if (reminderDate > new Date()) {
      return await scheduleNotification({
        title: `📅 ${event.title}`,
        body: `Om en timme: ${event.title}`,
        data: { type: 'event', eventId: event.id },
        trigger: { date: reminderDate },
        category: 'reminders',
      });
    }
    return null;
  };

  // Schemalägg påminnelse för besökare
  const scheduleVisitorReminder = async (visitor) => {
    const visitDate = new Date(visitor.date);
    const reminderDate = new Date(visitDate.getTime() - 30 * 60 * 1000); // 30 min innan

    if (reminderDate > new Date()) {
      return await scheduleNotification({
        title: `👋 Besökare på väg`,
        body: `${visitor.name} kommer om 30 minuter`,
        data: { type: 'visitor', visitorId: visitor.id },
        trigger: { date: reminderDate },
        category: 'visitors',
      });
    }
    return null;
  };

  // Schemalägg påminnelse för räkning
  const scheduleBillReminder = async (bill) => {
    const dueDate = new Date(bill.dueDate);
    const reminderDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000); // 1 dag innan

    if (reminderDate > new Date()) {
      return await scheduleNotification({
        title: `💰 Räkning förfaller snart`,
        body: `${bill.name} - ${bill.amount} kr förfaller imorgon`,
        data: { type: 'bill', billId: bill.id },
        trigger: { date: reminderDate },
        category: 'bills',
      });
    }
    return null;
  };

  // Schemalägg påminnelse för syssla
  const scheduleChoreReminder = async (chore) => {
    const dueDate = new Date(chore.dueDate);
    const reminderDate = new Date(dueDate.getTime() - 2 * 60 * 60 * 1000); // 2 timmar innan

    if (reminderDate > new Date()) {
      return await scheduleNotification({
        title: `✅ Glöm inte sysslan`,
        body: `${chore.task} ska göras om 2 timmar`,
        data: { type: 'chore', choreId: chore.id },
        trigger: { date: reminderDate },
        category: 'chores',
      });
    }
    return null;
  };

  const value = {
    expoPushToken,
    settings,
    updateSettings,
    scheduleNotification,
    sendNotification,
    cancelNotification,
    cancelAllNotifications,
    scheduleEventReminder,
    scheduleVisitorReminder,
    scheduleBillReminder,
    scheduleChoreReminder,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// Helper function för att registrera för push notifications
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
  
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push notification token:', token);
  } catch (error) {
    console.log('Error getting push token:', error);
  }

  return token;
}

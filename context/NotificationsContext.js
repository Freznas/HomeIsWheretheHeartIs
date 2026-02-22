import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as NavigationService from '../services/NavigationService';

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

export const NotificationsProvider = ({ children, userId, householdId }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [settings, setSettings] = useState({
    reminders: true,
    visitors: true,
    bills: true,
    chores: true,
    shopping: true,
    pantry: true,
  });
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Ladda inställningar från AsyncStorage
    loadSettings();

    // Registrera för push notifications och spara token
    registerForPushNotificationsAsync().then(async token => {
      if (token) {
        setExpoPushToken(token);
        // Spara token till Firebase om userId finns
        if (userId) {
          await savePushTokenToFirebase(userId, token);
        }
      }
    });

    // Lyssna på notifikationer när appen är öppen
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Lyssna på användarens interaktion med notifikationen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Navigera till rätt screen baserat på notification data
      const data = response.notification.request.content.data;
      
      if (data?.screen) {
        // Navigera till rätt skärm baserat på notification type
        handleNotificationNavigation(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userId]);

  // Hantera navigation från notifications
  const handleNotificationNavigation = (data) => {
    const { screen, type, ...params } = data;
    
    // Navigera till rätt skärm
    switch (screen) {
      case 'ShoppingListPage':
        NavigationService.navigate('ShoppingListPage', params);
        break;
      case 'BillsPage':
        NavigationService.navigate('BillsPage', params);
        break;
      case 'ChoresPage':
        NavigationService.navigate('ChoresPage', params);
        break;
      case 'CalendarPage':
        NavigationService.navigate('CalendarPage', params);
        break;
      case 'PantryPage':
        NavigationService.navigate('PantryPage', params);
        break;
      case 'CommunicationPage':
        NavigationService.navigate('CommunicationPage', params);
        break;
      default:
        // Om screen inte matchar, gå till Home
        NavigationService.navigate('Home');
    }
  };

  const savePushTokenToFirebase = async (uid, token) => {
    try {
      // Importera Firebase här för att undvika circular dependencies
      const { db } = await import('../config/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      await setDoc(doc(db, 'users', uid), {
        pushToken: token,
        deviceInfo: {
          platform: Platform.OS,
          isDevice: Device.isDevice,
          modelName: Device.modelName,
        },
        lastUpdated: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

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

  // Skicka push notification till andra användare i hushållet
  const sendPushToHousehold = async ({ title, body, data, excludeUserId }) => {
    if (!householdId) {
      return;
    }

    try {
      // Hämta alla användare i hushållet
      const { db } = await import('../config/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const membersQuery = query(
        collection(db, 'households', householdId, 'members'),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(membersQuery);
      const pushTokens = [];
      
      for (const doc of snapshot.docs) {
        const memberData = doc.data();
        if (memberData.userId !== excludeUserId && memberData.pushToken) {
          pushTokens.push(memberData.pushToken);
        }
      }
      
      // Skicka notifikationer via Expo Push API
      if (pushTokens.length > 0) {
        await sendExpoPushNotifications(pushTokens, { title, body, data });
      }
    } catch (error) {
      console.error('Error sending push to household:', error);
    }
  };

  const sendExpoPushNotifications = async (pushTokens, { title, body, data }) => {
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      
      const result = await response.json();
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
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
    notification,
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
    sendPushToHousehold,
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

  // Expo Go har begränsningar med push notifications
  if (!Device.isDevice) {
    return;
  }

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
    return;
  }
  
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  return token;
}

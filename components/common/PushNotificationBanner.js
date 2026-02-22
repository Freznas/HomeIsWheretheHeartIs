import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';

export default function PushNotificationBanner({ navigation }) {
  const { theme } = useTheme();
  const { expoPushToken } = useNotifications();

  if (expoPushToken) {
    // Token finns, allt är bra
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: '#FFF3CD', borderColor: '#FFC107' }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔔</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Push-notiser inaktiverade</Text>
          <Text style={styles.description}>
            Aktivera notiser för att få uppdateringar från ditt hushåll
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#FFC107' }]}
        onPress={() => navigation.navigate('NotificationSettings')}
      >
        <Text style={styles.buttonText}>Aktivera</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

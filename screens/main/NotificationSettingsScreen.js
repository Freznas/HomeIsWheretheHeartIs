import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import HeaderView from '../../components/common/HeaderView';

export default function NotificationSettingsScreen({ navigation }) {
  const { theme } = useTheme();
  const { settings, updateSettings, expoPushToken } = useNotifications();

  const toggleSetting = (key) => {
    updateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const notificationTypes = [
    {
      key: 'shopping',
      title: '🛒 Inköpslista',
      description: 'När någon lägger till eller tar bort varor',
    },
    {
      key: 'bills',
      title: '💰 Räkningar',
      description: 'Påminnelser när förfallodatum närmar sig',
    },
    {
      key: 'chores',
      title: '✅ Sysslor',
      description: 'När sysslor läggs till eller görs klara',
    },
    {
      key: 'visitors',
      title: '👥 Besökare',
      description: 'Påminnelser om kommande besök',
    },
    {
      key: 'pantry',
      title: '🥫 Skafferi',
      description: 'När varor läggs till eller tar slut',
    },
    {
      key: 'reminders',
      title: '⏰ Allmänna påminnelser',
      description: 'Kalenderhändelser och andra påminnelser',
    },
  ];

  return (
    <HeaderView title="Notiser" navigation={navigation}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Notifikationsinställningar
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Välj vilka typer av notiser du vill få från familjeappen
          </Text>
        </View>

        {notificationTypes.map((type) => (
          <View
            key={type.key}
            style={[styles.settingCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                {type.title}
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                {type.description}
              </Text>
            </View>
            <Switch
              value={settings[type.key] ?? true}
              onValueChange={() => toggleSetting(type.key)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={settings[type.key] ? theme.primary : theme.textSecondary}
            />
          </View>
        ))}

        {expoPushToken && (
          <View style={[styles.tokenCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.tokenTitle, { color: theme.text }]}>
              Push Token
            </Text>
            <Text style={[styles.tokenText, { color: theme.textSecondary }]} numberOfLines={2}>
              {expoPushToken}
            </Text>
            <Text style={[styles.tokenInfo, { color: theme.textSecondary }]}>
              (För utveckling och felsökning)
            </Text>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            ℹ️ Om notiser
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Push-notiser kräver en fysisk enhet och tillåtelser i systemets inställningar.
            {'\n\n'}
            Notiser skickas endast till andra medlemmar i ditt hushåll när du utför actions.
          </Text>
        </View>
      </ScrollView>
    </HeaderView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  tokenCard: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  tokenTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  tokenInfo: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  infoCard: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import HeaderView from '../../components/common/HeaderView';

export default function SupportScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();

  const openEmail = async () => {
    const email = 'hearthishome120@gmail.com';
    const subject = 'App Feedback';
    const body = '';
    
    // Funktion för att försöka öppna en specifik email-app
    const tryOpenEmailApp = async (appName, url) => {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return true;
        } else {
          // Försök öppna ändå, ibland fungerar det även om canOpenURL säger nej
          await Linking.openURL(url);
          return true;
        }
      } catch (error) {
        console.log(`Could not open ${appName}:`, error);
        toast.error(`${appName} finns inte installerad på denna enhet`);
        return false;
      }
    };

    // Visa valalternativ
    Alert.alert(
      '📧 Skicka Feedback',
      'Välj hur du vill skicka ditt meddelande:',
      [
        {
          text: 'Avbryt',
          style: 'cancel'
        },
        {
          text: '📋 Kopiera Email',
          onPress: async () => {
            await Clipboard.setStringAsync(email);
            toast.success('Email kopierad! 📋');
            Alert.alert(
              'Email kopierad',
              `${email}\n\nNu kan du klistra in den i din email-app.`,
              [{ text: 'OK' }]
            );
          }
        },
        {
          text: '✉️ Gmail',
          onPress: () => {
            const gmailUrl = `googlegmail://co?to=${email}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            tryOpenEmailApp('Gmail', gmailUrl);
          }
        },
        {
          text: '✉️ Outlook',
          onPress: () => {
            const outlookUrl = `ms-outlook://compose?to=${email}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            tryOpenEmailApp('Outlook', outlookUrl);
          }
        },
        {
          text: '✉️ Standard Email-app',
          onPress: () => {
            const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            tryOpenEmailApp('Standard Email-app', mailtoUrl);
          }
        }
      ]
    );
  };

  return (
    <HeaderView
      title={t('support.title')}
      navigation={navigation}
    >
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>🏠</Text>
          <Text style={[styles.title, { color: theme.text }]}>{t('support.appName')}</Text>
          <Text style={[styles.version, { color: theme.textSecondary }]}>{t('support.version')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>🚧 {t('support.inDevelopment')}</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            {t('support.inDevText')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>💬 {t('support.feedback')}</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            {t('support.feedbackText')}
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={openEmail}
          >
            <Text style={styles.buttonText}>📧 {t('support.sendFeedback')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>✨ {t('support.features')}</Text>
          <View style={styles.featureList}>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Hantera hushållssysslor och dela uppgifter</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Dela shoppinglistor och pantryvaror</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Håll koll på räkningar och förfallodatum</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Synkronisera kalenderhändelser</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Chatta med hushållsmedlemmar</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Registrera besökare</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Mörkt och ljust tema</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>📝 {t('support.upcomingFeatures')}</Text>
          <View style={styles.featureList}>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Personliga anteckningar</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Push-notifikationer för påminnelser</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Utgiftsdelning och statistik</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Återkommande händelser</Text>
            <Text style={[styles.featureItem, { color: theme.textSecondary }]}>• Fil- och bilddelning</Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            Tack för att du använder vår app! ❤️
          </Text>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            © 2025 Home Is Where The Heart Is
          </Text>
        </View>
      </ScrollView>
    </HeaderView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  icon: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

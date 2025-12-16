import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import HeaderView from '../../components/common/HeaderView';

export default function SupportScreen({ navigation }) {
  const { theme } = useTheme();

  const openEmail = () => {
    Linking.openURL('mailto:hearthishome120@gmail.com?subject=App Feedback');
  };

  return (
    <HeaderView
      title="Support & Info"
      onBackPress={() => navigation.goBack()}
      onProfilePress={() => navigation.navigate('Profile')}
      onSupportPress={() => navigation.navigate('Support')}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>🏠</Text>
        <Text style={[styles.title, { color: theme.text }]}>Home Is Where The Heart Is</Text>
        <Text style={[styles.version, { color: theme.textSecondary }]}>Version 1.0.0 (Beta)</Text>
      </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>🚧 App Under Utveckling</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            Denna app är fortfarande under aktiv utveckling. Vi jobbar kontinuerligt med att förbättra 
            funktionalitet, fixa buggar och lägga till nya funktioner för att göra din hushållshantering 
            så smidig som möjligt.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>💬 Din Feedback Uppskattas</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            Vi värdesätter din åsikt! Om du stöter på problem, har förslag på förbättringar eller vill 
            dela dina tankar om appen, tveka inte att kontakta oss. Din feedback hjälper oss att göra 
            appen bättre.
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={openEmail}
          >
            <Text style={styles.buttonText}>📧 Skicka Feedback</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>✨ Funktioner</Text>
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
          <Text style={[styles.cardTitle, { color: theme.text }]}>📝 Kommande Funktioner</Text>
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
    </HeaderView>
  );
}

const styles = StyleSheet.create({
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

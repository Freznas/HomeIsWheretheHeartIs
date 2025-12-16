import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createHousehold, joinHousehold } from '../../config/firebase';

export default function HouseholdSetupScreen({ navigation, route }) {
  const { userId, email } = route.params || {};
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Generera en 6-siffrig inbjudningskod
  const generateInviteCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Skapa nytt hushåll
  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Fel', 'Vänligen ange ett namn för ditt hushåll');
      return;
    }

    setLoading(true);
    try {
      // Använd email som displayName (tills vi har en profilsida)
      const displayName = email.split('@')[0];
      const result = await createHousehold(householdName.trim(), userId, email, displayName);

      if (!result.success) {
        Alert.alert('Fel', result.error || 'Kunde inte skapa hushåll. Försök igen.');
        return;
      }

      // Visa inbjudningskoden
      Alert.alert(
        '🎉 Hushåll skapat!',
        `Ditt hushåll "${householdName}" är nu skapat!\n\nInbjudningskod: ${result.household.inviteCode}\n\nDela denna kod med familjemedlemmar så de kan gå med.`,
        [
          {
            text: 'Fortsätt',
            onPress: () => {
              setShowCreateModal(false);
              navigation.replace('MainNavigator');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating household:', error);
      Alert.alert('Fel', 'Kunde inte skapa hushåll. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  // Gå med i befintligt hushåll
  const handleJoinHousehold = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      Alert.alert('Fel', 'Vänligen ange en giltig 6-siffrig inbjudningskod');
      return;
    }

    setLoading(true);
    try {
      // Använd email som displayName (tills vi har en profilsida)
      const displayName = email.split('@')[0];
      const result = await joinHousehold(inviteCode.trim(), userId, email, displayName);

      if (!result.success) {
        Alert.alert('Fel', result.error || 'Kunde inte gå med i hushållet. Försök igen.');
        return;
      }

      Alert.alert(
        '🎉 Välkommen!',
        `Du är nu med i hushållet "${result.household.name}"!`,
        [
          {
            text: 'Fortsätt',
            onPress: () => {
              setShowJoinModal(false);
              navigation.replace('MainNavigator');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error joining household:', error);
      Alert.alert('Fel', 'Kunde inte gå med i hushållet. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🏠</Text>
            <Text style={styles.title}>Välkommen hem!</Text>
            <Text style={styles.subtitle}>
              Nu är det dags att sätta upp ditt hushåll
            </Text>
          </View>

          {/* Option Cards */}
          <View style={styles.optionsContainer}>
            {/* Skapa nytt hushåll */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.optionIcon}>✨</Text>
              </View>
              <Text style={styles.optionTitle}>Skapa nytt hushåll</Text>
              <Text style={styles.optionDescription}>
                Starta ditt eget hushåll och bjud in familjemedlemmar
              </Text>
            </TouchableOpacity>

            {/* Gå med i befintligt */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setShowJoinModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.optionIcon}>🔑</Text>
              </View>
              <Text style={styles.optionTitle}>Gå med i befintligt hushåll</Text>
              <Text style={styles.optionDescription}>
                Har du en inbjudningskod? Gå med i ett befintligt hushåll
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal: Skapa nytt hushåll */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Skapa nytt hushåll</Text>
            <Text style={styles.modalSubtitle}>
              Ge ditt hushåll ett namn som alla känner igen
            </Text>

            <TextInput
              style={styles.input}
              placeholder="T.ex. Familjen Andersson"
              placeholderTextColor="#999"
              value={householdName}
              onChangeText={setHouseholdName}
              maxLength={30}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setShowCreateModal(false);
                  setHouseholdName('');
                }}
              >
                <Text style={styles.buttonSecondaryText}>Avbryt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleCreateHousehold}
                disabled={loading}
              >
                <Text style={styles.buttonPrimaryText}>
                  {loading ? 'Skapar...' : 'Skapa'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Gå med i hushåll */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gå med i hushåll</Text>
            <Text style={styles.modalSubtitle}>
              Ange den 6-siffriga inbjudningskoden du fått
            </Text>

            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor="#999"
              value={inviteCode}
              onChangeText={setInviteCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteCode('');
                }}
              >
                <Text style={styles.buttonSecondaryText}>Avbryt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleJoinHousehold}
                disabled={loading}
              >
                <Text style={styles.buttonPrimaryText}>
                  {loading ? 'Går med...' : 'Gå med'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionIcon: {
    fontSize: 40,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4ECDC4',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: '#F5F5F5',
  },
  buttonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

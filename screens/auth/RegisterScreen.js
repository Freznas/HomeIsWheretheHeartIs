import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const AVATARS = ['👤', '👨', '👩', '🧑', '👦', '👧', '👨‍💼', '👩‍💼', '👨‍🍳', '👩‍🍳', '👨‍🌾', '👩‍🌾'];
const ROLES = [
  { id: 'admin', label: 'Administratör', icon: '👑', description: 'Full åtkomst till allt' },
  { id: 'medlem', label: 'Familjemedlem', icon: '👥', description: 'Standard åtkomst' },
];

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const { register, loginWithGoogle, googleAuthRequest } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'medlem',
    avatar: '👤',
  });
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeExpiry, setCodeExpiry] = useState(null);
  const [verificationError, setVerificationError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleRegister = async () => {
    // Validering
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Fält saknas', 'Fyll i alla obligatoriska fält');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Lösenord matchar inte', 'Kontrollera att båda lösenorden är samma');
      return;
    }

    if (formData.password.length < 4) {
      Alert.alert('Svagt lösenord', 'Lösenordet måste vara minst 4 tecken');
      return;
    }

    // Skicka 2FA-kod till email
    setLoading(true);
    await sendVerificationCode();
    setLoading(false);
  };

  const sendVerificationCode = async () => {
    // Generera 6-siffrig kod
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    
    // Sätt utgångstid (5 minuter)
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);
    setCodeExpiry(expiry);
    
    try {
      const API_URL = __DEV__ ? 'http://172.20.10.4:3000' : 'https://your-api.com';
      
      const response = await fetch(`${API_URL}/api/auth/send-2fa-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          code: code,
          userId: 'registration-' + Date.now(),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowVerificationModal(true);
        setVerificationError('');
        // Starta cooldown för resend (60 sekunder)
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert('Fel', 'Kunde inte skicka verifieringskod. Försök igen.');
      }
    } catch (error) {
      console.error('Send verification error:', error);
      Alert.alert('Fel', 'Kunde inte skicka verifieringskod. Kontrollera din internetanslutning.');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Ange en 6-siffrig kod');
      return;
    }

    // Kolla om koden har gått ut
    if (codeExpiry && new Date() > codeExpiry) {
      setVerificationError('Koden har gått ut. Begär en ny kod.');
      return;
    }

    // Verifiera kod
    if (verificationCode !== generatedCode) {
      setVerificationError('Felaktig kod. Försök igen.');
      return;
    }

    // Kod är korrekt - skapa kontot
    setLoading(true);
    const result = await register({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      avatar: formData.avatar,
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Registrering misslyckades', result.error);
      setShowVerificationModal(false);
      return;
    }
    
    // Kod verifierad och konto skapat - navigera till hushållsinställning
    setShowVerificationModal(false);
    navigation.replace('HouseholdSetupScreen', {
      userId: result.user?.id,
      email: formData.email.trim().toLowerCase(),
    });
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setVerificationCode('');
    setVerificationError('');
    await sendVerificationCode();
  };
  
  const handleGoogleRegister = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    
    if (!result.success) {
      Alert.alert('Google-registrering misslyckades', result.error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.border }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Skapa konto</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Gå med i hushållet
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.cardBackground }]}>
            {/* Avatar Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Välj avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
                {AVATARS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar}
                    style={[
                      styles.avatarOption,
                      formData.avatar === avatar && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
                    ]}
                    onPress={() => setFormData({ ...formData, avatar })}
                  >
                    <Text style={styles.avatarEmoji}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Namn *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Ditt namn"
                placeholderTextColor={theme.textTertiary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="din@email.com"
                placeholderTextColor={theme.textTertiary}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Lösenord *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Minst 4 tecken"
                placeholderTextColor={theme.textTertiary}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Bekräfta lösenord *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Skriv lösenordet igen"
                placeholderTextColor={theme.textTertiary}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry
              />
            </View>

            {/* Role Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Roll</Text>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: theme.background,
                      borderColor: formData.role === role.id ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, role: role.id })}
                >
                  <Text style={styles.roleIcon}>{role.icon}</Text>
                  <View style={styles.roleInfo}>
                    <Text style={[styles.roleLabel, { color: theme.text }]}>{role.label}</Text>
                    <Text style={[styles.roleDescription, { color: theme.textSecondary }]}>
                      {role.description}
                    </Text>
                  </View>
                  {formData.role === role.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                { backgroundColor: theme.primary },
                loading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={[styles.registerButtonText, { color: theme.textInverse }]}>
                {loading ? 'Skapar konto...' : 'Skapa konto'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>eller</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>
            
            <TouchableOpacity
              style={[
                styles.googleButton,
                { backgroundColor: '#FFFFFF', borderColor: theme.border },
                (!googleAuthRequest || loading) && styles.registerButtonDisabled,
              ]}
              onPress={handleGoogleRegister}
              disabled={!googleAuthRequest || loading}
            >
              <Text style={styles.googleIcon}>🔴</Text>
              <Text style={styles.googleButtonText}>
                {!googleAuthRequest ? 'Google läser in...' : 'Registrera med Google'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 2FA Verification Modal */}
      {showVerificationModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Verifiera din email</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Vi har skickat en 6-siffrig kod till
            </Text>
            <Text style={[styles.modalEmail, { color: theme.primary }]}>
              {formData.email}
            </Text>

            <TextInput
              style={[
                styles.codeInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: verificationError ? theme.error : theme.border,
                },
              ]}
              placeholder="000000"
              placeholderTextColor={theme.textTertiary}
              value={verificationCode}
              onChangeText={(text) => {
                setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                setVerificationError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {verificationError ? (
              <Text style={[styles.errorText, { color: theme.error }]}>{verificationError}</Text>
            ) : null}

            {codeExpiry && (
              <Text style={[styles.expiryText, { color: theme.textSecondary }]}>
                Koden går ut om {Math.max(0, Math.ceil((codeExpiry - new Date()) / 60000))} minuter
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.verifyButton,
                { backgroundColor: theme.primary },
                loading && styles.registerButtonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              <Text style={[styles.verifyButtonText, { color: theme.textInverse }]}>
                {loading ? 'Verifierar...' : 'Verifiera och skapa konto'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={resendCooldown > 0}
            >
              <Text style={[styles.resendButtonText, { color: resendCooldown > 0 ? theme.textTertiary : theme.primary }]}>
                {resendCooldown > 0 ? `Skicka ny kod om ${resendCooldown}s` : 'Skicka ny kod'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowVerificationModal(false);
                setVerificationCode('');
                setVerificationError('');
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  avatarScroll: {
    marginBottom: 8,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  roleIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 24,
    color: '#4caf50',
  },
  registerButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    letterSpacing: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  expiryText: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  verifyButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

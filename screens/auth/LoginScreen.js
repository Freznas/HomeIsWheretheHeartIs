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
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { login, loginWithGoogle, googleAuthRequest, resetPassword } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('error.fieldsMissing'), t('error.fillRequired'));
      return;
    }

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
    }
  };
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    
    if (!result.success) {
      Alert.alert('Google-inloggning misslyckades', result.error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email krävs',
        'Ange din email-adress för att få en återställningslänk',
        [
          { text: 'OK' }
        ]
      );
      return;
    }

    Alert.alert(
      'Återställ lösenord',
      `Vill du få en återställningslänk skickad till ${email.trim()}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Skicka', 
          onPress: async () => {
            setLoading(true);
            const result = await resetPassword(email.trim().toLowerCase());
            setLoading(false);
            
            if (result.success) {
              toast.success(result.message);
              Alert.alert(
                'Email skickad!',
                'Kolla din inkorg och följ instruktionerna för att återställa ditt lösenord.',
                [{ text: 'OK' }]
              );
            } else {
              toast.error(result.error);
            }
          }
        },
      ]
    );
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
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🏠</Text>
            <Text style={[styles.title, { color: theme.text }]}>Välkommen hem</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Logga in för att fortsätta
            </Text>
          </View>

          {/* Login Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder={t('placeholder.email')}
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.text }]}>Lösenord</Text>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                    Glömt lösenord?
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder={t('placeholder.password')}
                placeholderTextColor={theme.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: theme.primary },
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={[styles.loginButtonText, { color: theme.textInverse }]}>
                {loading ? 'Loggar in...' : 'Logga in'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.googleButton,
                { backgroundColor: '#FFFFFF', borderColor: theme.border },
                (!googleAuthRequest || loading) && styles.loginButtonDisabled,
              ]}
              onPress={handleGoogleLogin}
              disabled={!googleAuthRequest || loading}
            >
              <Text style={styles.googleIcon}>🔴</Text>
              <Text style={styles.googleButtonText}>
                {!googleAuthRequest ? 'Google läser in...' : 'Fortsätt med Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>eller</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, { borderColor: theme.primary }]}
              onPress={() => navigation.navigate('RegisterScreen')}
            >
              <Text style={[styles.registerButtonText, { color: theme.primary }]}>
                Skapa nytt konto
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Login Helper (för testning) */}
          <View style={styles.helperSection}>
            <Text style={[styles.helperText, { color: theme.textTertiary }]}>
              Första gången? Skapa ett konto för att komma igång
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  registerButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

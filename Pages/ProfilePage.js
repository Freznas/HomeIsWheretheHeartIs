import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  StatusBar,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

export default function ProfilePage({ navigation }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentUser, updateProfile, logout, deleteUser } = useAuth();
  const { settings: notificationSettings, updateSettings: updateNotificationSettings, sendNotification, scheduleNotification } = useNotifications();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '👤');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [stats, setStats] = useState({ notes: 0, visitors: 0, chores: 0 });
  
  // Lösenordsbyte
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notifikationsinställningar hämtas från context
  
  // Språkinställningar
  const [language, setLanguage] = useState('sv'); // 'sv' eller 'en'
  
  // Toast-notifikationer
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-100)).current;
  
  // 2FA (Tvåfaktorsautentisering) - Email/SMS baserad
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser?.twoFactorEnabled || false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FAVerify, setShow2FAVerify] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(''); // Sparad kod för verifiering
  const [codeExpiry, setCodeExpiry] = useState(null); // När koden går ut
  const [pendingAction, setPendingAction] = useState(null); // 'password' eller 'delete'

  const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', '👨‍🍳', '👩‍🍳', '🧔', '👴'];

  // Ladda användarens statistik
  useEffect(() => {
    // TODO: Hämta riktig data från AsyncStorage när vi implementerar användarspecifik data
    // För nu visar vi placeholder-data
    setStats({
      notes: Math.floor(Math.random() * 10),
      visitors: Math.floor(Math.random() * 5),
      chores: Math.floor(Math.random() * 8),
    });
  }, []);
  
  // Visa toast-notifikation
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    
    // Animera in
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(toastTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Dölj efter 3 sekunder
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast({ visible: false, message: '', type: 'success' });
      });
    }, 3000);
  };
  
  // Generera 6-siffrig kod (skulle skickas via Email/SMS i produktion)
  const generate2FACode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  };
  
  // Verifiera 2FA-kod
  const verify2FACode = (inputCode) => {
    // Kolla om koden är giltig och inte utgången
    if (!generatedCode || !codeExpiry) return false;
    
    const now = new Date();
    if (now > codeExpiry) {
      showToast('❌ Koden har gått ut', 'error');
      return false;
    }
    
    return inputCode === generatedCode;
  };
  
  // Skicka 2FA-kod (via backend API)
  const send2FACode = async () => {
    const newCode = generate2FACode();
    setGeneratedCode(newCode);
    
    // Koden går ut efter 5 minuter
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);
    setCodeExpiry(expiry);
    
    try {
      // TODO: Byt till din server-URL när du deployar
      const API_URL = __DEV__ ? 'http://192.168.1.241:3000' : 'https://your-api.com';
      
      const response = await fetch(`${API_URL}/api/auth/send-2fa-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          code: newCode,
          userId: currentUser.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('📧 Kod skickad till din email!', 'success');
      } else {
        showToast(`❌ ${data.error}`, 'error');
        // Fallback: visa koden lokalt om API:et misslyckas (endast för development)
        if (__DEV__) {
          showToast(`📧 Demo-kod: ${newCode}`, 'info');
        }
      }
    } catch (error) {
      console.error('Send 2FA error:', error);
      showToast('❌ Kunde inte skicka kod', 'error');
      // Fallback: visa koden lokalt om API:et misslyckas (endast för development)
      if (__DEV__) {
        showToast(`📧 Demo-kod: ${newCode}`, 'info');
      }
    }
    
    return newCode;
  };
  
  // Aktivera 2FA
  const enable2FA = () => {
    // Skicka verifieringskod
    send2FACode();
    setShow2FASetup(true);
  };
  
  // Bekräfta 2FA-setup
  const confirm2FASetup = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      showToast('⚠️ Ange en 6-siffrig kod', 'warning');
      return;
    }
    
    if (verify2FACode(twoFactorCode)) {
      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setTwoFactorCode('');
      
      // TODO: Spara till backend/AsyncStorage
      // await updateProfile({ twoFactorEnabled: true });
      
      showToast('✅ 2FA aktiverat!', 'success');
    } else {
      showToast('❌ Fel kod, försök igen', 'error');
    }
  };
  
  // Inaktivera 2FA
  const disable2FA = () => {
    Alert.alert(
      'Inaktivera 2FA',
      'Är du säker på att du vill inaktivera tvåfaktorsautentisering?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Inaktivera',
          style: 'destructive',
          onPress: async () => {
            setTwoFactorEnabled(false);
            setGeneratedCode('');
            setCodeExpiry(null);
            
            // TODO: Uppdatera backend/AsyncStorage
            // await updateProfile({ twoFactorEnabled: false });
            
            showToast('🔓 2FA inaktiverat', 'info');
          },
        },
      ]
    );
  };
  
  // Verifiera 2FA för känslig operation
  const request2FAVerification = (action) => {
    if (twoFactorEnabled) {
      setPendingAction(action);
      send2FACode(); // Skicka ny kod
      setShow2FAVerify(true);
      return false; // Blockera åtgärd tills verifierad
    }
    return true; // Fortsätt direkt om 2FA inte aktiverat
  };
  
  // Bekräfta 2FA-verifiering
  const confirm2FAVerification = () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      showToast('⚠️ Ange en 6-siffrig kod', 'warning');
      return;
    }
    
    if (verify2FACode(twoFactorCode)) {
      setShow2FAVerify(false);
      setTwoFactorCode('');
      
      // Utför den väntande åtgärden
      if (pendingAction === 'password') {
        setShowPasswordModal(true);
      } else if (pendingAction === 'delete') {
        proceedWithAccountDeletion();
      }
      setPendingAction(null);
    } else {
      showToast('❌ Fel kod, försök igen', 'error');
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('⚠️ Namnet kan inte vara tomt', 'warning');
      return;
    }

    try {
      await updateProfile({ name: name.trim(), avatar: selectedAvatar });
      setIsEditing(false);
      showToast('✅ Profilen har uppdaterats!', 'success');
    } catch (error) {
      showToast('❌ ' + error.message, 'error');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logga ut',
      'Är du säker på att du vill logga ut?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Logga ut',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Home');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!request2FAVerification('delete')) {
      return; // Vänta på 2FA-verifiering
    }
    proceedWithAccountDeletion();
  };
  
  const proceedWithAccountDeletion = () => {
    Alert.alert(
      'Radera konto',
      'Är du säker på att du vill radera ditt konto? Detta kan inte ångras.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Radera',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(currentUser.id);
              showToast('✅ Konto raderat', 'success');
            } catch (error) {
              showToast('❌ ' + error.message, 'error');
            }
          },
        },
      ]
    );
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('⚠️ Alla fält måste fyllas i', 'warning');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Nya lösenordet matchar inte', 'warning');
      return;
    }
    
    if (newPassword.length < 6) {
      showToast('⚠️ Lösenordet måste vara minst 6 tecken', 'warning');
      return;
    }
    
    // TODO: Implementera lösenordsverifiering mot currentPassword
    // För nu gör vi bara en uppdatering
    
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('✅ Lösenordet har ändrats!', 'success');
  };

  const toggleNotification = (key) => {
    const newSettings = { ...notificationSettings, [key]: !notificationSettings[key] };
    updateNotificationSettings(newSettings);
    const status = newSettings[key] ? 'aktiverat' : 'inaktiverat';
    const labels = {
      reminders: 'Påminnelser',
      visitors: 'Besökare',
      bills: 'Räkningar',
      chores: 'Sysslor'
    };
    showToast(`🔔 ${labels[key]} ${status}`, 'info');
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    // TODO: Implementera faktisk språkbyte i hela appen
    showToast(`🌍 Språk ändrat till ${lang === 'sv' ? 'Svenska' : 'English'}`, 'info');
  };

  const testNotification = async () => {
    // Skicka omedelbar notifikation
    await sendNotification({
      title: '🔔 Test-notifikation',
      body: 'Detta är en test! Notifikationer fungerar korrekt.',
      data: { type: 'test' },
      category: 'reminders',
    });

    // Schemalägg en notifikation om 30 sekunder
    await scheduleNotification({
      title: '⏰ Schemalagd test',
      body: 'Denna notifikation schemalagdes för 30 sekunder sedan!',
      data: { type: 'test-scheduled' },
      trigger: { seconds: 30 },
      category: 'reminders',
    });

    showToast('📤 Test-notifikationer skickade!', 'info');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.headerBackground} 
      />
      
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerGreeting, { color: theme.headerText }]}>
              Min Profil
            </Text>
            <Text style={[styles.headerTitle, { color: theme.headerText }]}>
              {currentUser?.name}
            </Text>
          </View>
          <View style={styles.headerAvatarContainer}>
            <Text style={styles.headerAvatar}>{currentUser?.avatar || '👤'}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section with Gradient */}
        <LinearGradient
          colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarSection}
        >
          <TouchableOpacity
            onPress={() => isEditing && setShowAvatarPicker(true)}
            disabled={!isEditing}
          >
            <Text style={styles.avatarLarge}>{selectedAvatar}</Text>
          </TouchableOpacity>
          {isEditing && (
            <Text style={styles.avatarHint}>
              Tryck för att byta avatar
            </Text>
          )}
        </LinearGradient>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.statNumber}>{stats.notes}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Anteckningar</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.statNumber}>{stats.visitors}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Besökare</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.statNumber}>{stats.chores}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sysslor</Text>
          </View>
        </View>

        {/* User Info Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Namn</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { 
                  color: theme.text, 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border 
                }]}
                value={name}
                onChangeText={setName}
                placeholder="Ditt namn"
                placeholderTextColor={theme.textSecondary}
              />
            ) : (
              <Text style={[styles.infoText, { color: theme.text }]}>
                {currentUser?.name}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>E-post</Text>
            <Text style={[styles.infoText, { color: theme.text }]}>
              {currentUser?.email}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Roll</Text>
            <View style={[styles.roleBadge, { 
              backgroundColor: currentUser?.role === 'admin' ? '#FF6B6B' : '#4ECDC4' 
            }]}>
              <Text style={styles.roleText}>
                {currentUser?.role === 'admin' ? 'Admin' : 'Medlem'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Medlem sedan</Text>
            <Text style={[styles.infoText, { color: theme.text }]}>
              {new Date(currentUser?.createdAt).toLocaleDateString('sv-SE')}
            </Text>
          </View>
        </View>

        {/* Inställningar Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Inställningar</Text>
          
          {/* Test notifikationer */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={testNotification}
          >
            <Text style={[styles.settingLabel, { color: theme.text }]}>🔔 Testa notifikationer</Text>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
          
          {/* Lösenordsbyte */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => {
              if (!request2FAVerification('password')) {
                return; // Vänta på 2FA-verifiering
              }
              setShowPasswordModal(true);
            }}
          >
            <Text style={[styles.settingLabel, { color: theme.text }]}>🔑 Byt lösenord</Text>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
          
          {/* 2FA Inställning */}
          <View style={styles.settingGroup}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>🔐 Tvåfaktorsautentisering</Text>
                <Text style={[styles.setting2FADesc, { color: theme.textSecondary }]}>Extra säkerhet för känsliga ändringar</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggle, twoFactorEnabled && styles.toggleActive]}
                onPress={() => twoFactorEnabled ? disable2FA() : enable2FA()}
              >
                <View style={[styles.toggleThumb, twoFactorEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            {twoFactorEnabled && (
              <View style={[styles.twoFactorInfo, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                <Text style={[styles.twoFactorInfoText, { color: theme.text }]}>✅ 2FA är aktivt</Text>
                <Text style={[styles.twoFactorInfoDesc, { color: theme.textSecondary }]}>Du kommer att behöva ange en 6-siffrig kod för lösenordsbyte och kontoborttagning</Text>
              </View>
            )}
          </View>

          {/* Notifikationsinställningar */}
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: theme.text, marginBottom: 10 }]}>🔔 Notifikationer</Text>
            
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.textSecondary }]}>Påminnelser</Text>
              <TouchableOpacity 
                style={[styles.toggle, notificationSettings.reminders && styles.toggleActive]}
                onPress={() => toggleNotification('reminders')}
              >
                <View style={[styles.toggleThumb, notificationSettings.reminders && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.textSecondary }]}>Besökare</Text>
              <TouchableOpacity 
                style={[styles.toggle, notificationSettings.visitors && styles.toggleActive]}
                onPress={() => toggleNotification('visitors')}
              >
                <View style={[styles.toggleThumb, notificationSettings.visitors && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.textSecondary }]}>Räkningar</Text>
              <TouchableOpacity 
                style={[styles.toggle, notificationSettings.bills && styles.toggleActive]}
                onPress={() => toggleNotification('bills')}
              >
                <View style={[styles.toggleThumb, notificationSettings.bills && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.textSecondary }]}>Sysslor</Text>
              <TouchableOpacity 
                style={[styles.toggle, notificationSettings.chores && styles.toggleActive]}
                onPress={() => toggleNotification('chores')}
              >
                <View style={[styles.toggleThumb, notificationSettings.chores && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Språkinställningar */}
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: theme.text, marginBottom: 10 }]}>🌍 Språk</Text>
            <View style={styles.languageButtons}>
              <TouchableOpacity 
                style={[styles.languageButton, language === 'sv' && styles.languageButtonActive]}
                onPress={() => changeLanguage('sv')}
              >
                <Text style={[styles.languageButtonText, language === 'sv' && styles.languageButtonTextActive]}>🇸🇪 Svenska</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
                onPress={() => changeLanguage('en')}
              >
                <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>🇬🇧 English</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Spara ändringar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                onPress={() => {
                  setIsEditing(false);
                  setName(currentUser?.name || '');
                  setSelectedAvatar(currentUser?.avatar || '👤');
                }}
              >
                <Text style={[styles.buttonTextSecondary, { color: theme.text }]}>Avbryt</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Redigera profil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.buttonText}>Logga ut</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.buttonText}>Radera konto</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Lösenordsbyte Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPasswordModal(false)}
        >
          <View style={[styles.passwordModalContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Byt lösenord</Text>
            
            <TextInput
              style={[styles.passwordInput, { 
                color: theme.text, 
                backgroundColor: theme.inputBackground,
                borderColor: theme.border 
              }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Nuvarande lösenord"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
            />
            
            <TextInput
              style={[styles.passwordInput, { 
                color: theme.text, 
                backgroundColor: theme.inputBackground,
                borderColor: theme.border 
              }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nytt lösenord"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
            />
            
            <TextInput
              style={[styles.passwordInput, { 
                color: theme.text, 
                backgroundColor: theme.inputBackground,
                borderColor: theme.border 
              }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Bekräfta nytt lösenord"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.modalButtonText}>Ändra lösenord</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.border }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: theme.text }]}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        visible={show2FASetup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShow2FASetup(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setShow2FASetup(false);
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
              <View style={[styles.passwordModalContainer, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Aktivera 2FA</Text>
              <Text style={[styles.modal2FADesc, { color: theme.textSecondary }]}>En 6-siffrig kod har skickats till din email/telefon. Ange koden för att aktivera 2FA.</Text>
              
              <View style={[styles.codeDisplayBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                <Text style={styles.codeDisplayIcon}>📧</Text>
                <Text style={[styles.codeDisplayLabel, { color: theme.textSecondary }]}>Kod skickad till:</Text>
                <Text style={[styles.codeDisplayEmail, { color: theme.text }]}>{currentUser?.email}</Text>
              </View>
              
              <Text style={[styles.modal2FAHint, { color: theme.textSecondary }]}>Demo: Din kod är {generatedCode}</Text>
              
              <Text style={[styles.modal2FALabel, { color: theme.text }]}>Ange 6-siffrig kod:</Text>
              <TextInput
                style={[styles.twoFactorInput, { 
                  color: theme.text, 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border 
                }]}
                value={twoFactorCode}
                onChangeText={setTwoFactorCode}
                placeholder="000000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={confirm2FASetup}
                >
                  <Text style={styles.modalButtonText}>Aktivera 2FA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.border }]}
                  onPress={() => {
                    setShow2FASetup(false);
                    setTwoFactorCode('');
                  }}
                >
                  <Text style={[styles.modalButtonTextSecondary, { color: theme.text }]}>Avbryt</Text>
                </TouchableOpacity>
              </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* 2FA Verification Modal */}
      <Modal
        visible={show2FAVerify}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShow2FAVerify(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setShow2FAVerify(false);
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
              <View style={[styles.verify2FAModalContainer, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>🔐 Bekräfta identitet</Text>
              <Text style={[styles.modal2FADesc, { color: theme.textSecondary }]}>En 6-siffrig kod har skickats till din email. Ange koden för att fortsätta.</Text>
              
              <Text style={[styles.modal2FAHint, { color: theme.textSecondary }]}>Demo: Din kod är {generatedCode}</Text>
              
              <TextInput
                style={[styles.twoFactorInput, { 
                  color: theme.text, 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border 
                }]}
                value={twoFactorCode}
                onChangeText={setTwoFactorCode}
                placeholder="000000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={confirm2FAVerification}
                >
                  <Text style={styles.modalButtonText}>Bekräfta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.border }]}
                  onPress={() => {
                    setShow2FAVerify(false);
                    setTwoFactorCode('');
                    setPendingAction(null);
                  }}
                >
                  <Text style={[styles.modalButtonTextSecondary, { color: theme.text }]}>Avbryt</Text>
                </TouchableOpacity>
              </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarPicker(false)}
        >
          <View style={[styles.avatarPickerContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Välj avatar</Text>
            <View style={styles.avatarGrid}>
              {avatars.map((avatar) => (
                <TouchableOpacity
                  key={avatar}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar && styles.avatarOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedAvatar(avatar);
                    setShowAvatarPicker(false);
                  }}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Toast Notification */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
              backgroundColor:
                toast.type === 'success' ? '#4ECDC4' :
                toast.type === 'error' ? '#FF6B6B' :
                toast.type === 'warning' ? '#FFB347' :
                '#667eea',
            },
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerGreeting: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerAvatar: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 15,
    marginBottom: 20,
  },
  avatarLarge: {
    fontSize: 100,
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 14,
    color: '#FFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingArrow: {
    fontSize: 20,
  },
  settingGroup: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#4ECDC4',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#666',
  },
  languageButtonTextActive: {
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  passwordModalContainer: {
    width: '85%',
    borderRadius: 15,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  modalButtons: {
    marginTop: 10,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonPrimary: {
    backgroundColor: '#4ECDC4',
  },
  modalButtonSecondary: {
    borderWidth: 2,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    marginBottom: 5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 16,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#9B59B6',
  },
  editButton: {
    backgroundColor: '#4ECDC4',
  },
  saveButton: {
    backgroundColor: '#95E1D3',
  },
  cancelButton: {
    borderWidth: 2,
  },
  logoutButton: {
    backgroundColor: '#FFB347',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPickerContainer: {
    width: '80%',
    borderRadius: 15,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  avatarOption: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  avatarOptionText: {
    fontSize: 32,
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  setting2FADesc: {
    fontSize: 12,
    marginTop: 2,
  },
  twoFactorInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  twoFactorInfoText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  twoFactorInfoDesc: {
    fontSize: 12,
  },
  verify2FAModalContainer: {
    width: '85%',
    borderRadius: 15,
    padding: 24,
  },
  modal2FADesc: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeDisplayBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginVertical: 20,
  },
  codeDisplayIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  codeDisplayLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  codeDisplayEmail: {
    fontSize: 14,
    fontWeight: '600',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  qrEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  qrText: {
    fontSize: 14,
  },
  modal2FASecret: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  modal2FASecretCode: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
  },
  modal2FALabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  twoFactorInput: {
    fontSize: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  modal2FAHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

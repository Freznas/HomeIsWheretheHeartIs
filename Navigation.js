// STEG 1: Imports - Grundläggande React Native Navigation Setup
// ⚡ VIKTIGT: 'react-native-gesture-handler' MÅSTE vara först!
// Detta gör så att swipe-gester och gesture-baserad navigation fungerar korrekt
import 'react-native-gesture-handler';

// React core för att skapa komponenter
import React from 'react';

// React Navigation bibliotek - det mest populära navigationsbiblioteket för React Native
import { NavigationContainer } from '@react-navigation/native';  // "Roten" för all navigation
import { createStackNavigator } from '@react-navigation/stack';  // Skapar en stack (som en kortlek) av skärmar
import * as Linking from 'expo-linking';  // För deep linking

// Theme Context för dark mode
import { ThemeProvider } from './context/ThemeContext';
// Auth Context för användarhantering
import { AuthProvider, useAuth } from './context/AuthContext';
// Notifications Context för notifikationer
import { NotificationsProvider } from './context/NotificationsContext';
// Language Context för språkbyten
import { LanguageProvider } from './context/LanguageContext';
// Offline Context för offline support
import { OfflineProvider } from './context/OfflineContext';
// Toast Context för notifications
import { ToastProvider } from './context/ToastContext';
// Error Boundary för error handling
import ErrorBoundary from './components/common/ErrorBoundary';

// STEG 2: Importera alla sidor som ska vara navigerbara
// Varje import representerar en skärm som användaren kan navigera till
import App from './App';                    // Hemskärmen - första sidan användaren ser

// Auth screens
import LoginScreen from './screens/auth/LoginScreen';             // Inloggningssidan
import RegisterScreen from './screens/auth/RegisterScreen';       // Registreringssidan
import HouseholdSetupScreen from './screens/auth/HouseholdSetupScreen'; // Hushållsinställning

// Main screens
import PantryScreen from './screens/main/PantryScreen';           // Skafferisidan - hanterar mat i skafferiet
import CommunicationScreen from './screens/main/CommunicationScreen';  // Chat/kommunikationssidan
import ShoppingListScreen from './screens/main/ShoppingListScreen';    // Inköpslistsidan
import ChoresScreen from './screens/main/ChoresScreen';               // Sysslor/uppgifter sidan
import BillsScreen from './screens/main/BillsScreen';                 // Räkningar sidan
import NotesScreen from './screens/main/NotesScreen';                 // Anteckningar sidan
import VisitorsScreen from './screens/main/VisitorsScreen';           // Besökare sidan
import CalendarScreen from './screens/main/CalendarScreen';           // Kalender sidan
import WeatherScreen from './screens/main/WeatherScreen';             // Väder sidan
import ProfileScreen from './screens/main/ProfileScreen';             // Profilsidan
import NotificationSettingsScreen from './screens/main/NotificationSettingsScreen'; // Notification settings
import SupportScreen from './screens/main/SupportScreen';             // Support och info-sidan
import { navigationRef } from './services/NavigationService';         // Navigation service för deep linking

// STEG 3: Skapa Stack Navigator
// Stack = "hög av papper" - nya sidor läggs på toppen, kan "pop" tillbaka till föregående
const Stack = createStackNavigator();

// STEG 4: Huvudkomponent för Navigation
function NavigationContent() {
  const { isLoggedIn, isLoading, currentUser, householdId } = useAuth();

  if (isLoading) {
    return null; // Eller en loading screen
  }

  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? "Home" : "LoginScreen"}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      {isLoggedIn ? (
        // Inloggade användare ser huvudappen
        <>
        <Stack.Screen name="Home" component={App} />
        <Stack.Screen name="PantryPage" component={PantryScreen} />
        <Stack.Screen name="ShoppingListPage" component={ShoppingListScreen} />
        <Stack.Screen name="ChoresPage" component={ChoresScreen} />
        <Stack.Screen name="BillsPage" component={BillsScreen} />
        <Stack.Screen name="NotesPage" component={NotesScreen} />
        <Stack.Screen name="VisitorsPage" component={VisitorsScreen} />
        <Stack.Screen name="CommunicationPage" component={CommunicationScreen} />
        <Stack.Screen name="CalendarPage" component={CalendarScreen} />
        <Stack.Screen name="WeatherPage" component={WeatherScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="HouseholdSetupScreen" component={HouseholdSetupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Ej inloggade användare ser auth-skärmar
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="HouseholdSetupScreen" component={HouseholdSetupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const linking = {
    prefixes: ['homeisheart://', 'https://homeisheart.app'],
    config: {
      screens: {
        Home: '',
        ShoppingListPage: 'shopping',
        BillsPage: 'bills',
        ChoresPage: 'chores',
        CalendarPage: 'calendar',
        PantryPage: 'pantry',
        CommunicationPage: 'chat',
        Profile: 'profile',
        NotificationSettings: 'notifications',
      },
    },
  };

  return (
    // STEG 4.5: ThemeProvider och AuthProvider - Wrappa allt i contexts
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <OfflineProvider>
              <ToastProvider>
                <NavigationContainer ref={navigationRef} linking={linking}>
                  <NotificationsProviderWrapper />
                </NavigationContainer>
              </ToastProvider>
            </OfflineProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Wrapper för NotificationsProvider som behöver userId
function NotificationsProviderWrapper() {
  const { currentUser, householdId } = useAuth();
  
  return (
    <NotificationsProvider userId={currentUser?.id} householdId={householdId}>
      <NavigationContent />
    </NotificationsProvider>
  );
}

/*
📚 FÖRDELAR med denna navigation setup:
✅ Enkelt att lägga till nya sidor - bara importera och lägg till Stack.Screen  
✅ Automatisk tillbaka-knapp på Android
✅ Swipe-back gester på iOS (när gestureEnabled: true)
✅ State management - React Navigation håller reda på vilken sida som är aktiv
✅ Deep linking support - kan navigera till specifika sidor via URL:er
✅ Memory efficient - inaktiva sidor unmountas för att spara minne

❌ NACKDELAR:
❌ Extra bundle size - React Navigation är stort bibliotek (~200kb)
❌ Lärningskurva - många koncept att lära sig (stack, tab, drawer navigators)
❌ Kan bli komplext med nested navigators och avancerade patterns

🎯 ANVÄNDNING I APPEN:
- Varje sektion i App.js får navigation prop: <PantrySection navigation={navigation} />
- Sektioner använder: navigation.navigate("PantryPage") för att byta sida
- FAB-knappen använder: navigation.navigate("CommunicationPage") för chat
*/
// STEG 1: Imports - Grundläggande React Native Navigation Setup
// ⚡ VIKTIGT: 'react-native-gesture-handler' MÅSTE vara först!
// Detta gör så att swipe-gester och gesture-baserad navigation fungerar korrekt
import 'react-native-gesture-handler';

// React core för att skapa komponenter
import React from 'react';

// React Navigation bibliotek - det mest populära navigationsbiblioteket för React Native
import { NavigationContainer } from '@react-navigation/native';  // "Roten" för all navigation
import { createStackNavigator } from '@react-navigation/stack';  // Skapar en stack (som en kortlek) av skärmar

// Theme Context för dark mode
import { ThemeProvider } from './context/ThemeContext';
// Auth Context för användarhantering
import { AuthProvider, useAuth } from './context/AuthContext';
// Notifications Context för notifikationer
import { NotificationsProvider } from './context/NotificationsContext';

// STEG 2: Importera alla sidor som ska vara navigerbara
// Varje import representerar en skärm som användaren kan navigera till
import App from './App';                    // Hemskärmen - första sidan användaren ser
import PantryPage from './Pages/PantryPage';           // Skafferisidan - hanterar mat i skafferiet
import CommunicationPage from './Pages/CommunicationPage';  // Chat/kommunikationssidan
import ShoppingListPage from './Pages/ShoppingListPage';    // Inköpslistsidan
import ChoresPage from './Pages/ChoresPage';               // Sysslor/uppgifter sidan
import BillsPage from './Pages/BillsPage';                 // Räkningar sidan
import NotesPage from './Pages/NotesPage';                 // Anteckningar sidan
import VisitorsPage from './Pages/VisitorsPage';           // Besökare sidan
import CalendarPage from './Pages/CalendarPage';           // Kalender sidan
import WeatherPage from './Pages/WeatherPage';             // Väder sidan
import ProfilePage from './Pages/ProfilePage';             // Profilsidan
import LoginScreen from './Pages/LoginScreen';             // Inloggningssidan
import RegisterScreen from './Pages/RegisterScreen';       // Registreringssidan
import HouseholdSetupScreen from './Pages/HouseholdSetupScreen'; // Hushållsinställning

// STEG 3: Skapa Stack Navigator
// Stack = "hög av papper" - nya sidor läggs på toppen, kan "pop" tillbaka till föregående
const Stack = createStackNavigator();

// STEG 4: Huvudkomponent för Navigation
function NavigationContent() {
  const { isLoggedIn, isLoading } = useAuth();

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
        <Stack.Screen name="PantryPage" component={PantryPage} />
        <Stack.Screen name="ShoppingListPage" component={ShoppingListPage} />
        <Stack.Screen name="ChoresPage" component={ChoresPage} />
        <Stack.Screen name="BillsPage" component={BillsPage} />
        <Stack.Screen name="NotesPage" component={NotesPage} />
        <Stack.Screen name="VisitorsPage" component={VisitorsPage} />
        <Stack.Screen name="CommunicationPage" component={CommunicationPage} />
        <Stack.Screen name="CalendarPage" component={CalendarPage} />
        <Stack.Screen name="WeatherPage" component={WeatherPage} />
        <Stack.Screen name="ProfilePage" component={ProfilePage} />
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
  return (
    // STEG 4.5: ThemeProvider och AuthProvider - Wrappa allt i contexts
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          {/* STEG 5: NavigationContainer - MÅSTE wrappa all navigation
              Fungerar som en "manager" för all navigation i hela appen
              Håller reda på nuvarande skärm, navigation history, och hanterar deep links */}
          <NavigationContainer>
            <NavigationContent />
          </NavigationContainer>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
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
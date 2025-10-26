// STEG 1: Imports - Grundläggande React Native Navigation Setup
// ⚡ VIKTIGT: 'react-native-gesture-handler' MÅSTE vara först!
// Detta gör så att swipe-gester och gesture-baserad navigation fungerar korrekt
import 'react-native-gesture-handler';

// React core för att skapa komponenter
import React from 'react';

// React Navigation bibliotek - det mest populära navigationsbiblioteket för React Native
import { NavigationContainer } from '@react-navigation/native';  // "Roten" för all navigation
import { createStackNavigator } from '@react-navigation/stack';  // Skapar en stack (som en kortlek) av skärmar

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

// STEG 3: Skapa Stack Navigator
// Stack = "hög av papper" - nya sidor läggs på toppen, kan "pop" tillbaka till föregående
const Stack = createStackNavigator();

// STEG 4: Huvudkomponent för Navigation
export default function Navigation() {
  return (
    // STEG 5: NavigationContainer - MÅSTE wrappa all navigation
    // Fungerar som en "manager" för all navigation i hela appen
    // Håller reda på nuvarande skärm, navigation history, och hanterar deep links
    <NavigationContainer>
      
      {/* STEG 6: Stack.Navigator - Konfigurerar hur navigation ska fungera
          
          STEG 7: Registrera alla sidor som kan navigeras till
          - Varje Stack.Screen representerar en sida i appen
          - 'name' = det namnet som används i navigation.navigate("...")  
          - 'component' = vilken React-komponent som ska renderas
          
          📍 NAVIGATION FLÖDE:
          1. App startar → initialRouteName="Home" → App.js visas
          2. Användare trycker på sektion → navigation.navigate("PageName")
          3. React Navigation hittar Stack.Screen med matchande name
          4. Renderar motsvarande component
          5. Navigation stack: [Home, NewPage] (Home ligger under)
          6. Användare kan gå tillbaka via swipe eller tillbaka-knapp
      */}
      <Stack.Navigator
        initialRouteName="Home"        // Vilken skärm som visas först när appen startar
        screenOptions={{
          headerShown: false,          // Gömmer React Navigations inbyggda header
                                      // Vi använder våra egna anpassade headers istället
          gestureEnabled: true,        // Tillåter swipe-back gester (speciellt på iOS)
        }}
      >
        <Stack.Screen name="Home" component={App} />
        <Stack.Screen name="PantryPage" component={PantryPage} />
        <Stack.Screen name="ShoppingListPage" component={ShoppingListPage} />
        <Stack.Screen name="ChoresPage" component={ChoresPage} />
        <Stack.Screen name="BillsPage" component={BillsPage} />
        <Stack.Screen name="NotesPage" component={NotesPage} />
        <Stack.Screen name="VisitorsPage" component={VisitorsPage} />
        <Stack.Screen name="CommunicationPage" component={CommunicationPage} />
      </Stack.Navigator>
    </NavigationContainer>
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
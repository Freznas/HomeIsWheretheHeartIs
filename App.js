import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
} from "react-native";
import { PanGestureHandler, TapGestureHandler, State } from "react-native-gesture-handler";
import HeaderView from "./components/HeaderView";
import HighlightSection from "./Sections/HighlightSection";
import CalendarSection from "./Sections/CalendarSection";
import PantrySection from "./Sections/PantrySection";
import ShoppingListSection from "./Sections/ShoppingListSection";
import ChoresSection from "./Sections/ChoresSection";
import BillsSection from "./Sections/BillsSection";
import NotesSection from "./Sections/NotesSection";
import WeatherSection from "./Sections/WeatherSection";
import VisitorsSection from "./Sections/VisitorsSection";

// 📏 STEG 1: Hämta skärmens dimensioner för FAB positionering
// Dimensions.get("window") = aktuella skärmstorlek (uppdateras vid rotation)  
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function App({ navigation }) {
  // 🐛 Debug: Kontrollera att navigation prop når fram korrekt
  console.log("App component rendered with navigation:", !!navigation);

  // 📍 STEG 2: FAB position state - Ursprungsposition för Floating Action Button
  const originalFabX = screenWidth - 90;    // 90px från höger kant (fast position)
  const originalFabY = screenHeight * 0.7;  // 70% ner på skärmen (responsiv position)
  // 🎯 Dessa värden bestämmer var FAB:en börjar innan användaren draggar den

  // 🎬 STEG 3: Animated Values - Specialvärden för smooth 60fps animationer
  // useRef = värdet förändras INTE mellan re-renders (viktigt för performance)
  // Animated.Value = speciell typ som kan animeras utan JavaScript bridge
  const translateX = useRef(new Animated.Value(0)).current; // Horisontell förflyttning från original
  const translateY = useRef(new Animated.Value(0)).current; // Vertikal förflyttning från original
  // .current = faktiska värdet inne i ref:en

  // 🏃‍♂️ STEG 4: State för att hålla reda på drag-tillstånd
  const [isDragging, setIsDragging] = useState(false);  // Är användaren mitt i en drag-operation?
  const [hasMoved, setHasMoved] = useState(false);      // Har FAB:en flyttats mer än tröskelvärdet?
  // 🎯 Dessa förhindrar att TAP (öppna chat) triggas när användaren bara vill DRAG (flytta FAB)

  // 👆 STEG 5: Refs för gesture handlers - Behövs för att koordinera olika touch-typer
  const panRef = useRef();    // Referens till PanGestureHandler (drag-gester)
  const tapRef = useRef();    // Referens till TapGestureHandler (tap-gester)
  // 📚 simultaneousHandlers använder dessa för att tillåta tap OCH pan samtidigt

  const handleProfile = () => {
    console.log("Profile pressed");
  };

  // 🚀 STEG 6: Pan Gesture Event Handler - Realtids drag-hantering (60fps)
  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,  // Koppla native drag-delta direkt till vår animated value
          translationY: translateY,  // Detta ger 60fps utan att gå genom JavaScript bridge
        },
      },
    ],
    { 
      useNativeDriver: false,        // MÅSTE vara false för layout-properties (left, top, transform)
                                    // true = bara opacity/scale/rotation (men 60fps guaranteed)
      listener: (event) => {         // Extra JavaScript-logik som körs vid varje event
        const { translationX: x, translationY: y } = event.nativeEvent;
        
        // 📏 Tröskelvärde: Har FAB:en rört sig mer än 8px från startposition?
        if (Math.abs(x) > 8 || Math.abs(y) > 8) {
          if (!hasMoved) {
            setHasMoved(true);        // Markera att en riktig drag har påbörjats
            setIsDragging(true);      // Sätt drag-flagga (förhindrar tap-event)
          }
        }
        // 🎯 8px tröskelvärde = skillnad mellan avsiktlig drag och oavsiktlig fingerrörelse
      }
    }
  );
  // ⚡ Animated.event = direkt koppling native ↔ Animated.Value = 60fps performance

  // 🔄 STEG 7: Pan State Change Handler - Hanterar start/slut av drag-operationer
  const onPanHandlerStateChange = (event) => {
    const { state } = event.nativeEvent;
    
    // 🟢 DRAG BÖRJAR (finger touchar FAB:en)
    if (state === State.BEGAN) {
      setHasMoved(false);           // Reset rörelse-flagga för ny drag-operation
      
      // 📍 extractOffset() = "nuvarande position blir ny utgångspunkt (0,0)"
      translateX.extractOffset();   // Ta nuvarande translateX och gör det till offset
      translateY.extractOffset();   // Nästa drag börjar från denna position istället för original
      // 🎯 Utan extractOffset skulle FAB hoppa tillbaka till original vid varje ny drag
      
    // 🔴 DRAG SLUTAR (finger lyfts eller gesture avbryts)
    } else if (state === State.END || state === State.CANCELLED) {
      
      // 💾 flattenOffset() = "kom ihåg nuvarande position permanent"
      translateX.flattenOffset();   // Gör offset + value till ett enda värde
      translateY.flattenOffset();   // Nu är denna position FAB:ens nya "hem"
      // 📚 flattenOffset gör så position inte glöms bort mellan drag-operationer
      
      // 🎯 FAB:en stannar bara där användaren släpper den - ingen automatisk återställning!
      // (Vi tog bort all logik för att snäppa till kanter eller återgå till original)
      
      // ⏰ Reset state efter kort delay (förhindrar race conditions)
      setTimeout(() => {
        setIsDragging(false);       // Tillåt tap-events igen
        setHasMoved(false);         // Reset rörelse-flagga
      }, 100);
    }
  };
  
  /* 📚 VIKTIGA KONCEPT:
     extractOffset() vs flattenOffset():
     - extractOffset() = "börja mäta från nuvarande position" 
     - flattenOffset() = "spara nuvarande position permanent"
     
     Utan dessa skulle FAB:en "studsa tillbaka" till original efter varje drag!
  */

  // 👆 STEG 8: Tap Gesture Handler - Skiljer mellan TAP (öppna chat) och DRAG (flytta FAB)
  const onTapHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      console.log("TAP detected, isDragging:", isDragging, "hasMoved:", hasMoved);
      
      // 🎯 SMART LOGIC: Endast navigera om det INTE är en drag-operation
      if (!isDragging && !hasMoved) {
        console.log("Navigating to CommunicationPage");
        
        // 🛡️ Safety check: Kontrollera att navigation prop finns
        if (navigation) {
          navigation.navigate("CommunicationPage");  // 💬 Öppna chat-sidan
        } else {
          console.error("Navigation is not available");
        }
      }
      // 🚫 Om isDragging=true eller hasMoved=true → Ignorera tap (användaren ville bara flytta FAB)
    }
  };
  
  /* 🧠 INTELLIGENT GESTURE DETECTION:
     Problemet: Användaren kan vilja både TAPPA (öppna chat) OCH DRAGGA (flytta FAB)
     Lösningen: 
     - Pan och Tap kör simultant (simultaneousHandlers)
     - Pan sätter isDragging=true vid rörelse > 8px  
     - Tap kollar flaggor innan navigation
     - Resultat: Tap fungerar bara om INGEN drag skedde
  */

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3949ab" />
        
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerGreeting}>Hej, välkommen hem!</Text>
              <Text style={styles.headerTitle}>Mitt Hushåll</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionsGrid}>
            <View style={styles.gridRow}>
              <View style={styles.fullWidth}>
                <HighlightSection navigation={navigation} />
              </View>
            </View>
            
            <View style={styles.gridRow}>
              <View style={styles.halfWidth}>
                <CalendarSection navigation={navigation} />
              </View>
              <View style={styles.halfWidth}>
                <WeatherSection navigation={navigation} />
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.halfWidth}>
                <PantrySection navigation={navigation} />
              </View>
              <View style={styles.halfWidth}>
                <ShoppingListSection navigation={navigation} />
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.halfWidth}>
                <ChoresSection navigation={navigation} />
              </View>
              <View style={styles.halfWidth}>
                <BillsSection navigation={navigation} />
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.halfWidth}>
                <NotesSection navigation={navigation} />
              </View>
              <View style={styles.halfWidth}>
                <VisitorsSection navigation={navigation} />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* 💬 STEG 9: Draggable FAB - Floating Action Button som kan dras runt skärmen */}
      
      {/* 🖼️ FAB Overlay - Invisible fullscreen layer som fångar touch events */}
      <View style={styles.fabOverlay} pointerEvents="box-none">
        {/* pointerEvents="box-none" = denna View blockerar INTE touch events
            Touch events "faller igenom" till underliggande komponenter
            Men FAB:en inuti kan fortfarande ta emot touch */}
        
        {/* 👆 STEG 10: TapGestureHandler - Yttre handler för tap-gester (öppna chat) */}
        <TapGestureHandler
          ref={tapRef}                                    // Referens för simultaneousHandlers
          onHandlerStateChange={onTapHandlerStateChange}  // När tap-state ändras (började/slutade)
          simultaneousHandlers={panRef}                   // Kan köras samtidigt som PanGestureHandler
        >
          {/* 🔄 STEG 11: PanGestureHandler - Inre handler för drag-gester (flytta FAB) */}
          <PanGestureHandler
            ref={panRef}                                  // Referens för simultaneousHandlers  
            onGestureEvent={onPanGestureEvent}            // Realtids drag events (60fps)
            onHandlerStateChange={onPanHandlerStateChange}// När drag-state ändras (började/slutade)
            simultaneousHandlers={tapRef}                 // Kan köras samtidigt som TapGestureHandler
            minDist={8}                                   // Minsta distance för att trigga pan (8px tröskelvärde)
          >
            {/* 🎬 STEG 12: Animated.View - Själva FAB:en som animeras smooth */}
            <Animated.View
              style={[
                styles.fabContainer,                      // Bas-styling (storlek, position)
                {
                  left: originalFabX,                     // Fast startposition X (screenWidth - 90)
                  top: originalFabY,                      // Fast startposition Y (screenHeight * 0.7)
                  transform: [                            // Animated transforms (flyttar FAB från originalpos)
                    { translateX: translateX },           // Horisontell förflyttning (draggar åt sidan)
                    { translateY: translateY },           // Vertikal förflyttning (draggar upp/ner)
                  ],
                  /* 🎯 SLUTLIG POSITION = original + transform
                     Faktisk X = originalFabX + translateX.value
                     Faktisk Y = originalFabY + translateY.value */
                },
              ]}
            >
              {/* 🎨 STEG 13: FAB Button - Visuell design av knappen */}
              <View style={styles.fabButton}>
                <Text style={styles.fabIcon}>💬</Text>   {/* Chat emoji som ikon */}
              </View>
            </Animated.View>
          </PanGestureHandler>
        </TapGestureHandler>
      </View>
      
      {/* 🏗️ ARKITEKTUR FÖRKLARING:
          
          fabOverlay (fullscreen invisible)
          └── TapGestureHandler (fångar taps)
              └── PanGestureHandler (fångar drags)  
                  └── Animated.View (FAB som rör sig)
                      └── View (visuell knapp med emoji)
          
          📱 ANVÄNDARINTERAKTION:
          1. Användare rör FAB → Både Pan och Tap börjar lyssna
          2. Rörelse under 8px → Pan ignoreras, Tap aktiveras → Öppna chat
          3. Rörelse över 8px → Pan aktiveras, Tap blockeras → Flytta FAB
          4. Användare släpper → Pan slutar, FAB stannar där den är
      */}
    </>
  );
}

// Samma styles...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#3949ab",
    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerGreeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: {
    fontSize: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionsGrid: {
    gap: 16,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  fullWidth: {
    flex: 1,
  },
  halfWidth: {
    flex: 1,
  },
  
  // 🎨 STEG 14: FAB Styling - Definiera utseende och beteende
  
  // 📱 FAB Overlay - Invisible fullscreen layer för gesture handling
  fabOverlay: {
    position: "absolute",         // Flyter över allt annat innehåll
    top: 0,                      // Täcker hela skärmen från topp
    left: 0,                     // till vänster
    right: 0,                    // till höger  
    bottom: 0,                   // till botten
    zIndex: 9999,                // Högsta z-index (iOS) - framför allt annat
    elevation: 9999,             // Högsta elevation (Android) - framför allt annat
    // 🎯 Denna layer fångar touch events men är osynlig (pointerEvents="box-none")
  },
  
  // 📍 FAB Container - Positionering och storlek av FAB:en
  fabContainer: {
    position: "absolute",        // Kan placeras var som helst på skärmen
    width: 60,                   // Bredd 60px (standard Material Design FAB)
    height: 60,                  // Höjd 60px (perfekt cirkel när borderRadius=30)
    // 🎯 Faktisk position bestäms av left/top + transform i JSX
  },
  
  // 🎨 FAB Button - Visuell design av själva knappen
  fabButton: {
    width: 60,                   // Samma som container (fyller hela området)
    height: 60,                  
    borderRadius: 30,            // Perfekt cirkel (60/2 = 30px radius)
    backgroundColor: "#00acc1",  // Cyan färg (Material Design accent color)
    
    // 📐 Flexbox för att centrera innehåll (emoji)
    justifyContent: "center",    // Centrera vertikalt
    alignItems: "center",        // Centrera horisontellt
    
    // 🌟 Skuggor för djup-känsla (Material Design elevation)
    elevation: 20,               // Android skugga (hög värde = flyter högt)
    shadowColor: "#000",         // iOS skugga färg (svart)
    shadowOffset: { width: 0, height: 8 },  // iOS skugga position (8px nedåt)
    shadowOpacity: 0.6,          // iOS skugga genomskinlighet (60%)
    shadowRadius: 16,            // iOS skugga oskärpa (16px blur)
    
    // 🎨 Vit kant runt knappen för att separera från bakgrund
    borderWidth: 3,              // Tjocklek på kant
    borderColor: "#ffffff",      // Vit färg på kant
  },
  
  // 💬 FAB Icon - Styling för emoji/text inne i knappen
  fabIcon: {
    fontSize: 24,                // Stor emoji (24px)
    color: "#fff",               // Vit färg (syns bra mot cyan bakgrund)
    // 🎯 Emoji renderas som text, så vi kan använda color och fontSize
  },
  
  /* 📚 DESIGN PRINCIPER:
     ✅ Material Design FAB standard (60x60px, rund, skugga)
     ✅ Hög z-index/elevation (flyter över allt innehåll)
     ✅ Cyan färg (#00acc1) för att sticka ut från blå header
     ✅ Vit kant för att separera från färgad bakgrund
     ✅ Stor emoji för tydlig indikation (chat-funktion)
     
     🎯 PLATTFORMSSKILLNADER:
     - iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius
     - Android: elevation (enklare men mindre kontroll)
     - Båda: borderRadius, backgroundColor fungerar likadant
  */
});

/*
🎯 FULLSTÄNDIGT FAB FLÖDE - Steg för steg sammanfattning:

📱 1. APP STARTAR:
   └── originalFabX/Y beräknas baserat på skärmstorlek
   └── translateX/Y sätts till 0 (FAB börjar på originalposition)
   └── State: isDragging=false, hasMoved=false

👆 2. ANVÄNDARE RÖREDER FAB:
   └── Både TapGestureHandler och PanGestureHandler börjar lyssna (simultant)
   └── Pan State.BEGAN → extractOffset() (nuvarande pos blir ny utgångspunkt)

🔄 3. UNDER DRAGGING:
   └── onPanGestureEvent körs 60 gånger/sekund
   └── translationX/Y uppdateras direkt via Animated.event (60fps)
   └── FAB följer fingert i realtid
   └── Om rörelse över 8px → setHasMoved(true), setIsDragging(true)

🎯 4. GESTURE DETECTION:
   └── TapGestureHandler State.END → Kolla flaggor
   └── Om NOT isDragging AND NOT hasMoved → navigation.navigate("CommunicationPage")
   └── Annars ignorera tap (användaren ville bara dragga)

🛑 5. DRAG SLUTAR:
   └── Pan State.END → flattenOffset() (position blir permanent)
   └── FAB stannar där användaren släppte den (ingen auto-reset)
   └── Reset state: isDragging=false, hasMoved=false efter 100ms

🎨 6. RENDERING LOOP:
   └── Animated.View använder transform: [translateX, translateY]
   └── Final position = originalPos + transform
   └── 60fps smooth animation utan JavaScript bridge

⚡ VIKTIGA TEKNISKA DETALJER:
- useRef förhindrar re-renders när animated values ändras
- extractOffset/flattenOffset håller position mellan drag-operationer  
- simultaneousHandlers tillåter tap och pan samtidigt
- useNativeDriver=false krävs för layout transforms
- minDist=8 förhindrar oavsiktlig pan från små fingerrörelser
- pointerEvents="box-none" låter touch gå igenom overlay men fångas av FAB

✅ FÖRDELAR:
- Silky smooth 60fps animationer
- Intelligent gesture separation (tap vs drag)
- Persistent positioning (FAB "kommer ihåg" var den placerades)
- Material Design compliant
- Cross-platform (iOS + Android)

❌ NACKDELAR:
- Komplex setup (många moving parts)
- Kräver djup förståelse av Animated API
- Platform-specific shadow styling
- Kan blockera andra touch events om inte konfigurerad rätt
*/
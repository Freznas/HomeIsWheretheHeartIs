import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationsContext';
import { getUserHousehold, subscribeToCalendar } from '../../config/firebase';

export default function HighlightSection({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { scheduleEventReminder } = useNotifications();
  
  const scrollViewRef = useRef(null);
  const currentIndexRef = useRef(0);
  const [localEvents, setLocalEvents] = useState([]);
  const [scheduledEventKeys, setScheduledEventKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Ladda scheduledEventKeys från AsyncStorage när komponenten mountas
  useEffect(() => {
    const loadScheduledEvents = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const stored = await AsyncStorage.getItem('scheduled_event_notifications');
        if (stored) {
          setScheduledEventKeys(new Set(JSON.parse(stored)));
        }
      } catch (error) {
        console.error('Error loading scheduled events:', error);
      }
    };
    loadScheduledEvents();
  }, []);

  // Spara scheduledEventKeys till AsyncStorage när det ändras
  const saveScheduledEventKey = async (eventKey) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const newKeys = new Set([...scheduledEventKeys, eventKey]);
      setScheduledEventKeys(newKeys);
      await AsyncStorage.setItem('scheduled_event_notifications', JSON.stringify([...newKeys]));
    } catch (error) {
      console.error('Error saving scheduled event key:', error);
    }
  };

  // 🔥 Firebase - Hämta kalenderhändelser
  useEffect(() => {
    let unsubscribe;

    const loadData = async () => {
      if (!currentUser?.id) return;

      try {
        const result = await getUserHousehold(currentUser.id);
        
        if (result.success && result.householdId) {
          unsubscribe = subscribeToCalendar(result.householdId, (response) => {
            if (response.success) {
              // Filtrera endast användarskapade händelser
              const userEvents = (response.events || []).filter(e => e.isFromPhone !== true);
              setLocalEvents(userEvents);
              setLoading(false);
              
              // Schemalägg notifikationer för kommande events inom 24 timmar
              const now = new Date();
              const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              
              userEvents.forEach(event => {
                const eventDate = new Date(event.date);
                const eventKey = `${event.id || event.title}-${event.date}`;
                
                if (eventDate > now && eventDate <= twentyFourHoursFromNow && !scheduledEventKeys.has(eventKey)) {
                  scheduleEventReminder(event).then(notificationId => {
                    if (notificationId) {
                      saveScheduledEventKey(eventKey);
                    }
                  });
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Error loading calendar events:', error);
      }
    };

    loadData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, scheduledEventKeys]);

  // Hämta kommande händelser (nästa 7 dagar)
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Nollställ tid för korrekt datumjämförelse
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    
    return localEvents
      .filter(event => {
        // Filtrera bort telefon-synkade händelser (Lucia, Nobeldagen, etc.)
        if (event.isFromPhone === true) return false;
        
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate >= today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5); // Max 5 händelser
  };

  // Formatera datum till läsbar text
  const formatEventDate = (dateStr) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Jämför bara datum, inte tid
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (eventDateOnly.getTime() === todayOnly.getTime()) {
      return "Idag";
    } else if (eventDateOnly.getTime() === tomorrowOnly.getTime()) {
      return "Imorgon";
    } else {
      const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
      return dayNames[eventDate.getDay()];
    }
  };

  const upcomingEvents = getUpcomingEvents();

  // Auto-scroll funktionalitet
  useEffect(() => {
    if (upcomingEvents.length <= 1) return; // Ingen auto-scroll om bara 1 eller 0 händelser

    const interval = setInterval(() => {
      if (scrollViewRef.current) {
        currentIndexRef.current = (currentIndexRef.current + 1) % upcomingEvents.length;
        const scrollX = currentIndexRef.current * 272; // 260px kort + 12px margin
        
        scrollViewRef.current.scrollTo({
          x: scrollX,
          animated: true,
        });
      }
    }, 4000); // Byt var 4:e sekund

    return () => clearInterval(interval);
  }, [upcomingEvents.length]);

  // Reset scroll position när händelser ändras
  useEffect(() => {
    currentIndexRef.current = 0;
  }, [localEvents]);

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>📅</Text>
        <Text style={[styles.title, { color: theme.text }]}>{t('home.upcomingEvents')}</Text>
        <TouchableOpacity 
          onPress={() => navigation?.navigate("CalendarPage")}
          style={styles.seeAllButton}
        >
          <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{t('home.loadingEvents')}</Text>
        </View>
      ) : upcomingEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>🗓️ {t('home.noEvents')}</Text>
          <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>{t('home.addEvent')}</Text>
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          decelerationRate="fast"
          snapToInterval={272}
          snapToAlignment="start"
          pagingEnabled={false}
          onScrollBeginDrag={() => {
            // Pausa auto-scroll när användaren börjar scrolla manuellt
            if (scrollViewRef.current) {
              currentIndexRef.current = Math.round(
                (scrollViewRef.current.contentOffset?.x || 0) / 272
              );
            }
          }}
        >
          {upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, { backgroundColor: theme.inputBackground, borderLeftColor: theme.primary }]}
              onPress={() => navigation?.navigate("CalendarPage")}
              activeOpacity={0.7}
            >
              <View style={styles.eventHeader}>
                <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={2}>
                  {event.title}
                </Text>
                <View style={[styles.dateBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.dateText}>
                    {formatEventDate(event.date)}
                  </Text>
                </View>
              </View>
              
              {event.time && (
                <View style={styles.timeContainer}>
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={[styles.timeText, { color: theme.primary }]}>{event.time}</Text>
                </View>
              )}
              
              {event.description && (
                <Text style={[styles.eventDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                  {event.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3949ab",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  scrollContainer: {
    paddingRight: 20,
  },
  eventCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 260,
    minHeight: 120,
    borderLeftWidth: 4,
    borderLeftColor: "#3949ab",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  dateBadge: {
    backgroundColor: "#3949ab",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 50,
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeText: {
    fontSize: 14,
    color: "#3949ab",
    fontWeight: "600",
  },
  eventDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
});

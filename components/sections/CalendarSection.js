import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserHousehold, subscribeToCalendar } from '../../config/firebase';

export default function CalendarSection({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [userEventCount, setUserEventCount] = useState(0);
  const [nextEvent, setNextEvent] = useState(null);

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
              setUserEventCount(userEvents.length);

              // Hitta nästa kommande användarskapade händelse
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const upcomingEvents = userEvents
                .filter(event => {
                  const eventDate = new Date(event.date);
                  return eventDate >= today;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));

              setNextEvent(upcomingEvents.length > 0 ? upcomingEvents[0] : null);
            } else {
              setUserEventCount(0);
              setNextEvent(null);
            }
          });
        }
      } catch (error) {
        console.error('CalendarSection: Error loading calendar:', error);
      }
    };

    loadData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    return { day, month };
  };

  const displayDate = nextEvent ? formatDate(nextEvent.date) : { day: new Date().getDate(), month: new Date().toLocaleString('sv-SE', { month: 'short' }) };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]} 
      activeOpacity={0.8}
      onPress={() => navigation?.navigate("CalendarPage")}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>📅</Text>
        <Text style={[styles.title, { color: theme.text }]}>Kalender</Text>
      </View>
      <View style={styles.dateContainer}>
        <Text style={[styles.day, { color: theme.primary }]}>{displayDate.day}</Text>
        <Text style={[styles.month, { color: theme.textSecondary }]}>{displayDate.month}</Text>
      </View>
      <Text style={[styles.eventCount, { color: theme.textTertiary }]}>
        {userEventCount > 0 
          ? `${userEventCount} ${userEventCount === 1 ? 'händelse' : 'händelser'}`
          : 'Inga händelser'}
      </Text>
      {nextEvent && (
        <Text style={[styles.nextEvent, { color: theme.text }]} numberOfLines={1}>
          {nextEvent.title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    height: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dateContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  day: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3949ab",
    lineHeight: 36,
  },
  month: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  eventCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 4,
  },
  nextEvent: {
    fontSize: 11,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
});

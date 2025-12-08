import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from '../context/ThemeContext';
import { useVisitorsData } from '../hooks/useAsyncStorage';

export default function VisitorsSection({ navigation }) {
  const { theme } = useTheme();
  const [allVisitors] = useVisitorsData();
  const [visitors, setVisitors] = useState([]);
  const [nextVisitor, setNextVisitor] = useState(null);

  useEffect(() => {
    if (allVisitors && allVisitors.length > 0) {
      // Hitta nästa besökare inom 3 dagar
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const upcoming = allVisitors
        .filter(v => v.date)
        .map(v => ({
          ...v,
          dateObj: new Date(v.date),
        }))
        .filter(v => v.dateObj >= today && v.dateObj <= threeDaysFromNow)
        .sort((a, b) => a.dateObj - b.dateObj);
      
      setVisitors(upcoming);
      
      if (upcoming.length > 0) {
        setNextVisitor(upcoming[0]);
      } else {
        setNextVisitor(null);
      }
    } else {
      setVisitors([]);
      setNextVisitor(null);
    }
  }, [allVisitors]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const visitDate = new Date(date);
    visitDate.setHours(0, 0, 0, 0);

    if (visitDate.getTime() === today.getTime()) {
      return 'Idag';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (visitDate.getTime() === tomorrow.getTime()) {
      return 'Imorgon';
    }

    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]} 
      activeOpacity={0.8}
      onPress={() => navigation?.navigate("VisitorsPage")}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>👥</Text>
        <Text style={[styles.title, { color: theme.text }]}>Besökare</Text>
      </View>
      <View style={styles.content}>
        {visitors.length > 0 ? (
          <>
            <Text style={[styles.itemCount, { color: theme.primary }]}>
              {visitors.length} {visitors.length === 1 ? 'besökare' : 'besökare'}
            </Text>
            {nextVisitor ? (
              <Text style={[styles.nextVisitor, { color: theme.textSecondary }]} numberOfLines={1}>
                Nästa: {nextVisitor.name} {nextVisitor.time && `kl ${nextVisitor.time}`}
              </Text>
            ) : (
              <Text style={[styles.nextVisitor, { color: theme.textSecondary }]}>
                Inga planerade besök
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Inga besökare</Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              Tryck för att lägga till
            </Text>
          </>
        )}
      </View>
      {nextVisitor && (
        <View style={[styles.statusBadge, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.statusText, { color: theme.primary }]}>
            {formatDate(nextVisitor.date)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
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
  content: {
    flex: 1,
    justifyContent: "center",
  },
  itemCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9c27b0",
    marginBottom: 4,
  },
  nextVisitor: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f3e5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9c27b0",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
  },
});
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from '../context/ThemeContext';

export default function CalendarSection({ navigation }) {
  const { theme } = useTheme();
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
        <Text style={[styles.day, { color: theme.primary }]}>7</Text>
        <Text style={[styles.month, { color: theme.textSecondary }]}>Okt</Text>
      </View>
      <Text style={[styles.eventCount, { color: theme.textTertiary }]}>3 händelser</Text>
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
  },
});

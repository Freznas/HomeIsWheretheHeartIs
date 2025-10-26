import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function WeatherSection() {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.icon}>🌤️</Text>
        <Text style={styles.title}>Väder</Text>
      </View>
      <View style={styles.weatherInfo}>
        <Text style={styles.temperature}>18°</Text>
        <Text style={styles.condition}>Delvis molnigt</Text>
      </View>
      <Text style={styles.location}>Stockholm</Text>
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
  weatherInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  temperature: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff9800",
    lineHeight: 32,
  },
  condition: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
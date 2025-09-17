import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function CalendarSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Events</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardText}>📌 Tandläkare</Text>
          <Text style={styles.cardSubtext}>2 sep 14:00</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardText}>📌 Föräldramöte</Text>
          <Text style={styles.cardSubtext}>5 sep 18:30</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardText}>📌 Fotbollsträning</Text>
          <Text style={styles.cardSubtext}>7 sep 17:00</Text>
        </View>
        {/* Add more event cards as needed */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    height: 180,
    backgroundColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
    elevation: 2,
    minWidth: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 14,
    color: "#555",
  },
});

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function HighlightSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Highlights</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardText}>🎂 Mamma fyller år idag!</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardText}>🍽️ Middag kl 18:00</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardText}>🧹 Städning imorgon</Text>
        </View>
        {/* Add more cards as needed */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    height: 250,
    backgroundColor: "#009bba",
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
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
  },
});
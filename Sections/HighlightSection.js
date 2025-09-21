import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function HighlightSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Highlights</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.card, styles.birthday]}>
          <Text style={styles.cardText}>🎂 Mamma fyller år idag!</Text>
        </View>
        <View style={[styles.card, styles.dinner]}>
          <Text style={styles.cardText}>🍽️ Middag kl 18:00</Text>
        </View>
        <View style={[styles.card, styles.cleaning]}>
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
    paddingTop: 15, // Add this
    paddingBottom: 15, // And this
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
    minWidth: 200,
    maxWidth:200,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  birthday: {
    backgroundColor: "#ffe0e6",
  },
  dinner: {
    backgroundColor: "#fff9c4",
  },
  cleaning: {
    backgroundColor: "#e0f7fa",
  },
  cardText: {
    fontSize: 16,
  },
});
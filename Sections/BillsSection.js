import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BillsSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bills</Text>
      <Text style={styles.placeholder}>No bills to show.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    backgroundColor: "#fce4ec",
    borderRadius: 8,
    padding: 12,
      shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,            // For Android shadow
  padding: 12,    
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  placeholder: {
    color: "#888",
  },
});
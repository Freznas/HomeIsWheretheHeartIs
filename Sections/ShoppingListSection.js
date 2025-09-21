import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ShoppingListSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shopping List</Text>
      <Text style={styles.placeholder}>No items yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    backgroundColor: "#e0f7fa",
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
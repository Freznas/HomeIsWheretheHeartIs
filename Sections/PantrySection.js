import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function PantrySection({ navigation }) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate("PantryPage")}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>🥫</Text>
        <Text style={styles.title}>Skafferi</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.itemCount}>12 varor</Text>
        <Text style={styles.recentItem}>Senast: Mjölk</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>Uppdaterad</Text>
      </View>
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
    color: "#4caf50",
    marginBottom: 4,
  },
  recentItem: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4caf50",
  },
});


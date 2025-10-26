import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ChoresSection({ navigation }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate("ChoresPage")}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Sysslor</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.itemCount}>5 uppgifter</Text>
        <Text style={styles.progress}>3 kvar att göra</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>Pågår</Text>
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
    color: "#ff9800",
    marginBottom: 4,
  },
  progress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ff9800",
  },
});


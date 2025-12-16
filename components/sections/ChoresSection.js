import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import { useChoresData } from '../../hooks/useAsyncStorage';

export default function ChoresSection({ navigation }) {
  const { theme } = useTheme();
  const [chores] = useChoresData();
  const [nextChore, setNextChore] = useState(null);
  const [choreCount, setChoreCount] = useState(0);

  useEffect(() => {
    if (chores && chores.length > 0) {
      // Räkna totalt antal sysslor
      setChoreCount(chores.length);
      
      // Hitta nästa syssla med deadline (ej completed)
      const upcoming = chores
        .filter(c => !c.completed && c.dueDate)
        .sort((a, b) => {
          // Prioritera "Idag" och "Imorgon"
          if (a.dueDate === "Idag") return -1;
          if (b.dueDate === "Idag") return 1;
          if (a.dueDate === "Imorgon") return -1;
          if (b.dueDate === "Imorgon") return 1;
          return 0;
        });
      
      setNextChore(upcoming.length > 0 ? upcoming[0] : null);
    } else {
      setChoreCount(0);
      setNextChore(null);
    }
  }, [chores]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate("ChoresPage")}
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>✓</Text>
        <Text style={[styles.title, { color: theme.text }]}>Sysslor</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.itemCount, { color: theme.success }]}>
          {choreCount} {choreCount === 1 ? 'uppgift' : 'uppgifter'}
        </Text>
        <Text style={[styles.progress, { color: theme.textSecondary }]}>
          {nextChore ? `Nästa: ${nextChore.task}` : 'Inga aktiva sysslor'}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: theme.success + '20' }]}>
        <Text style={[styles.statusText, { color: theme.success }]}>Pågår</Text>
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


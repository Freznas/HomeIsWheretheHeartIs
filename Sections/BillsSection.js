import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from '../context/ThemeContext';
import { useBillsData } from '../hooks/useAsyncStorage';

export default function BillsSection({ navigation }) {
  const { theme } = useTheme();
  const [bills] = useBillsData();
  const [nextBill, setNextBill] = useState(null);
  const [billCount, setBillCount] = useState(0);

  useEffect(() => {
    if (bills && bills.length > 0) {
      // Räkna totalt antal räkningar
      setBillCount(bills.length);
      
      // Hitta nästa räkning att betala (ej betald, närmast förfallodatum)
      const unpaid = bills
        .filter(b => b.status === "Ej betald" && b.dueDate)
        .map(b => ({
          ...b,
          dueDateObj: parseDueDate(b.dueDate)
        }))
        .filter(b => b.dueDateObj)
        .sort((a, b) => a.dueDateObj - b.dueDateObj);
      
      setNextBill(unpaid.length > 0 ? unpaid[0] : null);
    } else {
      setBillCount(0);
      setNextBill(null);
    }
  }, [bills]);

  // Hjälpfunktion för att parsa förfallodatum
  const parseDueDate = (dateStr) => {
    try {
      // Format: "2025-12-15" eller "15/12"
      if (dateStr.includes('-')) {
        return new Date(dateStr);
      } else if (dateStr.includes('/')) {
        const [day, month] = dateStr.split('/');
        const year = new Date().getFullYear();
        return new Date(year, parseInt(month) - 1, parseInt(day));
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate("BillsPage")}
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>💳</Text>
        <Text style={[styles.title, { color: theme.text }]}>Räkningar</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.itemCount, { color: theme.error }]}>
          {billCount} {billCount === 1 ? 'räkning' : 'räkningar'}
        </Text>
        <Text style={[styles.dueInfo, { color: theme.textSecondary }]}>
          {nextBill ? `Nästa: ${nextBill.name}` : 'Inga räkningar'}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: theme.error + '20' }]}>
        <Text style={[styles.statusText, { color: theme.error }]}>Uppmärksamhet</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    backgroundColor: "#ffe0e0ff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    padding: 12,
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
    color: "#e91e63",
    marginBottom: 4,
  },
  dueInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fce4ec",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#e91e63",
  },
});


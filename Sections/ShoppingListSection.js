import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUserHousehold, subscribeToShoppingList } from '../config/firebase';

export default function ShoppingListSection({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [lastItem, setLastItem] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [householdId, setHouseholdId] = useState(null);

  useEffect(() => {
    loadHousehold();
  }, []);

  useEffect(() => {
    if (!householdId) return;

    const unsubscribe = subscribeToShoppingList(householdId, (result) => {
      if (result.success) {
        setItems(result.items || []);
      }
    });

    return () => unsubscribe();
  }, [householdId]);

  const loadHousehold = async () => {
    if (!currentUser?.id) return;
    
    const result = await getUserHousehold(currentUser.id);
    if (result.success && result.household) {
      setHouseholdId(result.household.id);
    }
  };

  useEffect(() => {
    if (items && items.length > 0) {
      // Räkna endast varor som INTE är completed
      const activeItems = items.filter(item => !item.completed);
      setItemCount(activeItems.length);
      
      // Hitta senast tillagd vara som INTE är completed (högst id-nummer)
      const sorted = [...activeItems].sort((a, b) => {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA;
      });
      setLastItem(sorted.length > 0 ? sorted[0] : null);
    } else {
      setItemCount(0);
      setLastItem(null);
    }
  }, [items]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate("ShoppingListPage")}
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>🛒</Text>
        <Text style={[styles.title, { color: theme.text }]}>Inköpslista</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.itemCount, { color: theme.accent }]}>
          {itemCount} {itemCount === 1 ? 'vara' : 'varor'}
        </Text>
        <Text style={[styles.nextItem, { color: theme.textSecondary }]}>
          {lastItem ? `Nästa: ${lastItem.name}` : 'Listan är tom'}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: theme.accent + '20' }]}>
        <Text style={[styles.statusText, { color: theme.accent }]}>Aktiv</Text>
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
    color: "#2196f3",
    marginBottom: 4,
  },
  nextItem: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2196f3",
  },
});


import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getUserHousehold, subscribeToPantry } from '../../config/firebase';

export default function PantrySection({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [pantryItems, setPantryItems] = useState([]);
  const [lastItem, setLastItem] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [householdId, setHouseholdId] = useState(null);

  useEffect(() => {
    loadHousehold();
  }, []);

  useEffect(() => {
    if (!householdId) return;

    const unsubscribe = subscribeToPantry(householdId, (result) => {
      if (result.success) {
        setPantryItems(result.items || []);
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
    if (pantryItems && pantryItems.length > 0) {
      // Räkna totalt antal varor
      setItemCount(pantryItems.length);
      
      // Hitta senast tillagd vara (högst id-nummer)
      const sorted = [...pantryItems].sort((a, b) => {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA;
      });
      setLastItem(sorted[0]);
    } else {
      setItemCount(0);
      setLastItem(null);
    }
  }, [pantryItems]);

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate("PantryPage")}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>🥫</Text>
        <Text style={[styles.title, { color: theme.text }]}>{t('home.pantry')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.itemCount, { color: theme.primary }]}>
          {itemCount} {itemCount === 1 ? 'vara' : 'varor'}
        </Text>
        <Text style={[styles.recentItem, { color: theme.textSecondary }]}>
          {lastItem ? `Senast: ${lastItem.name}` : 'Inget i skafferiet'}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: theme.primary + '20' }]}>
        <Text style={[styles.statusText, { color: theme.primary }]}>Uppdaterad</Text>
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


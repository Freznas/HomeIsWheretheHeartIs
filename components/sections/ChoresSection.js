import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getUserHousehold, subscribeToChores } from '../../config/firebase';

export default function ChoresSection({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [chores, setChores] = useState([]);
  const [nextChore, setNextChore] = useState(null);
  const [choreCount, setChoreCount] = useState(0);

  // 🔥 Firebase - Hämta hushålls-ID och prenumerera på sysslor
  useEffect(() => {
    let unsubscribe;

    const loadData = async () => {
      if (!currentUser?.id) return;

      try {
        const result = await getUserHousehold(currentUser.id);
        
        if (result.success && result.householdId) {
          unsubscribe = subscribeToChores(result.householdId, (response) => {
            if (response.success) {
              setChores(response.chores || []);
            }
          });
        }
      } catch (error) {
        console.error('Error loading chores:', error);
      }
    };

    loadData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

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
        <Text style={[styles.title, { color: theme.text }]}>{t('home.chores')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.itemCount, { color: theme.success }]}>
          {choreCount} {choreCount === 1 ? t('chores.task') : t('chores.tasks')}
        </Text>
        <Text style={[styles.progress, { color: theme.textSecondary }]}>
          {nextChore ? `${t('chores.next')} ${nextChore.task}` : t('chores.noActive')}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: theme.success + '20' }]}>
        <Text style={[styles.statusText, { color: theme.success }]}>{t('chores.ongoing')}</Text>
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


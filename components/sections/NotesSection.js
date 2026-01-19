import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotesData } from '../../hooks/useAsyncStorage';

export default function NotesSection({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [notes] = useNotesData();
  const [noteCount, setNoteCount] = useState(0);

  useEffect(() => {
    if (notes && notes.length > 0) {
      // Räkna totalt antal anteckningar
      setNoteCount(notes.length);
    } else {
      setNoteCount(0);
    }
  }, [notes]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate("NotesPage")}
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>📝</Text>
        <Text style={[styles.title, { color: theme.text }]}>{t('home.notes')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.itemCount, { color: theme.warning }]}>
          {noteCount} {noteCount === 1 ? 'anteckning' : 'anteckningar'}
        </Text>
        <Text style={[styles.lastNote, { color: theme.textSecondary }]}>
          {noteCount > 0 ? 'Tryck för att visa' : 'Inga anteckningar'}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: theme.warning + '20' }]}>
        <Text style={[styles.statusText, { color: theme.warning }]}>Aktuell</Text>
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
    color: "#4caf50",
    marginBottom: 4,
  },
  lastNote: {
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


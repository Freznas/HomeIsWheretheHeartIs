import React, { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl } from "react-native";
import { useNotesData } from '../../hooks/useAsyncStorage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import HeaderView from '../../components/common/HeaderView';
import { SkeletonList, NoteItemSkeleton } from '../../components/common/SkeletonLoader';

export default function NotesPage({ navigation }) {
  // 💾 AsyncStorage hook - hanterar all data automatiskt
  const [notesList, setNotesList, removeNotesData, loading] = useNotesData();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [errors, setErrors] = useState({});

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Data kommer från useNotesData hook som läser från AsyncStorage
    // Simulera kort refresh för bättre UX
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[styles.itemCard, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor, borderColor: theme.border }]} 
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.itemName, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.itemDetails, { color: theme.textSecondary }]}>{item.content}</Text>
    </TouchableOpacity>
  ), [theme, openEditModal]);

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewTitle(item.title);
    setNewContent(item.content);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewTitle("");
    setNewContent("");
    setModalVisible(true);
  };

  const handleSave = () => {
    let newErrors = {};
    if (!newTitle.trim()) newErrors.title = "Fyll i titel";
    if (!newContent.trim()) newErrors.content = "Fyll i anteckning";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (editingItem) {
      // 🔄 Uppdatera befintlig anteckning (sparas automatiskt till AsyncStorage)
      setNotesList(currentNotes => 
        currentNotes.map(item => 
          item.id === editingItem.id 
            ? {
                ...item,
                title: newTitle.trim(),
                content: newContent.trim(),
              }
            : item
        )
      );
    } else {
      // ➕ Lägg till ny anteckning (sparas automatiskt till AsyncStorage)
      setNotesList(currentNotes => [
        ...currentNotes,
        {
          id: Date.now().toString(),
          title: newTitle.trim(),
          content: newContent.trim(),
        },
      ]);
    }

    setNewTitle("");
    setNewContent("");
    setEditingItem(null);
    setErrors({});
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      // 🗑️ Ta bort anteckning (sparas automatiskt till AsyncStorage)
      setNotesList(currentNotes => currentNotes.filter(item => item.id !== editingItem.id));
      setModalVisible(false);
      setEditingItem(null);
      setNewTitle("");
      setNewContent("");
      setErrors({});
    }
  };

  // Loading state
  if (loading) {
    return (
      <HeaderView
        title={t('notes.title')}
        onBackPress={() => navigation.goBack()}
        onProfilePress={() => navigation.navigate('Profile')}
        onSupportPress={() => navigation.navigate('Support')}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <SkeletonList count={4} CardComponent={NoteItemSkeleton} />
        </View>
      </HeaderView>
    );
  }

  return (
    <HeaderView
      title={t('notes.title')}
      onBackPress={() => navigation.goBack()}
      onProfilePress={() => navigation.navigate('Profile')}
      onSupportPress={() => navigation.navigate('Support')}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FlatList
          data={notesList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ {t('notes.add')}</Text>
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.modalBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingItem ? t('notes.edit') : t('notes.add')}
              </Text>
              
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Titel"
                placeholderTextColor={theme.textSecondary}
                value={newTitle}
                onChangeText={text => {
                  setNewTitle(text);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
              />
              {errors.title ? <Text style={[styles.errorText, { color: theme.error }]}>{errors.title}</Text> : null}
              
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Skriv din anteckning här..."
                placeholderTextColor={theme.textSecondary}
                value={newContent}
                onChangeText={text => {
                  setNewContent(text);
                  if (errors.content) setErrors({ ...errors, content: undefined });
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.content ? <Text style={[styles.errorText, { color: theme.error }]}>{errors.content}</Text> : null}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.success }]} onPress={handleSave}>
                  <Text style={[styles.modalButtonText, { color: theme.textInverse }]}>
                    {editingItem ? t('common.edit') : t('common.add')}
                  </Text>
                </TouchableOpacity>
                {editingItem && (
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.error }]} onPress={handleDelete}>
                    <Text style={[styles.modalButtonText, { color: theme.textInverse }]}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }]} onPress={() => { setModalVisible(false); setErrors({}); }}>
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </HeaderView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  itemDetails: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#009bba",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "stretch",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    alignSelf: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#009bba",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 2,
  },
});


import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";

const initialNotesList = [
  { id: "1", title: "Handla mat", content: "Glöm inte mjölk, bröd och ägg från ICA" },
  { id: "2", title: "Städning", content: "Dammsuga vardagsrummet och sovrummet" },
  { id: "3", title: "Läkarbesök", content: "Ring och boka tid hos tandläkaren för Anna" },
];

export default function NotesPage({ navigation }) {
  const [notesList, setNotesList] = useState(initialNotesList);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [errors, setErrors] = useState({});

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard} 
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.itemName}>{item.title}</Text>
      <Text style={styles.itemDetails}>{item.content}</Text>
    </TouchableOpacity>
  );

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
      // Update existing item
      setNotesList(notesList.map(item => 
        item.id === editingItem.id 
          ? {
              ...item,
              title: newTitle.trim(),
              content: newContent.trim(),
            }
          : item
      ));
    } else {
      // Add new item
      setNotesList([
        ...notesList,
        {
          id: (notesList.length + 1).toString(),
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
      setNotesList(notesList.filter(item => item.id !== editingItem.id));
      setModalVisible(false);
      setEditingItem(null);
      setNewTitle("");
      setNewContent("");
      setErrors({});
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Anteckningar</Text>
        <FlatList
          data={notesList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Lägg till anteckning</Text>
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
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingItem ? "Redigera anteckning" : "Lägg till anteckning"}
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Titel"
                value={newTitle}
                onChangeText={text => {
                  setNewTitle(text);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Skriv din anteckning här..."
                value={newContent}
                onChangeText={text => {
                  setNewContent(text);
                  if (errors.content) setErrors({ ...errors, content: undefined });
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.content ? <Text style={styles.errorText}>{errors.content}</Text> : null}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={handleSave}>
                  <Text style={styles.modalButtonText}>
                    {editingItem ? "Uppdatera" : "Lägg till"}
                  </Text>
                </TouchableOpacity>
                {editingItem && (
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#d32f2f" }]} onPress={handleDelete}>
                    <Text style={styles.modalButtonText}>Ta bort</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#bbb" }]} onPress={() => { setModalVisible(false); setErrors({}); }}>
                  <Text style={styles.modalButtonText}>Avbryt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    alignSelf: "center",
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


import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useShoppingListData } from '../hooks/useAsyncStorage';

export default function ShoppingListPage({ navigation }) {
  // 💾 AsyncStorage hook - hanterar all data automatiskt
  const [items, setItems, removeShoppingListData, loading] = useShoppingListData();
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");

  const toggleComplete = (id) => {
    // 🔄 Uppdatera completed status (sparas automatiskt till AsyncStorage)
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const addItem = () => {
    if (newItemName.trim()) {
      // ➕ Lägg till ny vara (sparas automatiskt till AsyncStorage)
      setItems(currentItems => [
        ...currentItems,
        {
          id: Date.now().toString(),
          name: newItemName.trim(),
          quantity: newItemQuantity.trim() || "1 st",
          completed: false,
          category: "Övrigt"
        }
      ]);
      setNewItemName("");
      setNewItemQuantity("");
      setModalVisible(false);
    }
  };

  const deleteItem = (id) => {
    // 🗑️ Ta bort vara (sparas automatiskt till AsyncStorage)
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={[styles.itemCard, item.completed && styles.completedItem]}>
      <TouchableOpacity 
        style={styles.itemContent}
        onPress={() => toggleComplete(item.id)}
      >
        <View style={[styles.checkbox, item.completed && styles.checkedBox]}>
          <Text style={styles.checkmark}>{item.completed ? "✓" : ""}</Text>
        </View>
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, item.completed && styles.completedText]}>
            {item.name}
          </Text>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
        </View>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteItem(item.id)}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Laddar inköpslista...</Text>
      </View>
    );
  }

  const completedCount = (items || []).filter(item => item.completed).length;
  const totalCount = (items || []).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3949ab" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Inköpslista</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount}/{totalCount} klara
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addHeaderButton} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addHeaderIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Lägg till vara</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lägg till vara</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Produktnamn</Text>
              <TextInput
                style={styles.input}
                placeholder="T.ex. Mjölk, Bröd..."
                value={newItemName}
                onChangeText={setNewItemName}
              />
              
              <Text style={styles.inputLabel}>Mängd (valfritt)</Text>
              <TextInput
                style={styles.input}
                placeholder="T.ex. 2L, 1 kg..."
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveButton} onPress={addItem}>
                <Text style={styles.saveButtonText}>Lägg till</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#3949ab",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  addHeaderIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  completedItem: {
    opacity: 0.6,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkedBox: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  itemQuantity: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  categoryTag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    fontSize: 18,
    color: "#ef4444",
    fontWeight: "bold",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#3949ab",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#6b7280",
    fontWeight: "bold",
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  modalActions: {
    padding: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#3949ab",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 16,
  },
});


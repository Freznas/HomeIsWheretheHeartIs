import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  ScrollView
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const initialPantry = [
  { id: "1", name: "Mjölk", quantity: "2", unit: "liter", category: "Mejeri" },
  { id: "2", name: "Bröd", quantity: "1", unit: "paket", category: "Bageri" },
  { id: "3", name: "Ägg", quantity: "12", unit: "st", category: "Mejeri" },
  { id: "4", name: "Pasta", quantity: "3", unit: "paket", category: "Torrvaror" },
  { id: "5", name: "Tomater", quantity: "5", unit: "st", category: "Grönsaker" },
];

export default function PantryPage({ navigation }) {
  const [pantry, setPantry] = useState(initialPantry);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("st");
  const [newCategory, setNewCategory] = useState("");
  const [errors, setErrors] = useState({});

  // Gruppera items per kategori
  const groupedPantry = pantry.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard} 
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.quantity} {item.unit}</Text>
        </View>
      </View>
      <View style={styles.itemFooter}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.editHint}>Tryck för att redigera</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item: categoryName }) => {
    const items = groupedPantry[categoryName];
    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categoryCount}>{items.length} varor</Text>
        </View>
        {items.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={styles.itemCard} 
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>{item.quantity} {item.unit}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewQuantity(item.quantity);
    setNewUnit(item.unit);
    setNewCategory(item.category);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewName("");
    setNewQuantity("");
    setNewUnit("st");
    setNewCategory("");
    setModalVisible(true);
  };

  const handleSave = () => {
    let newErrors = {};
    if (!newName.trim()) newErrors.name = "Fyll i produktnamn";
    if (!newQuantity.trim()) newErrors.quantity = "Fyll i mängd";
    if (!newCategory.trim()) newErrors.category = "Fyll i kategori";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (editingItem) {
      setPantry(pantry.map(item => 
        item.id === editingItem.id 
          ? {
              ...item,
              name: newName.trim(),
              quantity: newQuantity.trim(),
              unit: newUnit,
              category: newCategory.trim(),
            }
          : item
      ));
    } else {
      setPantry([
        ...pantry,
        {
          id: Date.now().toString(),
          name: newName.trim(),
          quantity: newQuantity.trim(),
          unit: newUnit,
          category: newCategory.trim(),
        },
      ]);
    }

    resetModal();
  };

  const handleDelete = () => {
    if (editingItem) {
      setPantry(pantry.filter(item => item.id !== editingItem.id));
      resetModal();
    }
  };

  const resetModal = () => {
    setNewName("");
    setNewQuantity("");
    setNewUnit("st");
    setNewCategory("");
    setEditingItem(null);
    setErrors({});
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3949ab" />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Skafferi</Text>
          <Text style={styles.headerSubtitle}>{pantry.length} varor totalt</Text>
        </View>
        <TouchableOpacity style={styles.addHeaderButton} onPress={openAddModal}>
          <Text style={styles.addHeaderIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <FlatList
          data={Object.keys(groupedPantry)}
          keyExtractor={item => item}
          renderItem={renderCategory}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Lägg till vara</Text>
        </TouchableOpacity>
      </View>

      {/* Modern Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={resetModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? "Redigera vara" : "Lägg till vara"}
              </Text>
              <TouchableOpacity onPress={resetModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Produktnamn</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="T.ex. Mjölk, Bröd..."
                  value={newName}
                  onChangeText={text => {
                    setNewName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: 12 }]}>
                  <Text style={styles.inputLabel}>Mängd</Text>
                  <TextInput
                    style={[styles.input, errors.quantity && styles.inputError]}
                    placeholder="Antal"
                    value={newQuantity}
                    onChangeText={text => {
                      const numeric = text.replace(/[^0-9]/g, "");
                      setNewQuantity(numeric);
                      if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                    }}
                    keyboardType="numeric"
                  />
                  {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Enhet</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={newUnit}
                      onValueChange={(itemValue) => setNewUnit(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="st" value="st" />
                      <Picker.Item label="kg" value="kg" />
                      <Picker.Item label="liter" value="liter" />
                      <Picker.Item label="paket" value="paket" />
                      <Picker.Item label="burk" value="burk" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kategori</Text>
                <TextInput
                  style={[styles.input, errors.category && styles.inputError]}
                  placeholder="T.ex. Mejeri, Bageri..."
                  value={newCategory}
                  onChangeText={text => {
                    setNewCategory(text);
                    if (errors.category) setErrors({ ...errors, category: undefined });
                  }}
                />
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]} 
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {editingItem ? "Uppdatera" : "Lägg till"}
                </Text>
              </TouchableOpacity>
              
              {editingItem && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>Ta bort</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={resetModal}
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
    backgroundColor: "#f8f9fa",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  categoryCount: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: "#3949ab",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryTag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  editHint: {
    fontSize: 10,
    color: "#9ca3af",
    fontStyle: "italic",
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
    maxHeight: "90%",
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
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#1f2937",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  rowInputs: {
    flexDirection: "row",
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  picker: {
    height: 48,
    color: "#1f2937",
  },
  modalActions: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#3949ab",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});


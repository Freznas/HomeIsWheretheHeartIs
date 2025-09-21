import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker"; // <-- Add this import

const initialPantry = [
  { id: "1", name: "Mjölk", quantity: "2", unit: "liter", category: "Mejeri" },
  { id: "2", name: "Bröd", quantity: "1", unit: "paket", category: "Bageri" },
  { id: "3", name: "Ägg", quantity: "12", unit: "st", category: "Mejeri" },
];

export default function PantryPage({ navigation }) {
  const [pantry, setPantry] = useState(initialPantry);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("St"); // Default to "St"
  const [newCategory, setNewCategory] = useState("");
  const [errors, setErrors] = useState({});

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDetails}>
        {item.quantity} {item.unit} • {item.category}
      </Text>
    </View>
  );

  const handleAdd = () => {
    let newErrors = {};
    if (!newName.trim()) newErrors.name = "Fyll i produktnamn";
    if (!newQuantity.trim()) newErrors.quantity = "Fyll i mängd";
    if (!newUnit.trim()) newErrors.unit = "Fyll i enhet";
    if (!newCategory.trim()) newErrors.category = "Fyll i kategori";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setPantry([
      ...pantry,
      {
        id: (pantry.length + 1).toString(),
        name: newName.trim(),
        quantity: newQuantity.trim(),
        unit: newUnit.trim(),
        category: newCategory.trim(),
      },
    ]);
    setNewName("");
    setNewQuantity("");
    setNewUnit("");
    setNewCategory("");
    setErrors({});
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Hushållets Skafferi</Text>
        <FlatList
          data={pantry}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Lägg till vara</Text>
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
              <Text style={styles.modalTitle}>Lägg till vara</Text>
              <TextInput
                style={styles.input}
                placeholder="Produktnamn"
                value={newName}
                onChangeText={text => {
                  setNewName(text);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Mängd (t.ex. 2)"
                    value={newQuantity}
                    onChangeText={text => {
                      const numeric = text.replace(/[^0-9]/g, "");
                      setNewQuantity(numeric);
                      if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                    }}
                    keyboardType="numeric"
                  />
                  {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
                </View>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={newUnit}
                    onValueChange={(itemValue) => {
                      setNewUnit(itemValue);
                      if (errors.unit) setErrors({ ...errors, unit: undefined });
                    }}
                    style={styles.picker}
                    dropdownIconColor="#009bba"
                  >
                    <Picker.Item label="St" value="St" />
                    <Picker.Item label="Packages" value="Packages" />
                    <Picker.Item label="Litres" value="Litres" />
                  </Picker>
                  {errors.unit ? <Text style={styles.errorText}>{errors.unit}</Text> : null}
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Kategori (t.ex. Mejeri)"
                value={newCategory}
                onChangeText={text => {
                  setNewCategory(text);
                  if (errors.category) setErrors({ ...errors, category: undefined });
                }}
              />
              {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={handleAdd}>
                  <Text style={styles.modalButtonText}>Lägg till</Text>
                </TouchableOpacity>
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
  },
  itemDetails: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
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
  // Modal styles
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
  pickerWrapper: {
    flex: 1,
    height: 48, // Ensures the Picker is visible
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginBottom: 12,
    justifyContent: "center",
  },
  picker: {
    width: "100%",
    height:215,
  },
});


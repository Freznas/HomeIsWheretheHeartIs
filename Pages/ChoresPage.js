import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";

const initialChores = [
  { id: "1", name: "Dammsuga vardagsrum", assignedTo: "Anna", location: "Inside", status: "Inte påbörjad" },
  { id: "2", name: "Diska", assignedTo: "Erik", location: "Inside", status: "Pågående" },
  { id: "3", name: "Klippa gräs", assignedTo: "Mamma", location: "Outside", status: "Klar" },
];

export default function ChoresPage({ navigation }) {
  const [chores, setChores] = useState(initialChores);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newLocation, setNewLocation] = useState("Inside");
  const [newStatus, setNewStatus] = useState("Inte påbörjad");
  const [errors, setErrors] = useState({});

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard} 
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDetails}>
        Tilldelad: {item.assignedTo} • Plats: {item.location} • Status: {item.status}
      </Text>
    </TouchableOpacity>
  );

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewAssignedTo(item.assignedTo);
    setNewLocation(item.location);
    setNewStatus(item.status);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewName("");
    setNewAssignedTo("");
    setNewLocation("Inside");
    setNewStatus("Inte påbörjad");
    setModalVisible(true);
  };

  const handleSave = () => {
    let newErrors = {};
    if (!newName.trim()) newErrors.name = "Fyll i syssla";
    if (!newAssignedTo.trim()) newErrors.assignedTo = "Fyll i vem som ska göra sysslan";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (editingItem) {
      // Update existing item
      setChores(chores.map(item => 
        item.id === editingItem.id 
          ? {
              ...item,
              name: newName.trim(),
              assignedTo: newAssignedTo.trim(),
              location: newLocation,
              status: newStatus,
            }
          : item
      ));
    } else {
      // Add new item
      setChores([
        ...chores,
        {
          id: (chores.length + 1).toString(),
          name: newName.trim(),
          assignedTo: newAssignedTo.trim(),
          location: newLocation,
          status: newStatus,
        },
      ]);
    }

    setNewName("");
    setNewAssignedTo("");
    setNewLocation("Inside");
    setNewStatus("Inte påbörjad");
    setEditingItem(null);
    setErrors({});
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      setChores(chores.filter(item => item.id !== editingItem.id));
      setModalVisible(false);
      setEditingItem(null);
      setNewName("");
      setNewAssignedTo("");
      setNewLocation("Inside");
      setNewStatus("Inte påbörjad");
      setErrors({});
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Hushållets Sysslor</Text>
        <FlatList
          data={chores}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Lägg till syssla</Text>
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
                {editingItem ? "Redigera syssla" : "Lägg till syssla"}
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Syssla (t.ex. Dammsuga vardagsrum)"
                value={newName}
                onChangeText={text => {
                  setNewName(text);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              
              <TextInput
                style={styles.input}
                placeholder="Tilldelad till (t.ex. Anna, Erik)"
                value={newAssignedTo}
                onChangeText={text => {
                  setNewAssignedTo(text);
                  if (errors.assignedTo) setErrors({ ...errors, assignedTo: undefined });
                }}
              />
              {errors.assignedTo ? <Text style={styles.errorText}>{errors.assignedTo}</Text> : null}
              
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Plats:</Text>
                <TouchableOpacity style={styles.pickerButton}>
                  <Text style={styles.pickerButtonText}>{newLocation}</Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
                <Picker
                  selectedValue={newLocation}
                  onValueChange={(itemValue) => setNewLocation(itemValue)}
                  style={styles.hiddenPicker}
                >
                  <Picker.Item label="Inside" value="Inside" />
                  <Picker.Item label="Outside" value="Outside" />
                </Picker>
              </View>
              
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Status:</Text>
                <TouchableOpacity style={styles.pickerButton}>
                  <Text style={styles.pickerButtonText}>{newStatus}</Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
                <Picker
                  selectedValue={newStatus}
                  onValueChange={(itemValue) => setNewStatus(itemValue)}
                  style={styles.hiddenPicker}
                >
                  <Picker.Item label="Inte påbörjad" value="Inte påbörjad" />
                  <Picker.Item label="Pågående" value="Pågående" />
                  <Picker.Item label="Klar" value="Klar" />
                </Picker>
              </View>
              
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
    backgroundColor: "#fff3e0",
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
  pickerWrapper: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  pickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#333",
  },
  pickerArrow: {
    fontSize: 12,
    color: "#666",
  },
  hiddenPicker: {
    position: "absolute",
    width: "100%",
    height: 48,
    opacity: 0,
    top: 24,
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


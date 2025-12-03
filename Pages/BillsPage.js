import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import { useBillsData } from '../hooks/useAsyncStorage';
import { useTheme } from '../context/ThemeContext';

export default function BillsPage({ navigation }) {
  // 💾 AsyncStorage hook - hanterar all data automatiskt
  const [bills, setBills, removeBillsData, loading] = useBillsData();
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newStatus, setNewStatus] = useState("Ej betald");
  const [errors, setErrors] = useState({});

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.itemCard, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor, borderColor: theme.border }]} 
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
      <Text style={[styles.itemDetails, { color: theme.textSecondary }]}>
        Belopp: {item.amount} kr • Förfallodatum: {item.dueDate} • Status: {item.status}
      </Text>
    </TouchableOpacity>
  );

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewAmount(item.amount);
    setNewDueDate(item.dueDate);
    setNewStatus(item.status);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewName("");
    setNewAmount("");
    setNewDueDate("");
    setNewStatus("Ej betald");
    setModalVisible(true);
  };

  const handleSave = () => {
    let newErrors = {};
    if (!newName.trim()) newErrors.name = "Fyll i räkningsnamn";
    if (!newAmount.trim()) newErrors.amount = "Fyll i belopp";
    if (!newDueDate.trim()) newErrors.dueDate = "Fyll i förfallodatum";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (editingItem) {
      // 🔄 Uppdatera befintlig räkning (sparas automatiskt till AsyncStorage)
      setBills(currentBills => 
        currentBills.map(item => 
          item.id === editingItem.id 
            ? {
                ...item,
                name: newName.trim(),
                amount: newAmount.trim(),
                dueDate: newDueDate.trim(),
                status: newStatus,
              }
            : item
        )
      );
    } else {
      // ➕ Lägg till ny räkning (sparas automatiskt till AsyncStorage)
      setBills(currentBills => [
        ...currentBills,
        {
          id: Date.now().toString(),
          name: newName.trim(),
          amount: newAmount.trim(),
          dueDate: newDueDate.trim(),
          status: newStatus,
        },
      ]);
    }

    setNewName("");
    setNewAmount("");
    setNewDueDate("");
    setNewStatus("Ej betald");
    setEditingItem(null);
    setErrors({});
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      // 🗑️ Ta bort räkning (sparas automatiskt till AsyncStorage)
      setBills(currentBills => currentBills.filter(item => item.id !== editingItem.id));
      setModalVisible(false);
      setEditingItem(null);
      setNewName("");
      setNewAmount("");
      setNewDueDate("");
      setNewStatus("Ej betald");
      setErrors({});
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Laddar räkningar...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Hushållets Räkningar</Text>
        <FlatList
          data={bills}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Lägg till räkning</Text>
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
                {editingItem ? "Redigera räkning" : "Lägg till räkning"}
              </Text>
              
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Räkningsnamn (t.ex. Elräkning)"
                placeholderTextColor={theme.textSecondary}
                value={newName}
                onChangeText={text => {
                  setNewName(text);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
              />
              {errors.name ? <Text style={[styles.errorText, { color: theme.error }]}>{errors.name}</Text> : null}
              
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Belopp (t.ex. 1200)"
                placeholderTextColor={theme.textSecondary}
                value={newAmount}
                onChangeText={text => {
                  const numeric = text.replace(/[^0-9]/g, "");
                  setNewAmount(numeric);
                  if (errors.amount) setErrors({ ...errors, amount: undefined });
                }}
                keyboardType="numeric"
              />
              {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
              
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Förfallodatum (ÅÅÅÅ-MM-DD)"
                placeholderTextColor={theme.textSecondary}
                value={newDueDate}
                onChangeText={text => {
                  setNewDueDate(text);
                  if (errors.dueDate) setErrors({ ...errors, dueDate: undefined });
                }}
              />
              {errors.dueDate ? <Text style={[styles.errorText, { color: theme.error }]}>{errors.dueDate}</Text> : null}
              
              <View style={styles.pickerWrapper}>
                <Text style={[styles.pickerLabel, { color: theme.text }]}>Status:</Text>
                <TouchableOpacity style={[styles.pickerButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                  <Text style={[styles.pickerButtonText, { color: theme.text }]}>{newStatus}</Text>
                  <Text style={[styles.pickerArrow, { color: theme.text }]}>▼</Text>
                </TouchableOpacity>
                <Picker
                  selectedValue={newStatus}
                  onValueChange={(itemValue) => setNewStatus(itemValue)}
                  style={[styles.hiddenPicker, { color: theme.text }]}
                >
                  <Picker.Item label="Ej betald" value="Ej betald" />
                  <Picker.Item label="Betald" value="Betald" />
                  <Picker.Item label="Försenad" value="Försenad" />
                </Picker>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.success }]} onPress={handleSave}>
                  <Text style={[styles.modalButtonText, { color: theme.textInverse }]}>
                    {editingItem ? "Uppdatera" : "Lägg till"}
                  </Text>
                </TouchableOpacity>
                {editingItem && (
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.error }]} onPress={handleDelete}>
                    <Text style={[styles.modalButtonText, { color: theme.textInverse }]}>Ta bort</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }]} onPress={() => { setModalVisible(false); setErrors({}); }}>
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Avbryt</Text>
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
    backgroundColor: "#fce4ec",
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


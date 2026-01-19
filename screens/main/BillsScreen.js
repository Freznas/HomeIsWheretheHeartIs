import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getUserHousehold, subscribeToBills, addBill, updateBill, deleteBill } from '../../config/firebase';
import HeaderView from '../../components/common/HeaderView';
import { SkeletonList, BillItemSkeleton } from '../../components/common/SkeletonLoader';

export default function BillsPage({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  // 🔥 Firebase state - realtidsuppdatering
  const [bills, setBills] = useState([]);
  const [householdId, setHouseholdId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newStatus, setNewStatus] = useState("Ej betald");
  const [errors, setErrors] = useState({});

  // 🔥 Firebase - Hämta hushålls-ID och prenumerera på räkningar
  useEffect(() => {
    let unsubscribe;

    const loadData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const result = await getUserHousehold(currentUser.id);
        
        if (result.success && result.householdId) {
          setHouseholdId(result.householdId);
          
          // Prenumerera på realtidsuppdateringar
          unsubscribe = subscribeToBills(result.householdId, (response) => {
            if (response.success) {
              setBills(response.bills || []);
            } else {
              console.error('Error subscribing to bills:', response.error);
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading household:', error);
        Alert.alert('Fel', 'Kunde inte ladda hushållsinformation');
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Firebase realtidsuppdatering sköter refresh automatiskt
    setTimeout(() => setRefreshing(false), 500);
  }, []);
  const renderItem = useCallback(({ item }) => (
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
  ), [theme, openEditModal]);

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewAmount(item.amount);
    // Konvertera datum string till Date objekt
    setNewDueDate(item.dueDate ? new Date(item.dueDate) : new Date());
    setNewStatus(item.status);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewName("");
    setNewAmount("");
    setNewDueDate(new Date());
    setNewStatus("Ej betald");
    setModalVisible(true);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setNewDueDate(selectedDate);
      if (errors.dueDate) setErrors({ ...errors, dueDate: undefined });
    }
  };

  const handleSave = async () => {
    let newErrors = {};
    if (!newName.trim()) newErrors.name = "Fyll i räkningsnamn";
    if (!newAmount.trim()) newErrors.amount = "Fyll i belopp";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (!householdId) {
      Alert.alert('Fel', 'Inget hushåll hittat');
      return;
    }

    try {
      const formattedDate = formatDate(newDueDate);
      
      if (editingItem) {
        // 🔄 Uppdatera befintlig räkning i Firebase
        const result = await updateBill(
          householdId,
          editingItem.id,
          {
            name: newName.trim(),
            amount: newAmount.trim(),
            dueDate: formattedDate,
            status: newStatus,
          },
          currentUser.id
        );

        if (!result.success) {
          Alert.alert('Fel', 'Kunde inte uppdatera räkningen');
          return;
        }
      } else {
        // ➕ Lägg till ny räkning i Firebase
        const result = await addBill(
          householdId,
          {
            name: newName.trim(),
            amount: newAmount.trim(),
            dueDate: formattedDate,
            status: newStatus,
          },
          currentUser.id
        );

        if (!result.success) {
          Alert.alert('Fel', 'Kunde inte lägga till räkningen');
          return;
        }
      }

      setNewName("");
      setNewAmount("");
      setNewDueDate(new Date());
      setNewStatus("Ej betald");
      setEditingItem(null);
      setErrors({});
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Fel', 'Ett fel uppstod');
    }
  };

  const handleDelete = async () => {
    if (!editingItem || !householdId) return;

    try {
      const result = await deleteBill(householdId, editingItem.id);

      if (result.success) {
        setModalVisible(false);
        setEditingItem(null);
        setNewName("");
        setNewAmount("");
        setNewDueDate(new Date());
        setNewStatus("Ej betald");
        setErrors({});
      } else {
        Alert.alert('Fel', 'Kunde inte ta bort räkningen');
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      Alert.alert('Fel', 'Ett fel uppstod');
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
    <HeaderView
      title={t('bills.title')}
      onBackPress={() => navigation.goBack()}
      onProfilePress={() => navigation.navigate('Profile')}
      onSupportPress={() => navigation.navigate('Support')}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {loading ? (
          <SkeletonList count={5} CardComponent={BillItemSkeleton} />
        ) : (
          <>
        <FlatList
          data={bills}
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
          <Text style={styles.addButtonText}>+ {t('bills.add')}</Text>
        </TouchableOpacity>
          </>
        )}
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
                {editingItem ? t('bills.edit') : t('bills.add')}
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
              
              <View style={styles.datePickerWrapper}>
                <Text style={[styles.pickerLabel, { color: theme.text }]}>Förfallodatum:</Text>
                <TouchableOpacity 
                  style={[styles.datePickerButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.datePickerText, { color: theme.text }]}>
                    {formatDate(newDueDate)}
                  </Text>
                  <Text style={[styles.pickerArrow, { color: theme.text }]}>📅</Text>
                </TouchableOpacity>
              </View>
              
              {showDatePicker && (
                <DateTimePicker
                  value={newDueDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
              
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity 
                  style={[styles.datePickerDoneButton, { backgroundColor: theme.success }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={[styles.datePickerDoneText, { color: theme.textInverse }]}>Klar</Text>
                </TouchableOpacity>
              )}
              
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
  datePickerWrapper: {
    marginBottom: 12,
  },
  datePickerButton: {
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
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  datePickerDoneButton: {
    backgroundColor: "#4caf50",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  datePickerDoneText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});


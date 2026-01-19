import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getUserHousehold, subscribeToShoppingList, addShoppingListItem, updateShoppingListItem, deleteShoppingListItem } from '../../config/firebase';
import HeaderView from '../../components/common/HeaderView';
import { SkeletonList, ShoppingItemSkeleton } from '../../components/common/SkeletonLoader';

export default function ShoppingListPage({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  // 🔥 Firebase state - realtidsuppdatering
  const [items, setItems] = useState([]);
  const [householdId, setHouseholdId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("st");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  
  const units = [
    { label: 'st', value: 'st', icon: '📦' },
    { label: 'kg', value: 'kg', icon: '⚖️' },
    { label: 'liter', value: 'liter', icon: '🧃' },
    { label: 'paket', value: 'paket', icon: '🎁' },
    { label: 'burk', value: 'burk', icon: '🥫' },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHouseholdAndShoppingList();
    setRefreshing(false);
  }, []);

  // 🔥 Load household and setup real-time listener
  useEffect(() => {
    loadHouseholdAndShoppingList();
  }, []);

  useEffect(() => {
    if (!householdId) return;

    // Lyssna på realtidsuppdateringar från Firebase
    const unsubscribe = subscribeToShoppingList(householdId, (result) => {
      if (result.success) {
        setItems(result.items || []);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [householdId]);

  const loadHouseholdAndShoppingList = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const result = await getUserHousehold(currentUser.id);
    if (result.success && result.householdId) {
      setHouseholdId(result.householdId);
    } else {
      setLoading(false);
    }
  };

  const toggleComplete = async (id) => {
    if (!householdId) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;

    // 🔥 Uppdatera completed status i Firebase
    await updateShoppingListItem(householdId, id, {
      completed: !item.completed
    }, currentUser.id);
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    
    if (!householdId) {
      Alert.alert(t('error.title'), t('error.needHouseholdToAdd'));
      return;
    }

    const quantityText = newItemQuantity.trim() || "1";
    const quantityString = `${quantityText} ${newItemUnit}`;
    
    // 🔥 Lägg till ny vara i Firebase
    const result = await addShoppingListItem(householdId, {
      name: newItemName.trim(),
      quantity: quantityString,
      completed: false,
      category: "Övrigt"
    }, currentUser.id);
    
    if (!result.success) {
      Alert.alert('Fel', result.error || 'Kunde inte lägga till vara');
      return;
    }
    
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemUnit("st");
    setShowUnitPicker(false);
    setModalVisible(false);
  };

  const deleteItem = async (id) => {
    if (!householdId) return;
    
    // 🔥 Ta bort vara från Firebase
    const result = await deleteShoppingListItem(householdId, id);
    
    if (!result.success) {
      Alert.alert('Fel', result.error || 'Kunde inte ta bort vara');
    }
  };

  const renderItem = useCallback(({ item }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor, borderColor: theme.border }, item.completed && styles.completedItem]}>
      <TouchableOpacity 
        style={styles.itemContent}
        onPress={() => toggleComplete(item.id)}
      >
        <View style={[styles.checkbox, { borderColor: theme.border }, item.completed && { backgroundColor: theme.success }]}>
          <Text style={[styles.checkmark, { color: theme.textInverse }]}>{item.completed ? "✓" : ""}</Text>
        </View>
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, { color: theme.text }, item.completed && styles.completedText]}>
            {item.name}
          </Text>
          <Text style={[styles.itemQuantity, { color: theme.textSecondary }]}>{item.quantity}</Text>
        </View>
        <View style={[styles.categoryTag, { backgroundColor: theme.accent }]}>
          <Text style={[styles.categoryText, { color: theme.textInverse }]}>{item.category}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteItem(item.id)}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  ), [theme, toggleComplete, deleteItem]);

  const completedCount = useMemo(() => 
    (items || []).filter(item => item.completed).length,
    [items]
  );
  
  const totalCount = useMemo(() => 
    (items || []).length,
    [items]
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.text }]}>Laddar inköpslista...</Text>
      </View>
    );
  }

  if (!householdId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBackground} />
        <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backIcon, { color: theme.headerText }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.headerText }]}>Inköpslista</Text>
          </View>
        </View>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={[styles.emptyText, { color: theme.text }]}>Du måste vara med i ett hushåll</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Gå till Profil och skapa eller gå med i ett hushåll först
            </Text>
            <TouchableOpacity 
              style={[styles.goToProfileButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.goToProfileText}>Gå till Profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <HeaderView
      title={t('shopping.title')}
      subtitle={`${completedCount}/${totalCount} klara`}
      navigation={navigation}
    >

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {loading ? (
          <SkeletonList count={6} CardComponent={ShoppingItemSkeleton} />
        ) : (
          <>
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ {t('shopping.add')}</Text>
        </TouchableOpacity>
          </>
        )}
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
          <View style={[styles.modalContent, { backgroundColor: theme.modalBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Lägg till vara</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: theme.text }]}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalForm}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Produktnamn</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder={t('placeholder.items')}
                placeholderTextColor={theme.textSecondary}
                value={newItemName}
                onChangeText={setNewItemName}
              />
              
              <Text style={[styles.inputLabel, { color: theme.text }]}>Mängd & Enhet</Text>
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder={t('placeholder.quantity')}
                    placeholderTextColor={theme.textSecondary}
                    value={newItemQuantity}
                    onChangeText={setNewItemQuantity}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <TouchableOpacity
                    style={[styles.unitPickerButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                    onPress={() => setShowUnitPicker(!showUnitPicker)}
                  >
                    <Text style={[styles.unitPickerText, { color: theme.text }]}>
                      {units.find(u => u.value === newItemUnit)?.icon} {newItemUnit}
                    </Text>
                    <Text style={styles.dropdownArrow}>{showUnitPicker ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  
                  {showUnitPicker && (
                    <ScrollView 
                      style={[styles.unitScrollList, { backgroundColor: theme.card, borderColor: theme.border }]}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {units.map((unit, index) => (
                        <TouchableOpacity
                          key={unit.value}
                          style={[
                            styles.unitOption,
                            newItemUnit === unit.value && styles.unitOptionActive,
                            index !== units.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                          ]}
                          onPress={() => {
                            setNewItemUnit(unit.value);
                            setShowUnitPicker(false);
                          }}
                        >
                          <Text style={[styles.unitOptionText, { color: theme.text }]}>
                            {unit.icon} {unit.label}
                          </Text>
                          {newItemUnit === unit.value && (
                            <Text style={styles.checkIcon}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.success }]} onPress={addItem}>
                <Text style={[styles.saveButtonText, { color: theme.textInverse }]}>{t('common.add')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: theme.border }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </HeaderView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    minHeight: "70%",
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
  rowInputs: {
    flexDirection: "row",
    gap: 8,
  },
  inputGroup: {
    position: 'relative',
  },
  unitPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  unitPickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  unitScrollList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 180,
    borderWidth: 2,
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  unitOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  unitOptionActive: {
    backgroundColor: 'rgba(57, 73, 171, 0.1)',
  },
  unitOptionText: {
    fontSize: 16,
  },
  checkIcon: {
    fontSize: 18,
    color: '#3949ab',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  goToProfileButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goToProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
});


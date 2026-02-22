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
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationsContext';
import { getUserHousehold, subscribeToChores, addChore, updateChore, deleteChore } from '../../config/firebase';
import HeaderView from '../../components/common/HeaderView';
import { SkeletonList, ChoreItemSkeleton } from '../../components/common/SkeletonLoader';

export default function ChoresPage({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const { sendPushToHousehold } = useNotifications();
  
  // 🔥 Firebase state - realtidsuppdatering
  const [chores, setChores] = useState([]);
  const [householdId, setHouseholdId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  // 🔥 Firebase - Hämta hushålls-ID och prenumerera på sysslor
  useEffect(() => {
    let unsubscribe;

    const loadData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        // Hämta användarens hushålls-ID
        const result = await getUserHousehold(currentUser.id);
        
        if (result.success && result.householdId) {
          setHouseholdId(result.householdId);
          
          // Prenumerera på realtidsuppdateringar
          unsubscribe = subscribeToChores(result.householdId, (response) => {
            if (response.success) {
              setChores(response.chores || []);
            } else {
              console.error('Error subscribing to chores:', response.error);
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('ChoresScreen: Error loading household:', error);
        toast.error('Kunde inte ladda hushållsinformation');
        setError(error.message);
        setLoading(false);
      }
    };

    loadData();

    // Cleanup - avsluta prenumeration när komponenten unmountas
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Firebase realtidsuppdatering sköter refresh automatiskt
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const toggleComplete = async (id) => {
    if (!householdId) return;
    
    const chore = chores.find(c => c.id === id);
    if (!chore) return;

    try {
      const newCompletedState = !chore.completed;
      const result = await updateChore(
        householdId,
        id,
        { completed: newCompletedState },
        currentUser.id
      );

      if (result.success && newCompletedState) {
        // 🔔 Send push notification when chore is completed
        await sendPushToHousehold({
          title: '✅ Syssla klar!',
          body: `${currentUser.displayName || 'Någon'} klarade av: ${chore.task}`,
          data: { type: 'chores', screen: 'ChoresPage' },
          excludeUserId: currentUser.id,
        });
      } else if (!result.success) {
        toast.error('Kunde inte uppdatera sysslan');
      }
    } catch (error) {
      console.error('Error toggling chore:', error);
      toast.error('Ett fel uppstod vid uppdatering');
    }
  };

  const handleAddChore = async () => {
    if (!newTask.trim() || !newAssignee.trim()) {
      toast.warning('Uppgift och tilldelad person måste anges');
      return;
    }
    
    if (!householdId) {
      toast.error('Inget hushåll hittat');
      return;
    }

    try {
      const choreData = {
        task: newTask.trim(),
        assignedTo: currentUser.id, // Använd userId istället för namn
        completed: false,
        dueDate: "Idag",
      };

      const result = await addChore(
        householdId,
        choreData,
        currentUser.id,
        newAssignee.trim() // Skicka displayName separat
      );

      if (result.success) {
        setNewTask("");
        setNewAssignee("");
        setModalVisible(false);
        toast.success('Sysslan har lagts till!');
        
        // 🔔 Send push notification to household
        await sendPushToHousehold({
          title: '✅ Ny syssla tillagd',
          body: `${currentUser.displayName || 'Någon'} lade till: ${newTask.trim()} → ${newAssignee.trim()}`,
          data: { type: 'chores', screen: 'ChoresPage' },
          excludeUserId: currentUser.id,
        });
      } else {
        toast.error('Kunde inte lägga till sysslan');
      }
    } catch (error) {
      console.error('Error adding chore:', error);
      toast.error('Ett fel uppstod');
    }
  };

  const renderChore = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[styles.choreCard, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor, borderColor: theme.border }, item.completed && styles.completedChore]}
      onPress={() => toggleComplete(item.id)}
    >
      <View style={styles.choreHeader}>
        <View style={[styles.checkbox, { borderColor: theme.border }, item.completed && { backgroundColor: theme.success }]}>
          <Text style={[styles.checkmark, { color: theme.textInverse }]}>{item.completed ? "✓" : ""}</Text>
        </View>
        <View style={styles.choreDetails}>
          <Text style={[styles.taskName, { color: theme.text }, item.completed && styles.completedText]}>
            {item.task}
          </Text>
          <Text style={[styles.assignedTo, { color: theme.textSecondary }]}>
            Tilldelad: {item.assignedToName || 'Okänd'}
          </Text>
        </View>
        <View style={[styles.dueDateBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.dueDateText, { color: theme.textInverse }]}>{item.dueDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [theme, toggleComplete]);

  const completedCount = useMemo(() => chores.filter(chore => chore.completed).length, [chores]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <HeaderView
        title={t('chores.title')}
        navigation={navigation}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <SkeletonList count={5} CardComponent={ChoreItemSkeleton} />
        </View>
      </HeaderView>
    );
  }

  return (
    <HeaderView
      title={t('chores.title')}
      navigation={navigation}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {chores.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.text }]}>
              🧹 Inga sysslor ännu!
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
              Tryck på knappen nedan för att lägga till din första syssla
            </Text>
          </View>
        ) : (
          <FlatList
            data={chores}
            keyExtractor={item => item.id}
            renderItem={renderChore}
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
        )}
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ {t('chores.add')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Ny syssla</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: theme.text }]}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalForm}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Uppgift</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="T.ex. Diska, Dammsuga..."
                placeholderTextColor={theme.textSecondary}
                value={newTask}
                onChangeText={setNewTask}
              />
              
              <Text style={[styles.inputLabel, { color: theme.text }]}>Tilldelad till</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Namn på personen..."
                placeholderTextColor={theme.textSecondary}
                value={newAssignee}
                onChangeText={setNewAssignee}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.success }]} onPress={handleAddChore}>
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
        </View>
      </Modal>
    </HeaderView>
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
  choreCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  completedChore: {
    opacity: 0.6,
  },
  choreHeader: {
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
  choreDetails: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  assignedTo: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  dueDateBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueDateText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#92400e",
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
});


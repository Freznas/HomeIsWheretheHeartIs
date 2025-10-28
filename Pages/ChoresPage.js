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
} from "react-native";
import { useChoresData } from '../hooks/useAsyncStorage';

export default function ChoresPage({ navigation }) {
  // 💾 AsyncStorage hook - hanterar all data automatiskt
  const [chores, setChores, removeChoresData, loading] = useChoresData();
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  const toggleComplete = (id) => {
    setChores(currentChores =>
      currentChores.map(chore => 
        chore.id === id ? { ...chore, completed: !chore.completed } : chore
      )
    );
  };

  const addChore = () => {
    if (newTask.trim() && newAssignee.trim()) {
      setChores(currentChores => [
        ...currentChores,
        {
          id: Date.now().toString(),
          task: newTask.trim(),
          assignedTo: newAssignee.trim(),
          completed: false,
          dueDate: "Idag"
        }
      ]);
      setNewTask("");
      setNewAssignee("");
      setModalVisible(false);
    }
  };

  const renderChore = ({ item }) => (
    <TouchableOpacity 
      style={[styles.choreCard, item.completed && styles.completedChore]}
      onPress={() => toggleComplete(item.id)}
    >
      <View style={styles.choreHeader}>
        <View style={[styles.checkbox, item.completed && styles.checkedBox]}>
          <Text style={styles.checkmark}>{item.completed ? "✓" : ""}</Text>
        </View>
        <View style={styles.choreDetails}>
          <Text style={[styles.taskName, item.completed && styles.completedText]}>
            {item.task}
          </Text>
          <Text style={styles.assignedTo}>Tilldelad: {item.assignedTo}</Text>
        </View>
        <View style={styles.dueDateBadge}>
          <Text style={styles.dueDateText}>{item.dueDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const completedCount = chores.filter(chore => chore.completed).length;

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Laddar sysslor...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Sysslor</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount}/{chores.length} klara
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
        {chores.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              🧹 Inga sysslor ännu!
            </Text>
            <Text style={styles.emptyStateSubtext}>
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
          />
        )}
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Lägg till syssla</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ny syssla</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Uppgift</Text>
              <TextInput
                style={styles.input}
                placeholder="T.ex. Diska, Dammsuga..."
                value={newTask}
                onChangeText={setNewTask}
              />
              
              <Text style={styles.inputLabel}>Tilldelad till</Text>
              <TextInput
                style={styles.input}
                placeholder="Namn på personen..."
                value={newAssignee}
                onChangeText={setNewAssignee}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveButton} onPress={addChore}>
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
        </View>
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


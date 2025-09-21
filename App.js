import React, { useState } from "react";
import { View, Modal, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import HeaderView from "./components/HeaderView";
import HighlightSection from "./Sections/HighlightSection";
import CalendarSection from "./Sections/CalendarSection"; 
import PantrySection from "./Sections/PantrySection";
import ChatSection from "./Sections/ChatSection";
import BottomMessengerBar from "./components/BottomMessengerBar";
import ShoppingListSection from "./Sections/ShoppingListSection";
import ChoresSection from "./Sections/ChoresSection";
import BillsSection from "./Sections/BillsSection";
import NotesSection from "./Sections/NotesSection";
import WeatherSection from "./Sections/WeatherSection";
import VisitorsSection from "./Sections/VisitorsSection";

const initialConversation = [
  { id: 1, sender: "Anna", text: "Hej! Glöm inte handla mjölk på vägen hem." },
  { id: 2, sender: "Du", text: "Tack för påminnelsen! Ska fixa det." },
  { id: 3, sender: "Anna", text: "Super! 😊" },
  { id: 4, sender: "Du", text: "Vill du ha något mer?" },
  { id: 5, sender: "Anna", text: "Nej, det räcker. Ses snart!" },
];

export default function App({ navigation }) {

  const [modalVisible, setModalVisible] = useState(false);
  const [conversation, setConversation] = useState(initialConversation);
  const [input, setInput] = useState("");

  const handleBack = () => {
    console.log("Back pressed");
  };

  const handleProfile = () => {
    console.log("Profile pressed");
  };

  const latestMessage = conversation[conversation.length - 1].text;

  const handleSend = () => {
    if (input.trim() === "") return;
    setConversation([
      ...conversation,
      { id: conversation.length + 1, sender: "Du", text: input.trim() },
    ]);
    setInput("");
  };

  return (
    <View style={{ flex: 1 , backgroundColor: "#7e749003"}}>
      <HeaderView
        onBackPress={handleBack}
        onProfilePress={handleProfile}
        title="Mitt Hushåll"
      >
        <HighlightSection />
        <CalendarSection />
        <PantrySection navigation={navigation} /> {/* Pass navigation here */}
        <ShoppingListSection />
        <ChoresSection />
        <BillsSection />
        <NotesSection />
        <WeatherSection />
        <VisitorsSection />
      </HeaderView>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)}>
        <BottomMessengerBar message={latestMessage} />
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
            <Text style={styles.modalTitle}>Konversation</Text>
            <ScrollView style={styles.scrollView}>
              {conversation.map(msg => (
                <View key={msg.id} style={styles.messageRow}>
                  <Text style={styles.sender}>{msg.sender}:</Text>
                  <Text style={styles.messageText}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Skriv ett meddelande..."
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>Skicka</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Stäng</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
  
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.85,
    height: height * 0.7,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    alignSelf: "center",
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  sender: {
    fontWeight: "bold",
    marginRight: 6,
  },
  messageText: {
    flex: 1,
    flexWrap: "wrap",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
  },
  sendButton: {
    backgroundColor: "#009bba",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    alignSelf: "center",
    backgroundColor: "#009bba",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});






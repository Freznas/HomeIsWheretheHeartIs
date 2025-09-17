import React, { useState } from "react";
import { View, Modal, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
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

const conversation = [
  { id: 1, sender: "Anna", text: "Hej! Glöm inte handla mjölk på vägen hem." },
  { id: 2, sender: "Du", text: "Tack för påminnelsen! Ska fixa det." },
  { id: 3, sender: "Anna", text: "Super! 😊" },
  { id: 4, sender: "Du", text: "Vill du ha något mer?" },
  { id: 5, sender: "Anna", text: "Nej, det räcker. Ses snart!" },
];

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);

  const handleBack = () => {
    console.log("Back pressed");
  };

  const handleProfile = () => {
    console.log("Profile pressed");
  };

  const latestMessage = conversation[conversation.length - 1].text;

  return (
    <View style={{ flex: 1 }}>
      <HeaderView
        onBackPress={handleBack}
        onProfilePress={handleProfile}
        title="Mitt Hushåll"
      >
        <HighlightSection />
        <CalendarSection />
        <PantrySection />
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
        <View style={styles.modalOverlay}>
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
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Stäng</Text>
            </TouchableOpacity>
          </View>
        </View>
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






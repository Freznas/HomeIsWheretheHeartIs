import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";

const initialConversation = [
  { id: 1, sender: "Anna", text: "Hej! Glöm inte handla mjölk på vägen hem.", timestamp: "10:30" },
  { id: 2, sender: "Du", text: "Tack för påminnelsen! Ska fixa det.", timestamp: "10:32" },
  { id: 3, sender: "Anna", text: "Super! 😊", timestamp: "10:33" },
  { id: 4, sender: "Du", text: "Vill du ha något mer?", timestamp: "10:35" },
  { id: 5, sender: "Anna", text: "Nej, det räcker. Ses snart!", timestamp: "10:36" },
  { id: 6, sender: "Erik", text: "Jag kommer hem lite sent idag, börjar laga middag utan mig!", timestamp: "15:45" },
];

export default function CommunicationPage({ navigation }) {
  const [conversation, setConversation] = useState(initialConversation);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newMessage = {
      id: conversation.length + 1,
      sender: "Du",
      text: input.trim(),
      timestamp: timestamp,
    };
    setConversation([...conversation, newMessage]);
    setInput("");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3949ab" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Familjekonversation</Text>
          <Text style={styles.headerSubtitle}>Anna, Erik, Du</Text>
        </View>
        <TouchableOpacity style={styles.optionsButton}>
          <Text style={styles.optionsIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation.map(msg => (
          <View key={msg.id} style={[
            styles.messageRow,
            msg.sender === "Du" ? styles.myMessage : styles.otherMessage
          ]}>
            <View style={styles.messageHeader}>
              <Text style={[styles.sender, msg.sender === "Du" && styles.mySender]}>
                {msg.sender}
              </Text>
              <Text style={[styles.timestamp, msg.sender === "Du" && styles.myTimestamp]}>
                {msg.timestamp}
              </Text>
            </View>
            <Text style={[styles.messageText, msg.sender === "Du" && styles.myMessageText]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            value={input}
            onChangeText={setInput}
            placeholder="Skriv ett meddelande..."
            placeholderTextColor="#999"
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, input.trim() && styles.sendButtonActive]} 
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>↗</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsIcon: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  messageRow: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sender: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  mySender: {
    color: "rgba(255,255,255,0.8)",
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
  },
  myTimestamp: {
    color: "rgba(255,255,255,0.6)",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: "#333",
  },
  myMessageText: {
    color: "#fff",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  attachIcon: {
    fontSize: 18,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#007AFF",
  },
  sendButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});
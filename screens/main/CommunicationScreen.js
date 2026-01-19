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
  StatusBar,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCommunicationData } from '../../hooks/useAsyncStorage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import HeaderView from '../../components/common/HeaderView';

export default function CommunicationPage({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [conversation, setConversation, removeCommunicationData, loading] = useCommunicationData();
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newMessage = {
      id: Date.now(),
      sender: "Du",
      text: input.trim(),
      timestamp: timestamp,
    };
    setConversation(currentConversation => [...currentConversation, newMessage]);
    setInput("");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Laddar konversation...</Text>
      </SafeAreaView>
    );
  }

  return (
    <HeaderView
      title={t('chat.title')}
      subtitle="Anna, Erik, Du"
      navigation={navigation}
    >

      {/* Messages */}
      <ScrollView 
        style={[styles.messagesContainer, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.text }]}>💬 Ingen konversation ännu!</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
              Skicka det första meddelandet för att starta konversationen med familjen
            </Text>
          </View>
        ) : (
          conversation.map(msg => (
            <View key={msg.id} style={[
              styles.messageRow,
              msg.sender === "Du" ? [styles.myMessage, { backgroundColor: theme.primary }] : [styles.otherMessage, { backgroundColor: theme.cardBackground, borderColor: theme.border }]
            ]}>
              <View style={styles.messageHeader}>
                <Text style={[styles.sender, msg.sender === "Du" ? { color: theme.textInverse } : { color: theme.text }]}>
                  {msg.sender}
                </Text>
                <Text style={[styles.timestamp, msg.sender === "Du" ? { color: theme.textInverse, opacity: 0.8 } : { color: theme.textSecondary }]}>
                  {msg.timestamp}
                </Text>
              </View>
              <Text style={[styles.messageText, msg.sender === "Du" ? { color: theme.textInverse } : { color: theme.text }]}>
                {msg.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inputContainer}
      >
        <View style={[styles.inputRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.messageInput, { color: theme.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Skriv ett meddelande..."
            placeholderTextColor={theme.textSecondary}
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
    </HeaderView>
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

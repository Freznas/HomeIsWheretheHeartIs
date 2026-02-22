import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useToast } from '../../context/ToastContext';
import { getUserHousehold, subscribeToChat, sendChatMessage, markMessageAsRead } from '../../config/firebase';
import HeaderView from '../../components/common/HeaderView';

export default function CommunicationPage({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { sendPushToHousehold } = useNotifications();
  const toast = useToast();
  
  const [messages, setMessages] = useState([]);
  const [householdId, setHouseholdId] = useState(null);
  const [householdName, setHouseholdName] = useState('');
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const flatListRef = useRef(null);

  // 🔥 Ladda hushålls-ID
  useEffect(() => {
    const loadHousehold = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const result = await getUserHousehold(currentUser.id);
        if (result.success && result.household) {
          setHouseholdId(result.household.id);
          setHouseholdName(result.household.name);
        }
      } catch (error) {
        console.error('Error loading household:', error);
        toast.error('Kunde inte ladda hushållsdata');
      } finally {
        setLoading(false);
      }
    };

    loadHousehold();
  }, [currentUser]);

  // 🔥 Prenumerera på chat-meddelanden (real-time)
  useEffect(() => {
    if (!householdId) return;

    const unsubscribe = subscribeToChat(householdId, (result) => {
      if (result.success && result.messages) {
        // Sortera meddelanden efter timestamp
        const sortedMessages = result.messages.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeA - timeB;
        });
        setMessages(sortedMessages);

        // Markera meddelanden som lästa
        sortedMessages.forEach((msg) => {
          if (msg.sender !== currentUser.id && !msg.readBy?.includes(currentUser.id)) {
            markMessageAsRead(householdId, msg.id, currentUser.id);
          }
        });

        // Auto-scroll till senaste meddelandet
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => unsubscribe();
  }, [householdId, currentUser]);

  // Gruppera meddelanden per dag
  const groupedMessages = useMemo(() => {
    const groups = {};
    
    messages.forEach((msg) => {
      const date = msg.createdAt?.toDate?.();
      if (!date) return;

      const dateKey = date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    // Konvertera till array för FlatList
    const result = [];
    Object.keys(groups).forEach((dateKey) => {
      result.push({ type: 'date', date: dateKey });
      groups[dateKey].forEach((msg) => {
        result.push({ type: 'message', ...msg });
      });
    });

    return result;
  }, [messages]);

  // Skicka meddelande
  const handleSend = async () => {
    if (!input.trim() || !householdId) return;

    const messageText = input.trim();
    setInput("");

    try {
      const result = await sendChatMessage(
        householdId,
        { text: messageText },
        currentUser.id,
        currentUser.displayName || currentUser.email
      );

      if (result.success) {
        // 🔔 Skicka push notification till andra medlemmar
        await sendPushToHousehold({
          title: `💬 ${currentUser.displayName || 'Nytt meddelande'}`,
          body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
          data: { type: 'chat', screen: 'CommunicationPage' },
          excludeUserId: currentUser.id,
        });
      } else {
        toast.error('Kunde inte skicka meddelandet');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Ett fel uppstod');
    }
  };

  // Formatera timestamp
  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Rendera meddelande eller datum-separator
  const renderItem = ({ item, index }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {item.date}
          </Text>
          <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
        </View>
      );
    }

    const isMyMessage = item.sender === currentUser.id;
    const isFirstInGroup = index === 0 || groupedMessages[index - 1]?.sender !== item.sender;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
      ]}>
        {!isMyMessage && isFirstInGroup && (
          <Text style={[styles.senderName, { color: theme.textSecondary }]}>
            {item.senderName}
          </Text>
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage 
            ? { backgroundColor: theme.primary } 
            : { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1 }
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? { color: theme.textInverse } : { color: theme.text }
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isMyMessage 
                ? { color: theme.textInverse, opacity: 0.7 } 
                : { color: theme.textSecondary }
            ]}>
              {formatTime(item.createdAt)}
            </Text>
            {isMyMessage && (
              <Text style={[styles.readStatus, { color: theme.textInverse, opacity: 0.7 }]}>
                {item.readBy?.length > 1 ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <HeaderView title="Chatt" navigation={navigation}>
        <View style={[styles.centerContent, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Laddar konversation...
          </Text>
        </View>
      </HeaderView>
    );
  }

  if (!householdId) {
    return (
      <HeaderView title="Chatt" navigation={navigation}>
        <View style={[styles.centerContent, { backgroundColor: theme.background }]}>
          <Text style={[styles.emptyIcon, { color: theme.textSecondary }]}>🏠</Text>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Inget hushåll hittat
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Skapa eller gå med i ett hushåll för att chatta
          </Text>
        </View>
      </HeaderView>
    );
  }

  return (
    <HeaderView 
      title="Chatt" 
      subtitle={householdName}
      navigation={navigation}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Meddelanden */}
          <FlatList
            ref={flatListRef}
            data={groupedMessages}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || `date-${index}`}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={() => (
              <View style={styles.emptyChat}>
                <Text style={[styles.emptyIcon, { color: theme.textSecondary }]}>💬</Text>
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  Ingen konversation ännu
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                  Skicka det första meddelandet!
                </Text>
              </View>
            )}
          />

          {/* Input Area */}
          <View style={[styles.inputContainer, { 
            backgroundColor: theme.cardBackground,
            borderTopColor: theme.border 
          }]}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border 
              }]}
              value={input}
              onChangeText={setInput}
              placeholder="Skriv ett meddelande..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, { 
                backgroundColor: theme.primary,
                opacity: input.trim() ? 1 : 0.5
              }]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Text style={[styles.sendButtonText, { color: '#fff' }]}>
                📤
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </HeaderView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 12,
    textTransform: 'capitalize',
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    marginRight: 4,
  },
  readStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 12,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sendButtonText: {
    fontSize: 20,
  },
});


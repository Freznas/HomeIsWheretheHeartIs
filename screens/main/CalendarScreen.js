import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationsContext';
import { getUserHousehold, subscribeToCalendar, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../config/firebase';
import HeaderView from '../../components/common/HeaderView';
import * as Calendar from 'expo-calendar';

export default function CalendarPage({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const { scheduleEventReminder, cancelNotification, sendPushToHousehold } = useNotifications();
  
  // 🔥 Firebase state - realtidsuppdatering
  const [events, setEvents] = useState([]);
  const [householdId, setHouseholdId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [calendarPermission, setCalendarPermission] = useState(false);
  const [phoneCalendars, setPhoneCalendars] = useState([]);
  const [syncEnabled, setSyncEnabled] = useState(false);

  // State för kalendernavigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // State för ny händelse
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [isAllDay, setIsAllDay] = useState(false);

  // 🔥 Firebase - Hämta hushålls-ID och prenumerera på kalenderhändelser
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
          unsubscribe = subscribeToCalendar(result.householdId, (response) => {
            if (response.success) {
              // Visa alla händelser (både användarskapade och telefon-synkade)
              setEvents(response.events || []);
            } else {
              console.error('Error subscribing to calendar:', response.error);
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

  // Månadsnavigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Generera kalenderdagar för aktuell månad
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = söndag, 1 = måndag, etc.

    const days = [];
    
    // Lägg till tomma celler för dagar före månadens start
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Lägg till alla dagar i månaden
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Kontrollera om en dag har händelser
  const hasEvents = (day) => {
    if (!day) return false;
    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return events.some(event => event.date === dateStr);
  };

  // Hämta händelser för en specifik dag
  const getEventsForDate = (dateStr) => {
    return events.filter(event => event.date === dateStr);
  };

  // Lägg till ny händelse
  const addEvent = async () => {
    if (!newTitle.trim() || !selectedDate) return;

    if (!householdId) {
      Alert.alert('Fel', 'Inget hushåll hittat');
      return;
    }

    const timeString = isAllDay ? "Heldag" : (newTime.trim() || `${selectedHour}:${selectedMinute}`);
    
    const eventData = {
      title: newTitle.trim(),
      time: timeString,
      description: newDescription.trim(),
      date: selectedDate,
      isAllDay: isAllDay,
    };

    try {
      const result = await addCalendarEvent(householdId, eventData, currentUser.id);
      
      if (result.success) {
        // Schemalägg notifikation för eventet
        const eventWithId = { ...eventData, id: `event_${Date.now()}` };
        await scheduleEventReminder(eventWithId);
        
        // 🔔 Send push notification to household
        await sendPushToHousehold({
          title: '📅 Ny händelse i kalendern',
          body: `${currentUser.displayName || 'Någon'} skapade: ${newTitle.trim()} - ${selectedDate} ${timeString}`,
          data: { type: 'calendar', screen: 'CalendarPage' },
          excludeUserId: currentUser.id,
        });
        
        setNewTitle("");
        setNewTime("");
        setNewDescription("");
        setSelectedHour("09");
        setSelectedMinute("00");
        setIsAllDay(false);
        setShowTimePicker(false);
        setModalVisible(false);
      } else {
        Alert.alert('Fel', 'Kunde inte lägga till händelsen');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Fel', 'Ett fel uppstod');
    }
  };

  // Ta bort händelse
  const deleteEvent = async (eventId) => {
    if (!householdId) return;

    // Hitta eventet för att få notifikations-ID
    const eventToDelete = events.find(event => event.id === eventId);
    
    // Avboka notifikation om det finns en
    if (eventToDelete?.notificationId) {
      await cancelNotification(eventToDelete.notificationId);
    }
    
    try {
      const result = await deleteCalendarEvent(householdId, eventId);
      if (!result.success) {
        Alert.alert('Fel', 'Kunde inte ta bort händelsen');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Fel', 'Ett fel uppstod');
    }
  };

  // 📱 Begär kalenderåtkomst
  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        setCalendarPermission(true);
        loadPhoneCalendars();
      }
    })();
  }, []);

  // Ladda telefonens kalendrar
  const loadPhoneCalendars = async () => {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      setPhoneCalendars(calendars);
    } catch (error) {
      console.error('Fel vid laddning av kalendrar:', error);
      Alert.alert('Fel', 'Kunde inte ladda telefonens kalendrar');
    }
  };

  // Synkronisera med telefonens kalender
  const syncWithPhoneCalendar = async () => {
    if (!calendarPermission) {
      Alert.alert(
        "Kalenderåtkomst behövs",
        "För att synkronisera med telefonens kalender behöver appen tillgång till din kalender.",
        [
          { text: "Avbryt", style: "cancel" },
          { 
            text: "Ge tillgång",
            onPress: async () => {
              const { status } = await Calendar.requestCalendarPermissionsAsync();
              if (status === 'granted') {
                setCalendarPermission(true);
                await loadPhoneCalendars();
                // Vänta lite så kalendrarna hinner laddas
                setTimeout(() => syncWithPhoneCalendar(), 500);
              } else {
                Alert.alert('Permission nekad', 'Kan inte synkronisera utan kalenderåtkomst');
              }
            }
          }
        ]
      );
      return;
    }

    if (!householdId) {
      toast.error('Inget hushåll hittat');
      return;
    }

    if (phoneCalendars.length === 0) {
      Alert.alert(
        'Inga kalendrar hittades',
        'Kunde inte hitta några kalendrar på din telefon. Kontrollera att du har en aktiv kalender.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      toast.info('Synkroniserar...');
      
      // Hämta händelser från telefonen för aktuell månad och nästa
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      
      const phoneEvents = await Calendar.getEventsAsync(
        phoneCalendars.map(cal => cal.id),
        startDate,
        endDate
      );

      if (!phoneEvents || phoneEvents.length === 0) {
        Alert.alert(
          'Inga händelser hittades',
          `Din telefonkalender har inga händelser mellan ${startDate.toLocaleDateString('sv-SE')} och ${endDate.toLocaleDateString('sv-SE')}.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Hämta befintliga händelser från Firebase för att undvika dubbletter
      const existingPhoneEventIds = events
        .filter(e => e.isFromPhone && e.phoneEventId)
        .map(e => e.phoneEventId);

      // Konvertera telefon-händelser till appens format och filtrera bort dubbletter
      const convertedEvents = phoneEvents
        .filter(event => !existingPhoneEventIds.includes(event.id))
        .map(event => ({
          title: event.title || 'Ingen titel',
          time: event.allDay ? 'Heldag' : (event.startDate ? new Date(event.startDate).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''),
          description: event.notes || '',
          date: new Date(event.startDate).toISOString().split('T')[0],
          isFromPhone: true,
          phoneEventId: event.id, // Spara original-ID för att undvika dubbletter
          isAllDay: event.allDay || false,
        }));

      if (convertedEvents.length === 0) {
        Alert.alert(
          'Redan synkroniserad',
          `${phoneEvents.length} händelser hittades men alla är redan synkroniserade.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Lägg till nya telefon-händelser i Firebase
      let successCount = 0;
      for (const event of convertedEvents) {
        const result = await addCalendarEvent(householdId, event, currentUser.id);
        if (result.success) {
          successCount++;
        }
      }

      setSyncEnabled(true);
      toast.success(`${successCount} händelser synkroniserade`);
      Alert.alert(
        "Synkronisering klar! ✅", 
        `${successCount} nya händelser hämtades från din telefon.${phoneEvents.length > convertedEvents.length ? `\n\n(${phoneEvents.length - convertedEvents.length} händelser var redan synkroniserade)` : ''}`
      );
    } catch (error) {
      console.error('Synkroniseringsfel:', error);
      Alert.alert(
        "Synkroniseringsfel ❌", 
        `Kunde inte hämta händelser från telefonens kalender.\n\nFel: ${error.message || 'Okänt fel'}`
      );
    }
  };

  // Formatera månadsnamn
  const getMonthName = useCallback((date) => {
    const months = [
      "Januari", "Februari", "Mars", "April", "Maj", "Juni",
      "Juli", "Augusti", "September", "Oktober", "November", "December"
    ];
    return months[date.getMonth()];
  }, []);

  const calendarDays = useMemo(() => generateCalendarDays(), [currentDate, events]);
  const selectedDateEvents = useMemo(() => 
    selectedDate ? getEventsForDate(selectedDate) : [],
    [selectedDate, events]
  );

  // Öppna modal för ny händelse
  const openAddEventModal = () => {
    if (!selectedDate) {
      // Om inget datum är valt, välj dagens datum
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      setSelectedDate(todayStr);
    }
    setEditingEvent(null);
    setNewTitle("");
    setNewTime("");
    setNewDescription("");
    setSelectedHour("09");
    setSelectedMinute("00");
    setIsAllDay(false);
    setModalVisible(true);
  };

  // Visa laddningsstatus
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Laddar kalender...</Text>
      </View>
    );
  }

  return (
    <HeaderView
      title={t('calendar.title')}
      navigation={navigation}
    >
      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      ) : (
      <ScrollView style={[styles.content, { backgroundColor: theme.background }]}>
        {/* Synkroniseringsknapp */}
        <TouchableOpacity 
          style={[styles.syncButton, { 
            backgroundColor: syncEnabled ? theme.success : theme.primary,
            borderColor: theme.border 
          }]}
          onPress={syncWithPhoneCalendar}
        >
          <Text style={[styles.syncButtonText, { color: theme.textInverse }]}>
            {syncEnabled ? '🔄 Uppdatera synkronisering' : '📱 Synka med telefonens kalender'}
          </Text>
        </TouchableOpacity>
        {/* Månadsnavigation */}
        <View style={[styles.monthNavigation, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: theme.primary }]}
            onPress={() => navigateMonth(-1)}
          >
            <Text style={[styles.navButtonText, { color: theme.textInverse }]}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.monthTitle}>
            <Text style={[styles.monthText, { color: theme.text }]}>
              {getMonthName(currentDate) + " " + currentDate.getFullYear()}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: theme.primary }]}
            onPress={() => navigateMonth(1)}
          >
            <Text style={[styles.navButtonText, { color: theme.textInverse }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Veckodagar */}
        <View style={styles.weekdaysContainer}>
          {['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'].map((day) => (
            <Text key={day} style={[styles.weekdayText, { color: theme.textSecondary }]}>{day}</Text>
          ))}
        </View>

        {/* Kalenderdagar */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const dateStr = day ? 
              `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` 
              : null;
            const isSelected = selectedDate === dateStr;
            const dayHasEvents = day && hasEvents(day);
            const isToday = day && 
              new Date().getDate() === day && 
              new Date().getMonth() === currentDate.getMonth() && 
              new Date().getFullYear() === currentDate.getFullYear();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  { borderColor: theme.border },
                  isSelected && [styles.selectedDay, { backgroundColor: theme.primary }],
                  isToday && [styles.todayCell, { borderColor: theme.accent }],
                ]}
                onPress={() => {
                  if (day) {
                    setSelectedDate(dateStr);
                  }
                }}
                disabled={!day}
              >
                {day && (
                  <>
                    <Text style={[
                      styles.dayText,
                      { color: theme.text },
                      isSelected && { color: theme.textInverse },
                      isToday && { color: theme.accent },
                    ]}>
                      {day}
                    </Text>
                    {dayHasEvents && (
                      <View style={[
                        styles.eventDot,
                        { backgroundColor: theme.success },
                        isSelected && { backgroundColor: theme.textInverse }
                      ]} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Händelser för vald dag */}
        {selectedDate && (
          <View style={[styles.eventsSection, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.eventsSectionTitle, { color: theme.text }]}>
              Händelser {new Date(selectedDate).getDate()}/{new Date(selectedDate).getMonth() + 1}
            </Text>
            
            {selectedDateEvents.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Text style={[styles.noEventsText, { color: theme.textSecondary }]}>
                  📅 Inga händelser denna dag
                </Text>
                <Text style={[styles.noEventsSubtext, { color: theme.textTertiary }]}>
                  Tryck på + för att lägga till en händelse
                </Text>
              </View>
            ) : (
              selectedDateEvents.map((event) => (
                <View key={event.id} style={[
                  styles.eventCard, 
                  { 
                    backgroundColor: theme.cardBackground, 
                    borderColor: event.isFromPhone ? theme.accent : theme.border,
                    borderLeftWidth: event.isFromPhone ? 4 : 1
                  }
                ]}>
                  <View style={styles.eventHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventTitle, { color: theme.text }]}>
                        {event.isFromPhone ? '📱 ' : ''}{event.title}
                      </Text>
                      {event.isFromPhone && (
                        <Text style={[styles.phoneLabel, { color: theme.accent }]}>Från telefonens kalender</Text>
                      )}
                    </View>
                    {!event.isFromPhone && (
                      <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: theme.error }]}
                        onPress={() => deleteEvent(event.id)}
                      >
                        <Text style={[styles.deleteButtonText, { color: theme.textInverse }]}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {event.time && (
                    <Text style={[styles.eventTime, { color: theme.accent }]}>🕐 {event.time}</Text>
                  )}
                  {event.description && (
                    <Text style={[styles.eventDescription, { color: theme.textSecondary }]}>{event.description}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
      )}

      {/* Floating Action Button */}
      {!loading && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={openAddEventModal}
          activeOpacity={0.8}
        >
          <Text style={[styles.fabIcon, { color: theme.textInverse }]}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal för ny händelse */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Ny händelse</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeIcon, { color: theme.text }]}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Titel *</Text>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="T.ex. Familjeträff, Läkarbesök..."
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.inputLabel}>Tid</Text>
              
              {/* Heldag-toggle */}
              <TouchableOpacity 
                style={styles.allDayToggle}
                onPress={() => {
                  setIsAllDay(!isAllDay);
                  if (!isAllDay) {
                    setShowTimePicker(false);
                  }
                }}
              >
                <View style={[styles.checkbox, isAllDay && styles.checkboxActive]}>
                  {isAllDay && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.allDayText, { color: theme.text }]}>Heldag</Text>
              </TouchableOpacity>

              {!isAllDay && (
                <>
                  <TouchableOpacity
                    style={[styles.timePickerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => setShowTimePicker(!showTimePicker)}
                  >
                    <Text style={{ color: theme.text, fontSize: 16 }}>
                      🕐 {selectedHour}:{selectedMinute}
                    </Text>
                  </TouchableOpacity>

                  {showTimePicker && (
                    <View style={[styles.timePickerContainer, { backgroundColor: theme.card }]}>
                      <View style={styles.timePickerRow}>
                        {/* Timmar */}
                        <View style={styles.timePickerColumn}>
                          <Text style={[styles.pickerLabel, { color: theme.text }]}>Timme</Text>
                          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                              <TouchableOpacity
                                key={hour}
                                style={[
                                  styles.pickerItem,
                                  selectedHour === hour && styles.pickerItemActive,
                                  { borderColor: theme.border }
                                ]}
                                onPress={() => setSelectedHour(hour)}
                              >
                                <Text style={[
                                  styles.pickerItemText,
                                  { color: theme.text },
                                  selectedHour === hour && styles.pickerItemTextActive
                                ]}>{hour}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        <Text style={[styles.timeSeparator, { color: theme.text }]}>:</Text>

                        {/* Minuter */}
                        <View style={styles.timePickerColumn}>
                          <Text style={[styles.pickerLabel, { color: theme.text }]}>Minut</Text>
                          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                            {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')).map(minute => (
                              <TouchableOpacity
                                key={minute}
                                style={[
                                  styles.pickerItem,
                                  selectedMinute === minute && styles.pickerItemActive,
                                  { borderColor: theme.border }
                                ]}
                                onPress={() => setSelectedMinute(minute)}
                              >
                                <Text style={[
                                  styles.pickerItemText,
                                  { color: theme.text },
                                  selectedMinute === minute && styles.pickerItemTextActive
                                ]}>{minute}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}

              <Text style={styles.inputLabel}>Beskrivning</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Valfri beskrivning..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.success }]} onPress={addEvent}>
                  <Text style={[styles.saveButtonText, { color: theme.textInverse }]}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  addIcon: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  syncButton: {
    backgroundColor: "#3949ab",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  phoneLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    fontSize: 20,
    color: "#3949ab",
    fontWeight: "bold",
  },
  monthTitle: {
    flex: 1,
    alignItems: "center",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  weekdaysContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayCell: {
    width: "14.28%",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  selectedDay: {
    backgroundColor: "#3949ab",
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  todayText: {
    color: "#3949ab",
    fontWeight: "bold",
  },
  eventDot: {
    position: "absolute",
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  selectedEventDot: {
    backgroundColor: "#fff",
  },
  eventsSection: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  noEventsContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noEventsText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  eventCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3949ab",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  deleteButtonText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventTime: {
    fontSize: 14,
    color: "#3949ab",
    fontWeight: "500",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 20,
    color: "#6b7280",
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#1f2937",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
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
  saveButton: {
    flex: 1,
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
  allDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3949ab',
    borderColor: '#3949ab',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  allDayText: {
    fontSize: 16,
    color: '#374151',
  },
  timePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  timePickerContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#6b7280',
  },
  pickerScroll: {
    maxHeight: 150,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  pickerItemActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#3949ab',
  },
  pickerItemText: {
    fontSize: 18,
    color: '#374151',
  },
  pickerItemTextActive: {
    color: '#3949ab',
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#6b7280',
  },
});

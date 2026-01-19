import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import HeaderView from '../../components/common/HeaderView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';

const STORAGE_KEY = '@visitors';

export default function VisitorsPage({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [visitors, setVisitors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [isAllDay, setIsAllDay] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    notes: '',
  });

  useEffect(() => {
    loadVisitors();
    loadAllContacts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVisitors();
    setRefreshing(false);
  };

  const loadAllContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') return;

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length > 0) {
        const sortedContacts = data
          .filter(contact => contact.name && contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        setContacts(sortedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert(t('error.title'), t('error.loadContacts'));
    }
  };

  const loadVisitors = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setVisitors(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading visitors:', error);
      Alert.alert(t('error.title'), t('error.loadVisitors'));
    }
  };

  const saveVisitors = async (newVisitors) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newVisitors));
      setVisitors(newVisitors);
    } catch (error) {
      console.error('Error saving visitors:', error);
      Alert.alert(t('error.title'), t('error.saveVisitor'));
    }
  };

  const selectContactFromDropdown = (contact) => {
    const phone = contact.phoneNumbers[0]?.number || '';
    setFormData({
      ...formData,
      name: contact.name || '',
      phone: phone.replace(/\s/g, ''),
    });
    setShowContactDropdown(false);
  };

  const handleNameChange = (text) => {
    setFormData({ ...formData, name: text });
    if (text.length > 0) {
      setShowContactDropdown(true);
    } else {
      setShowContactDropdown(false);
    }
  };

  const filteredContactSuggestions = contacts.filter(contact =>
    contact.name.toLowerCase().includes(formData.name.toLowerCase())
  ).slice(0, 5);

  const openAddModal = () => {
    setEditingVisitor(null);
    setFormData({
      name: '',
      phone: '',
      date: '',
      time: '',
      notes: '',
    });
    setSelectedDate(new Date());
    setSelectedTime(new Date());
    setModalVisible(true);
  };

  const openEditModal = (visitor) => {
    setEditingVisitor(visitor);
    setFormData(visitor);
    
    // Sätt datum och tid om de finns
    if (visitor.date) {
      setSelectedDate(new Date(visitor.date));
    }
    if (visitor.time) {
      const [hours, minutes] = visitor.time.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes));
      setSelectedTime(timeDate);
    }
    
    setModalVisible(true);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      const dateStr = date.toISOString().split('T')[0];
      setFormData({ ...formData, date: dateStr });
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTime(time);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      setFormData({ ...formData, time: `${hours}:${minutes}` });
    }
  };

  const addToCalendar = async (visitor) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        return;
      }

      // Skapa datum och tid för händelsen
      let startDate = new Date();
      let endDate = new Date();

      if (visitor.date) {
        startDate = new Date(visitor.date);
        endDate = new Date(visitor.date);
      }

      if (visitor.time) {
        const [hours, minutes] = visitor.time.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        endDate.setHours(parseInt(hours) + 1, parseInt(minutes), 0, 0); // 1 timme duration
      } else {
        startDate.setHours(12, 0, 0, 0); // Standard kl 12:00
        endDate.setHours(13, 0, 0, 0);
      }

      const eventDetails = {
        title: `Besök: ${visitor.name}`,
        startDate: startDate,
        endDate: endDate,
        notes: visitor.notes || '',
        location: visitor.phone ? `Telefon: ${visitor.phone}` : '',
      };

      await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
      
      // Uppdatera även lokala kalendern i appen
      const CALENDAR_KEY = '@calendar_events';
      const storedEvents = await AsyncStorage.getItem(CALENDAR_KEY);
      const events = storedEvents ? JSON.parse(storedEvents) : [];
      
      const newEvent = {
        id: Date.now().toString(),
        title: `Besök: ${visitor.name}`,
        date: visitor.date || new Date().toISOString().split('T')[0],
        time: visitor.time || '12:00',
        description: visitor.notes || '',
        color: '#9c27b0', // Lila för besökare
      };
      
      await AsyncStorage.setItem(CALENDAR_KEY, JSON.stringify([...events, newEvent]));
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(t('error.title'), t('error.addToCalendar'));
    }
  };

  const handleSaveVisitor = async () => {
    if (!formData.name.trim()) {
      Alert.alert(t('error.nameMissing'), t('error.enterVisitorName'));
      return;
    }

    if (editingVisitor) {
      const updated = visitors.map(v => 
        v.id === editingVisitor.id ? { ...formData, id: v.id } : v
      );
      saveVisitors(updated);
    } else {
      const newVisitor = {
        ...formData,
        id: Date.now().toString(),
      };
      saveVisitors([...visitors, newVisitor]);
      
      // Lägg till i kalender om datum finns
      if (newVisitor.date) {
        await addToCalendar(newVisitor);
        Alert.alert(
          'Besökare tillagd!',
          'Besökaren har lagts till både i listan och i din kalender.',
          [{ text: 'OK' }]
        );
      }
    }

    setModalVisible(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Ta bort besökare',
      'Är du säker på att du vill ta bort denna besökare?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: () => {
            const filtered = visitors.filter(v => v.id !== id);
            saveVisitors(filtered);
          },
        },
      ]
    );
  };



  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <HeaderView
      title={t('visitors.title')}
      subtitle={`${visitors.length} ${visitors.length === 1 ? 'besökare' : 'besökare'}`}
      navigation={navigation}
    >

      {/* Content */}
      <View style={[styles.content, { backgroundColor: theme.background }]}>
        {visitors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Inga besökare ännu</Text>
            <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
              Här kan du hålla koll på vem som kommer på besök och när.
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.listContainer} 
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          >
            {visitors.map((visitor) => (
              <TouchableOpacity
                key={visitor.id}
                style={[styles.visitorCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => openEditModal(visitor)}
              >
                <View style={styles.visitorHeader}>
                  <View style={styles.visitorInfo}>
                    <Text style={[styles.visitorName, { color: theme.text }]}>{visitor.name}</Text>
                    {visitor.phone && (
                      <Text style={[styles.visitorPhone, { color: theme.textSecondary }]}>
                        📞 {visitor.phone}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: theme.error }]}
                    onPress={() => handleDelete(visitor.id)}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {(visitor.date || visitor.time) && (
                  <View style={styles.visitorDateTime}>
                    {visitor.date && (
                      <Text style={[styles.visitorDate, { color: theme.accent }]}>
                        📅 {formatDate(visitor.date)}
                      </Text>
                    )}
                    {visitor.time && (
                      <Text style={[styles.visitorTime, { color: theme.accent }]}>
                        🕐 {visitor.time}
                      </Text>
                    )}
                  </View>
                )}

                {visitor.notes && (
                  <Text style={[styles.visitorNotes, { color: theme.textSecondary }]} numberOfLines={2}>
                    {visitor.notes}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openAddModal}
        >
          <Text style={[styles.addButtonText, { color: theme.textInverse }]}>+ Lägg till besökare</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {editingVisitor ? 'Redigera besökare' : 'Ny besökare'}
                </Text>

                <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Namn *</Text>
                <View style={styles.autocompleteContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: theme.background, 
                        color: theme.text,
                        borderColor: theme.border,
                      }
                    ]}
                    placeholder={t('placeholder.startTypingName')}
                    placeholderTextColor={theme.textTertiary}
                    value={formData.name}
                    onChangeText={handleNameChange}
                    onFocus={() => formData.name.length > 0 && setShowContactDropdown(true)}
                  />
                  
                  {showContactDropdown && filteredContactSuggestions.length > 0 && (
                    <View style={[styles.dropdown, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                        {filteredContactSuggestions.map((contact) => (
                          <TouchableOpacity
                            key={contact.id}
                            style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                            onPress={() => selectContactFromDropdown(contact)}
                          >
                            <Text style={[styles.dropdownItemName, { color: theme.text }]}>{contact.name}</Text>
                            {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                              <Text style={[styles.dropdownItemPhone, { color: theme.textSecondary }]}>
                                {contact.phoneNumbers[0].number}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Telefon</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.background, 
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder={t('placeholder.phone')}
                  placeholderTextColor={theme.textTertiary}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Datum</Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.datePickerButton,
                    { 
                      backgroundColor: theme.background, 
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.datePickerText, { color: formData.date ? theme.text : theme.textTertiary }]}>
                    {formData.date || 'Välj datum'}
                  </Text>
                  <Text style={styles.pickerIcon}>📅</Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Tid</Text>
                
                {/* Heldag-toggle */}
                <TouchableOpacity 
                  style={styles.allDayToggle}
                  onPress={() => {
                    const newIsAllDay = !isAllDay;
                    setIsAllDay(newIsAllDay);
                    if (newIsAllDay) {
                      setShowCustomTimePicker(false);
                      setFormData({ ...formData, time: 'Heldag' });
                    } else {
                      setFormData({ ...formData, time: `${selectedHour}:${selectedMinute}` });
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
                      onPress={() => setShowCustomTimePicker(!showCustomTimePicker)}
                    >
                      <Text style={{ color: theme.text, fontSize: 16 }}>
                        🕐 {selectedHour}:{selectedMinute}
                      </Text>
                    </TouchableOpacity>

                    {showCustomTimePicker && (
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
                                  onPress={() => {
                                    setSelectedHour(hour);
                                    setFormData({ ...formData, time: `${hour}:${selectedMinute}` });
                                  }}
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
                                  onPress={() => {
                                    setSelectedMinute(minute);
                                    setFormData({ ...formData, time: `${selectedHour}:${minute}` });
                                  }}
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
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Anteckningar</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { 
                      backgroundColor: theme.background, 
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder={t('placeholder.extraInfo')}
                  placeholderTextColor={theme.textTertiary}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.success }]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, { color: theme.textInverse }]}>Spara</Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


    </HeaderView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  listContainer: {
    flex: 1,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  visitorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  visitorPhone: {
    fontSize: 14,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  visitorDateTime: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  visitorDate: {
    fontSize: 14,
    marginRight: 16,
  },
  visitorTime: {
    fontSize: 14,
  },
  visitorNotes: {
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalForm: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1001,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dropdownItemPhone: {
    fontSize: 14,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
  },
  pickerIcon: {
    fontSize: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    opacity: 0.8,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
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

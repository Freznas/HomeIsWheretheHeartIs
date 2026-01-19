import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('sv'); // 'sv' eller 'en'

  // Ladda sparad språkinställning
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('@app_language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = language === 'sv' ? 'en' : 'sv';
    setLanguage(newLanguage);
    try {
      await AsyncStorage.setItem('@app_language', newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Översättningar
const translations = {
  sv: {
    // Header
    'header.home': 'Home is Where the Hearth is',
    'header.welcome': 'Välkommen',
    'header.guest': 'Gäst',
    
    // Navigation
    'nav.home': 'Hem',
    'nav.back': 'Tillbaka',
    'nav.profile': 'Profil',
    'nav.support': 'Support',
    
    // Home sections
    'home.upcomingEvents': 'Kommande Händelser',
    'home.calendar': 'Kalender',
    'home.weather': 'Väder',
    'home.pantry': 'Skafferi',
    'home.shoppingList': 'Inköpslista',
    'home.chores': 'Sysslor',
    'home.bills': 'Räkningar',
    'home.notes': 'Anteckningar',
    'home.visitors': 'Besökare',
    'home.seeAll': 'Se alla',
    'home.noEvents': 'Inga kommande händelser',
    'home.addEvent': 'Tryck på "Se alla" för att lägga till',
    'home.loadingEvents': 'Laddar händelser...',
    
    // Calendar
    'calendar.title': 'Kalender',
    'calendar.event': 'händelse',
    'calendar.events': 'händelser',
    'calendar.noEvents': 'Inga händelser',
    'calendar.today': 'Idag',
    'calendar.tomorrow': 'Imorgon',
    'calendar.addEvent': 'Lägg till händelse',
    'calendar.editEvent': 'Redigera händelse',
    'calendar.eventName': 'Händelsenamn',
    'calendar.date': 'Datum',
    'calendar.time': 'Tid (valfritt)',
    'calendar.syncPhone': 'Synka med telefonkalender',
    'calendar.syncing': 'Synkar...',
    'calendar.newEvents': 'nya händelser',
    'calendar.duplicatesSkipped': 'dubbletter hoppades över',
    
    // Bills
    'bills.title': 'Räkningar',
    'bills.add': 'Lägg till räkning',
    'bills.edit': 'Redigera räkning',
    'bills.name': 'Räkningsnamn',
    'bills.amount': 'Belopp',
    'bills.dueDate': 'Förfallodatum',
    'bills.status': 'Status',
    'bills.paid': 'Betald',
    'bills.unpaid': 'Ej betald',
    'bills.attention': 'Uppmärksamhet',
    'bills.noBills': 'Inga räkningar',
    'bills.noUnpaid': 'Inga obetalda räkningar',
    'bills.bill': 'räkning',
    'bills.bills': 'räkningar',
    'bills.nextBill': 'Nästa räkning',
    'bills.today': 'Idag!',
    'bills.tomorrow': 'Imorgon',
    'bills.daysAgo': 'dagar sen',
    'bills.inDays': 'Om',
    'bills.days': 'dagar',
    'bills.noBills': 'Inga räkningar',
    'bills.nextBill': 'Nästa räkning',
    'bills.daysAgo': 'dagar sen',
    'bills.daysLeft': 'Om X dagar',
    
    // Chores
    'chores.title': 'Sysslor',
    'chores.add': 'Lägg till syssla',
    'chores.edit': 'Redigera syssla',
    'chores.name': 'Sysselnamn',
    'chores.assignedTo': 'Tilldelad till',
    'chores.completed': 'Genomförd',
    'chores.pending': 'Väntande',
    'chores.noChores': 'Inga sysslor',
    'chores.task': 'uppgift',
    'chores.tasks': 'uppgifter',
    'chores.next': 'Nästa:',
    'chores.noActive': 'Inga aktiva sysslor',
    'chores.ongoing': 'Pågår',
    'chores.noChores': 'Inga sysslor',
    
    // Notes
    'notes.title': 'Anteckningar',
    'notes.add': 'Lägg till anteckning',
    'notes.edit': 'Redigera anteckning',
    'notes.noteTitle': 'Titel',
    'notes.content': 'Anteckning',
    'notes.noNotes': 'Inga anteckningar',
    
    // Pantry
    'pantry.title': 'Skafferi',
    'pantry.add': 'Lägg till vara',
    'pantry.edit': 'Redigera vara',
    'pantry.itemName': 'Varunamn',
    'pantry.quantity': 'Antal/Mängd',
    'pantry.category': 'Kategori',
    'pantry.noItems': 'Inget i skafferiet',
    
    // Shopping List
    'shopping.title': 'Inköpslista',
    'shopping.add': 'Lägg till vara',
    'shopping.edit': 'Redigera vara',
    'shopping.itemName': 'Varunamn',
    'shopping.quantity': 'Antal/Mängd',
    'shopping.noItems': 'Inköpslistan är tom',
    'shopping.itemsLeft': 'varor kvar',
    
    // Visitors
    'visitors.title': 'Besökare',
    'visitors.add': 'Registrera besökare',
    'visitors.edit': 'Redigera besökare',
    'visitors.name': 'Namn',
    'visitors.date': 'Datum',
    'visitors.purpose': 'Syfte',
    'visitors.noVisitors': 'Inga registrerade besökare',
    
    // Communication
    'chat.title': 'Kommunikation',
    'chat.typeMessage': 'Skriv meddelande...',
    'chat.send': 'Skicka',
    'chat.noMessages': 'Inga meddelanden än',
    
    // Support
    'support.title': 'Support & Info',
    'support.appName': 'Home Is Where The Heart Is',
    'support.version': 'Version 1.0.0 (Beta)',
    'support.inDevelopment': 'App Under Utveckling',
    'support.inDevText': 'Denna app är fortfarande under aktiv utveckling. Vi jobbar kontinuerligt med att förbättra funktionalitet, fixa buggar och lägga till nya funktioner för att göra din hushållshantering så smidig som möjligt.',
    'support.feedback': 'Din Feedback Uppskattas',
    'support.feedbackText': 'Vi värdesätter din åsikt! Om du stöter på problem, har förslag på förbättringar eller vill dela dina tankar om appen, tveka inte att kontakta oss. Din feedback hjälper oss att göra appen bättre.',
    'support.sendFeedback': 'Skicka Feedback',
    'support.features': 'Funktioner',
    'support.upcomingFeatures': 'Kommande Funktioner',
    'support.thankYou': 'Tack för att du använder vår app!',
    'support.copyright': '© 2025 Home Is Where The Heart Is',
    
    // Weather
    'weather.title': 'Väder',
    'weather.clearSky': 'Klar himmel',
    'weather.mostlyClear': 'Mestadels klart',
    'weather.partlyCloudy': 'Delvis molnigt',
    'weather.overcast': 'Mulet',
    'weather.fog': 'Dimma',
    'weather.rime': 'Rimfrost',
    'weather.lightDrizzle': 'Lätt duggregn',
    'weather.drizzle': 'Duggregn',
    'weather.heavyDrizzle': 'Kraftigt duggregn',
    'weather.lightRain': 'Lätt regn',
    'weather.rain': 'Regn',
    'weather.heavyRain': 'Kraftigt regn',
    'weather.lightSnow': 'Lätt snöfall',
    'weather.snow': 'Snöfall',
    'weather.heavySnow': 'Kraftigt snöfall',
    'weather.snowGrains': 'Snökorn',
    'weather.lightShowers': 'Lätta regnskurar',
    'weather.showers': 'Regnskurar',
    'weather.heavyShowers': 'Kraftiga regnskurar',
    'weather.snowShowers': 'Snöbyar',
    'weather.heavySnowShowers': 'Kraftiga snöbyar',
    'weather.thunderstorm': 'Åskväder',
    'weather.thunderstormHail': 'Åska med hagel',
    'weather.severeThunderstorm': 'Kraftig åska med hagel',
    'weather.unknown': 'Okänt väder',
    'weather.loading': 'Laddar väder...',
    'weather.error': 'Kunde inte hämta väder',
    
    // Common
    'common.save': 'Spara',
    'common.cancel': 'Avbryt',
    'common.delete': 'Ta bort',
    'common.edit': 'Redigera',
    'common.add': 'Lägg till',
    'common.loading': 'Laddar...',
    'common.error': 'Fel',
    'common.success': 'Lyckades',
    'common.confirm': 'Bekräfta',
    'common.yes': 'Ja',
    'common.no': 'Nej',
    'common.done': 'Klar',
    'common.select': 'Välj',
    
    // Validation
    'validation.required': 'Detta fält är obligatoriskt',
    'validation.fillName': 'Fyll i namn',
    'validation.fillAmount': 'Fyll i belopp',
    'validation.fillTitle': 'Fyll i titel',
    'validation.fillContent': 'Fyll i anteckning',
    
    // Errors & Alerts
    'error.title': 'Fel',
    'error.loadContacts': 'Kunde inte läsa kontakter',
    'error.loadVisitors': 'Kunde inte ladda besökare',
    'error.saveVisitor': 'Kunde inte spara besökare',
    'error.addToCalendar': 'Kunde inte lägga till i kalendern',
    'error.nameMissing': 'Namn saknas',
    'error.enterVisitorName': 'Ange namnet på besökaren',
    'error.needHousehold': 'Du måste vara med i ett hushåll',
    'error.needHouseholdToAdd': 'Du måste vara med i ett hushåll för att lägga till varor',
    'error.addItem': 'Kunde inte lägga till vara',
    'error.removeItem': 'Kunde inte ta bort vara',
    'error.loadHousehold': 'Kunde inte ladda hushållsinformation',
    'error.shareInvite': 'Kunde inte dela inbjudningskod',
    'error.leaveHousehold': 'Kunde inte lämna hushållet',
    'error.removeMember': 'Kunde inte ta bort medlem',
    'error.fieldsMissing': 'Fält saknas',
    'error.fillRequired': 'Fyll i alla obligatoriska fält',
    'error.passwordMismatch': 'Lösenord matchar inte',
    'error.passwordMatch': 'Kontrollera att båda lösenorden är samma',
    'error.weakPassword': 'Svagt lösenord',
    'error.passwordMinLength': 'Lösenordet måste vara minst 6 tecken',
    'error.registrationFailed': 'Registrering misslyckades',
    'error.invalidCredential': 'Fel email eller lösenord',
    'error.invalidEmail': 'Ogiltig email-adress',
    
    // Placeholders
    'placeholder.startTypingName': 'Börja skriva namn...',
    'placeholder.phone': 'Telefonnummer',
    'placeholder.extraInfo': 'Extra information...',
    'placeholder.items': 'T.ex. Mjölk, Bröd...',
    'placeholder.quantity': 'Antal',
    'placeholder.yourName': 'Ditt namn',
    'placeholder.currentPassword': 'Nuvarande lösenord',
    'placeholder.newPassword': 'Nytt lösenord',
    'placeholder.confirmPassword': 'Bekräfta lösenord',
    'placeholder.email': 'din@email.com',
    'placeholder.password': '••••••••',
    'placeholder.householdName': 'T.ex. Familjen Andersson',
    'placeholder.inviteCode': '000000',
    'placeholder.minChars': 'Minst 4 tecken',
    'placeholder.reenterPassword': 'Skriv lösenordet igen',
    
    // Profile
    'profile.title': 'Profil',
    'profile.information': 'Information',
    'profile.name': 'Namn',
    'profile.email': 'E-post',
    'profile.emailVerified': '✓ Verifierad',
    'profile.emailNotVerified': '⚠️ Ej verifierad - Skicka om',
    'profile.role': 'Roll',
    'profile.admin': 'Admin',
    'profile.member': 'Medlem',
    'profile.memberSince': 'Medlem sedan',
  },
  
  en: {
    // Header
    'header.home': 'Home is Where the Hearth is',
    'header.welcome': 'Welcome',
    'header.guest': 'Guest',
    
    // Navigation
    'nav.home': 'Home',
    'nav.back': 'Back',
    'nav.profile': 'Profile',
    'nav.support': 'Support',
    
    // Home sections
    'home.upcomingEvents': 'Upcoming Events',
    'home.calendar': 'Calendar',
    'home.weather': 'Weather',
    'home.pantry': 'Pantry',
    'home.shoppingList': 'Shopping List',
    'home.chores': 'Chores',
    'home.bills': 'Bills',
    'home.notes': 'Notes',
    'home.visitors': 'Visitors',
    'home.seeAll': 'See all',
    'home.noEvents': 'No upcoming events',
    'home.addEvent': 'Tap "See all" to add',
    'home.loadingEvents': 'Loading events...',
    
    // Calendar
    'calendar.title': 'Calendar',
    'calendar.event': 'event',
    'calendar.events': 'events',
    'calendar.noEvents': 'No events',
    'calendar.today': 'Today',
    'calendar.tomorrow': 'Tomorrow',
    'calendar.addEvent': 'Add Event',
    'calendar.editEvent': 'Edit Event',
    'calendar.eventName': 'Event Name',
    'calendar.date': 'Date',
    'calendar.time': 'Time (optional)',
    'calendar.syncPhone': 'Sync with phone calendar',
    'calendar.syncing': 'Syncing...',
    'calendar.newEvents': 'new events',
    'calendar.duplicatesSkipped': 'duplicates skipped',
    
    // Bills
    'bills.title': 'Bills',
    'bills.add': 'Add Bill',
    'bills.edit': 'Edit Bill',
    'bills.name': 'Bill Name',
    'bills.amount': 'Amount',
    'bills.dueDate': 'Due Date',
    'bills.status': 'Status',
    'bills.paid': 'Paid',
    'bills.unpaid': 'Unpaid',
    'bills.attention': 'Attention',
    'bills.noBills': 'No bills',
    'bills.noUnpaid': 'No unpaid bills',
    'bills.bill': 'bill',
    'bills.bills': 'bills',
    'bills.nextBill': 'Next Bill',
    'bills.today': 'Today!',
    'bills.tomorrow': 'Tomorrow',
    'bills.daysAgo': 'days ago',
    'bills.inDays': 'In',
    'bills.days': 'days',
    
    // Chores
    'chores.title': 'Chores',
    'chores.add': 'Add Chore',
    'chores.edit': 'Edit Chore',
    'chores.name': 'Chore Name',
    'chores.assignedTo': 'Assigned To',
    'chores.completed': 'Completed',
    'chores.pending': 'Pending',
    'chores.noChores': 'No chores',
    'chores.task': 'task',
    'chores.tasks': 'tasks',
    'chores.next': 'Next:',
    'chores.noActive': 'No active chores',
    'chores.ongoing': 'Ongoing',
    
    // Notes
    'notes.title': 'Notes',
    'notes.add': 'Add Note',
    'notes.edit': 'Edit Note',
    'notes.noteTitle': 'Title',
    'notes.content': 'Content',
    'notes.noNotes': 'No notes',
    
    // Pantry
    'pantry.title': 'Pantry',
    'pantry.add': 'Add Item',
    'pantry.edit': 'Edit Item',
    'pantry.itemName': 'Item Name',
    'pantry.quantity': 'Quantity',
    'pantry.category': 'Category',
    'pantry.noItems': 'Pantry is empty',
    
    // Shopping List
    'shopping.title': 'Shopping List',
    'shopping.add': 'Add Item',
    'shopping.edit': 'Edit Item',
    'shopping.itemName': 'Item Name',
    'shopping.quantity': 'Quantity',
    'shopping.noItems': 'Shopping list is empty',
    'shopping.itemsLeft': 'items left',
    
    // Visitors
    'visitors.title': 'Visitors',
    'visitors.add': 'Register Visitor',
    'visitors.edit': 'Edit Visitor',
    'visitors.name': 'Name',
    'visitors.date': 'Date',
    'visitors.purpose': 'Purpose',
    'visitors.noVisitors': 'No registered visitors',
    
    // Communication
    'chat.title': 'Communication',
    'chat.typeMessage': 'Type message...',
    'chat.send': 'Send',
    'chat.noMessages': 'No messages yet',
    
    // Support
    'support.title': 'Support & Info',
    'support.appName': 'Home Is Where The Heart Is',
    'support.version': 'Version 1.0.0 (Beta)',
    'support.inDevelopment': 'App Under Development',
    'support.inDevText': 'This app is still under active development. We are continuously working to improve functionality, fix bugs and add new features to make your household management as smooth as possible.',
    'support.feedback': 'Your Feedback is Appreciated',
    'support.feedbackText': 'We value your opinion! If you encounter problems, have suggestions for improvements or want to share your thoughts about the app, do not hesitate to contact us. Your feedback helps us make the app better.',
    'support.sendFeedback': 'Send Feedback',
    'support.features': 'Features',
    'support.upcomingFeatures': 'Upcoming Features',
    'support.thankYou': 'Thank you for using our app!',
    'support.copyright': '© 2025 Home Is Where The Heart Is',
    
    // Weather
    'weather.title': 'Weather',
    'weather.clearSky': 'Clear sky',
    'weather.mostlyClear': 'Mostly clear',
    'weather.partlyCloudy': 'Partly cloudy',
    'weather.overcast': 'Overcast',
    'weather.fog': 'Fog',
    'weather.rime': 'Rime',
    'weather.lightDrizzle': 'Light drizzle',
    'weather.drizzle': 'Drizzle',
    'weather.heavyDrizzle': 'Heavy drizzle',
    'weather.lightRain': 'Light rain',
    'weather.rain': 'Rain',
    'weather.heavyRain': 'Heavy rain',
    'weather.lightSnow': 'Light snow',
    'weather.snow': 'Snow',
    'weather.heavySnow': 'Heavy snow',
    'weather.snowGrains': 'Snow grains',
    'weather.lightShowers': 'Light showers',
    'weather.showers': 'Showers',
    'weather.heavyShowers': 'Heavy showers',
    'weather.snowShowers': 'Snow showers',
    'weather.heavySnowShowers': 'Heavy snow showers',
    'weather.thunderstorm': 'Thunderstorm',
    'weather.thunderstormHail': 'Thunderstorm with hail',
    'weather.severeThunderstorm': 'Severe thunderstorm with hail',
    'weather.unknown': 'Unknown weather',
    'weather.loading': 'Loading weather...',
    'weather.error': 'Could not fetch weather',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.done': 'Done',
    'common.select': 'Select',
    
    // Validation
    'validation.required': 'This field is required',
    'validation.fillName': 'Fill in name',
    'validation.fillAmount': 'Fill in amount',
    'validation.fillTitle': 'Fill in title',
    'validation.fillContent': 'Fill in content',
    
    // Errors & Alerts
    'error.title': 'Error',
    'error.loadContacts': 'Could not read contacts',
    'error.loadVisitors': 'Could not load visitors',
    'error.saveVisitor': 'Could not save visitor',
    'error.addToCalendar': 'Could not add to calendar',
    'error.nameMissing': 'Name missing',
    'error.enterVisitorName': 'Enter visitor name',
    'error.needHousehold': 'You must be part of a household',
    'error.needHouseholdToAdd': 'You must be part of a household to add items',
    'error.addItem': 'Could not add item',
    'error.removeItem': 'Could not remove item',
    'error.loadHousehold': 'Could not load household information',
    'error.shareInvite': 'Could not share invitation code',
    'error.leaveHousehold': 'Could not leave household',
    'error.removeMember': 'Could not remove member',
    'error.fieldsMissing': 'Fields missing',
    'error.fillRequired': 'Fill in all required fields',
    'error.passwordMismatch': 'Passwords do not match',
    'error.passwordMatch': 'Check that both passwords are the same',
    'error.weakPassword': 'Weak password',
    'error.passwordMinLength': 'Password must be at least 6 characters',
    'error.registrationFailed': 'Registration failed',
    'error.invalidCredential': 'Invalid email or password',
    'error.invalidEmail': 'Invalid email address',
    
    // Placeholders
    'placeholder.startTypingName': 'Start typing name...',
    'placeholder.phone': 'Phone number',
    'placeholder.extraInfo': 'Extra information...',
    'placeholder.items': 'E.g. Milk, Bread...',
    'placeholder.quantity': 'Quantity',
    'placeholder.yourName': 'Your name',
    'placeholder.currentPassword': 'Current password',
    'placeholder.newPassword': 'New password',
    'placeholder.confirmPassword': 'Confirm password',
    'placeholder.email': 'your@email.com',
    'placeholder.password': '••••••••',
    'placeholder.householdName': 'E.g. The Andersons',
    'placeholder.inviteCode': '000000',
    'placeholder.minChars': 'At least 4 characters',
    'placeholder.reenterPassword': 'Re-enter password',
    
    // Profile
    'profile.title': 'Profile',
    'profile.information': 'Information',
    'profile.name': 'Name',
    'profile.email': 'Email',
    'profile.emailVerified': '✓ Verified',
    'profile.emailNotVerified': '⚠️ Not verified - Resend',
    'profile.role': 'Role',
    'profile.admin': 'Admin',
    'profile.member': 'Member',
    'profile.memberSince': 'Member since',
  },
};

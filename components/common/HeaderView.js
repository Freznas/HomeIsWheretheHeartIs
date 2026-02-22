import React from "react";
import { View, Text, ScrollView, StatusBar, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import OfflineBanner from './OfflineBanner';

import styles from "./Header.Styles"
const HeaderView = ({ 
  style, 
  contentContainerStyle, 
  children, 
  navigation,
  title = "Mitt Hushåll",
  rightButtons
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  
  // SafeArea + Android-statusbar
  const safeAreaStyle = [
    styles.safe,
    style,
    { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }
  ];

  return (
    <SafeAreaView style={safeAreaStyle}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.headerBackground} 
      />
      
      {/* Header */}
      <View style={[styles.container, { backgroundColor: theme.headerBackground }]}>
        {/* Back-knapp vänster */}
        {navigation && (
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}

        {/* Tema, Språk, Support och Profilikon höger */}
        <View style={styles.rightButtons}>
          <TouchableOpacity 
            style={[styles.themeButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
            onPress={toggleTheme}
          >
            <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.languageButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
            onPress={toggleLanguage}
          >
            <Text style={styles.languageIcon}>{language === 'sv' ? '🇬🇧' : '🇸🇪'}</Text>
          </TouchableOpacity>
          {navigation && (
            <TouchableOpacity 
              style={[styles.supportButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
              onPress={() => navigation.navigate('SupportPage')}
            >
              <Text style={styles.supportIcon}>❓</Text>
            </TouchableOpacity>
          )}
          {navigation && (
            <TouchableOpacity 
              style={[styles.profileButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          )}
          {rightButtons}
        </View>
        
        {/* Titel och greeting */}
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.headerText }]}>
            {title}
          </Text>
        </View>
      </View>

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Content without ScrollView - let each screen handle its own scrolling */}
      {children}
    </SafeAreaView>
  );
};

export default HeaderView;

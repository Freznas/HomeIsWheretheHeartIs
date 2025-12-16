import React from "react";
import { View, Text, ScrollView, StatusBar, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

import styles from "./Header.Styles"
const HeaderView = ({ 
  style, 
  contentContainerStyle, 
  children, 
  onBackPress, 
  onProfilePress,
  onSupportPress, 
  title = "Mitt Hushåll" // standardtitel
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
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
        {onBackPress && (
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
            onPress={onBackPress}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}

        {/* Support och Profilikon höger */}
        <View style={styles.rightButtons}>
          <TouchableOpacity 
            style={[styles.themeButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
            onPress={toggleTheme}
          >
            <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          {onSupportPress && (
            <TouchableOpacity 
              style={[styles.supportButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
              onPress={onSupportPress}
            >
              <Text style={styles.supportIcon}>❓</Text>
            </TouchableOpacity>
          )}
          {onProfilePress && (
            <TouchableOpacity 
              style={[styles.profileButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
              onPress={onProfilePress}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Titel och greeting */}
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.headerText }]}>
            {title}
          </Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={[styles.scroll, contentContainerStyle]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HeaderView;

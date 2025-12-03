import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🎨 Ljust tema
const lightTheme = {
  // Bakgrunder
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  modalBackground: '#ffffff',
  inputBackground: '#f5f5f5',
  
  // Text
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#ffffff',
  
  // Primära färger
  primary: '#3949ab',
  primaryDark: '#2c3a8f',
  primaryLight: '#5c6bc0',
  
  // Accent färger
  accent: '#00acc1',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  
  // Specifika komponenter
  headerBackground: '#3949ab',
  headerText: '#ffffff',
  border: '#e0e0e0',
  shadow: '#000000',
  placeholder: '#aaaaaa',
  
  // Status badge färger
  statusActive: '#4caf50',
  statusWarning: '#ff9800',
  statusInactive: '#bdbdbd',
};

// 🌙 Mörkt tema
const darkTheme = {
  // Bakgrunder
  background: '#121212',
  cardBackground: '#1e1e1e',
  modalBackground: '#2d2d2d',
  inputBackground: '#383838',
  
  // Text
  text: '#e0e0e0',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  textInverse: '#121212',
  
  // Primära färger
  primary: '#5c6bc0',
  primaryDark: '#3949ab',
  primaryLight: '#7986cb',
  
  // Accent färger
  accent: '#26c6da',
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350',
  
  // Specifika komponenter
  headerBackground: '#1e1e1e',
  headerText: '#e0e0e0',
  border: '#383838',
  shadow: '#000000',
  placeholder: '#707070',
  
  // Status badge färger
  statusActive: '#66bb6a',
  statusWarning: '#ffa726',
  statusInactive: '#616161',
};

// Skapa Context
const ThemeContext = createContext();

// Theme Provider komponent
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ladda sparad tema-preferens vid start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    try {
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook för att använda tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

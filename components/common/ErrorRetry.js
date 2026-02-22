import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function ErrorRetry({ 
  message = 'Något gick fel när data skulle laddas',
  onRetry,
  icon = '⚠️'
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={onRetry}
        >
          <Text style={styles.buttonText}>Försök igen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

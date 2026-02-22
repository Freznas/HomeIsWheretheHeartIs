import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function VerificationBanner() {
  const { theme } = useTheme();
  const { currentUser, resendVerificationEmail, refreshUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Auto-refresh user status periodically to detect when email gets verified
  useEffect(() => {
    if (!currentUser?.emailVerified) {
      const interval = setInterval(async () => {
        await refreshUser();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentUser?.emailVerified, refreshUser]);

  // Visa inte banner om email är verifierad
  if (currentUser?.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    const result = await resendVerificationEmail();
    setSending(false);
    
    if (result.success) {
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    }
  };

  return (
    <View style={[styles.banner, { 
      backgroundColor: '#FFF3CD', 
      borderColor: '#FFC107',
      borderBottomColor: theme.border 
    }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Email inte verifierad</Text>
          <Text style={styles.description}>
            Verifiera din email för att använda alla funktioner
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.button, { 
          backgroundColor: sent ? '#28a745' : '#FFC107',
          opacity: sending ? 0.6 : 1
        }]}
        onPress={handleResend}
        disabled={sending || sent}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {sent ? '✓ Skickat!' : 'Skicka igen'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 16,
    borderWidth: 1,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

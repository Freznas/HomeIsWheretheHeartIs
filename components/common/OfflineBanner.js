import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOffline } from '../../context/OfflineContext';
import { useTheme } from '../../context/ThemeContext';

export default function OfflineBanner() {
  const { isOffline, pendingActions } = useOffline();
  const { theme } = useTheme();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.warning || '#f39c12' }]}>
      <Text style={styles.text}>
        📴 Offline-läge
        {pendingActions.length > 0 && ` • ${pendingActions.length} väntande`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

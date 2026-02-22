import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const TOAST_TYPES = {
  success: {
    icon: '✓',
    backgroundColor: '#10b981',
  },
  error: {
    icon: '✕',
    backgroundColor: '#ef4444',
  },
  warning: {
    icon: '⚠',
    backgroundColor: '#f59e0b',
  },
  info: {
    icon: 'ℹ',
    backgroundColor: '#3b82f6',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const animatedValues = useRef({}).current;

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // Skapa animation för denna toast
    animatedValues[id] = new Animated.Value(0);

    // Fade in
    Animated.spring(animatedValues[id], {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Auto remove efter duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }

    return id;
  };

  const hideToast = (id) => {
    // Fade out
    Animated.timing(animatedValues[id], {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete animatedValues[id];
    });
  };

  const success = (message, duration) => showToast(message, 'success', duration);
  const error = (message, duration) => showToast(message, 'error', duration);
  const warning = (message, duration) => showToast(message, 'warning', duration);
  const info = (message, duration) => showToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, warning, info }}>
      {children}
      <SafeAreaView style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => {
          const config = TOAST_TYPES[toast.type];
          const animatedStyle = {
            opacity: animatedValues[toast.id],
            transform: [
              {
                translateY: animatedValues[toast.id]?.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }) || 0,
              },
            ],
          };

          return (
            <Animated.View
              key={toast.id}
              style={[
                styles.toast,
                { backgroundColor: config.backgroundColor },
                animatedStyle,
              ]}
            >
              <TouchableOpacity
                style={styles.toastContent}
                onPress={() => hideToast(toast.id)}
                activeOpacity={0.9}
              >
                <Text style={styles.icon}>{config.icon}</Text>
                <Text style={styles.message} numberOfLines={3}>
                  {toast.message}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </SafeAreaView>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 16,
    zIndex: 9999,
  },
  toast: {
    minWidth: Dimensions.get('window').width * 0.9,
    maxWidth: Dimensions.get('window').width * 0.95,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 12,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 20,
  },
});

import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    // Lyssna på nätverksändringar
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);

      // Om vi kommer online, synka pending actions
      if (connected && pendingActions.length > 0) {
        syncPendingActions();
      }
    });

    // Ladda pending actions från storage
    loadPendingActions();

    return () => unsubscribe();
  }, []);

  const loadPendingActions = async () => {
    try {
      const stored = await AsyncStorage.getItem('@pending_actions');
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  };

  const savePendingActions = async (actions) => {
    try {
      await AsyncStorage.setItem('@pending_actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  };

  const addPendingAction = async (action) => {
    const newActions = [...pendingActions, { ...action, id: Date.now().toString(), timestamp: Date.now() }];
    setPendingActions(newActions);
    await savePendingActions(newActions);
  };

  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;
    
    const remainingActions = [];

    for (const action of pendingActions) {
      try {
        // Försök utföra action
        await action.execute();
      } catch (error) {
        console.error('Failed to sync action:', action.type, error);
        // Behåll action för nästa försök
        remainingActions.push(action);
      }
    }

    setPendingActions(remainingActions);
    await savePendingActions(remainingActions);
  };

  const clearPendingActions = async () => {
    setPendingActions([]);
    await AsyncStorage.removeItem('@pending_actions');
  };

  // Cache functions
  const cacheData = async (key, data) => {
    try {
      await AsyncStorage.setItem(`@cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  const getCachedData = async (key, maxAge = 3600000) => { // Default 1 hour
    try {
      const cached = await AsyncStorage.getItem(`@cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < maxAge) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error getting cached data:', error);
    }
    return null;
  };

  const clearCache = async (key) => {
    try {
      if (key) {
        await AsyncStorage.removeItem(`@cache_${key}`);
      } else {
        // Rensa all cache
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith('@cache_'));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const value = {
    isConnected,
    isOffline: !isConnected,
    pendingActions,
    addPendingAction,
    syncPendingActions,
    clearPendingActions,
    cacheData,
    getCachedData,
    clearCache,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

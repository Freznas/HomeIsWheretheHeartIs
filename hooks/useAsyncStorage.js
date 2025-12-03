import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🎯 Custom Hook för AsyncStorage - Kan användas på alla sidor
export const useAsyncStorage = (key, initialValue = null) => {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  // 📚 Ladda data när komponenten mountar
  useEffect(() => {
    loadStoredValue();
  }, [key]);

  // 📖 Läs data från AsyncStorage
  const loadStoredValue = async () => {
    try {
      setLoading(true);
      const item = await AsyncStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      setStoredValue(initialValue);
    } finally {
      setLoading(false);
    }
  };

  // 💾 Spara data till AsyncStorage
  const saveValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  // 🗑️ Ta bort data från AsyncStorage
  const removeValue = async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  };

  return [storedValue, saveValue, removeValue, loading];
};

// 🎯 Specifika hooks för olika data-typer
export const usePantryData = () => useAsyncStorage('pantry_items', []);
export const useShoppingListData = () => useAsyncStorage('shopping_list', []);
export const useChoresData = () => useAsyncStorage('chores', []);
export const useBillsData = () => useAsyncStorage('bills', []);
export const useNotesData = () => useAsyncStorage('notes', []);
export const useVisitorsData = () => useAsyncStorage('visitors', []);
export const useCommunicationData = () => useAsyncStorage('communication', []);
export const useCalendarData = () => useAsyncStorage('calendar', []);
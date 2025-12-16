import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import * as Location from 'expo-location';

export default function WeatherSection({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(true);
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error('Weather API error');
      }

      const data = await weatherResponse.json();
      const locationData = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const weatherCode = data.current.weather_code;
      const weatherInfo = getWeatherInfo(weatherCode);

      setWeatherData({
        temp: Math.round(data.current.temperature_2m),
        condition: weatherInfo.description,
        emoji: weatherInfo.emoji,
        location: locationData[0]?.city || locationData[0]?.region || 'Din plats',
      });
      setLoading(false);
    } catch (err) {
      console.error('Weather error:', err);
      setError(true);
      setLoading(false);
    }
  };

  const getWeatherInfo = (code) => {
    const weatherCodes = {
      0: { emoji: '☀️', description: 'Klar himmel' },
      1: { emoji: '🌤️', description: 'Mestadels klart' },
      2: { emoji: '⛅', description: 'Delvis molnigt' },
      3: { emoji: '☁️', description: 'Mulet' },
      45: { emoji: '🌫️', description: 'Dimma' },
      48: { emoji: '🌫️', description: 'Rimfrost' },
      51: { emoji: '🌦️', description: 'Lätt duggregn' },
      53: { emoji: '🌦️', description: 'Duggregn' },
      55: { emoji: '🌧️', description: 'Kraftigt duggregn' },
      61: { emoji: '🌧️', description: 'Lätt regn' },
      63: { emoji: '🌧️', description: 'Regn' },
      65: { emoji: '🌧️', description: 'Kraftigt regn' },
      71: { emoji: '🌨️', description: 'Lätt snöfall' },
      73: { emoji: '🌨️', description: 'Snöfall' },
      75: { emoji: '🌨️', description: 'Kraftigt snöfall' },
      77: { emoji: '🌨️', description: 'Snökorn' },
      80: { emoji: '🌦️', description: 'Lätta regnskurar' },
      81: { emoji: '🌧️', description: 'Regnskurar' },
      82: { emoji: '⛈️', description: 'Kraftiga regnskurar' },
      85: { emoji: '🌨️', description: 'Snöbyar' },
      86: { emoji: '🌨️', description: 'Kraftiga snöbyar' },
      95: { emoji: '⛈️', description: 'Åskväder' },
      96: { emoji: '⛈️', description: 'Åska med hagel' },
      99: { emoji: '⛈️', description: 'Kraftig åska med hagel' },
    };
    return weatherCodes[code] || { emoji: '🌡️', description: 'Okänt väder' };
  };

  if (loading) {
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('WeatherPage')}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>🌤️</Text>
          <Text style={[styles.title, { color: theme.text }]}>Väder</Text>
        </View>
        <View style={styles.weatherInfo}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  if (error || !weatherData) {
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('WeatherPage')}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>🌤️</Text>
          <Text style={[styles.title, { color: theme.text }]}>Väder</Text>
        </View>
        <View style={styles.weatherInfo}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Kunde inte hämta väder</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('WeatherPage')}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{weatherData.emoji}</Text>
        <Text style={[styles.title, { color: theme.text }]}>Väder</Text>
      </View>
      <View style={styles.weatherInfo}>
        <Text style={[styles.temperature, { color: theme.primary }]}>{weatherData.temp}°</Text>
        <Text style={[styles.condition, { color: theme.textSecondary }]}>{weatherData.condition}</Text>
      </View>
      <Text style={[styles.location, { color: theme.textTertiary }]}>{weatherData.location}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    height: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  weatherInfo: {
    alignItems: "center",
    marginBottom: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  temperature: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff9800",
    lineHeight: 32,
  },
  condition: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  errorText: {
    fontSize: 12,
    textAlign: "center",
  },
});

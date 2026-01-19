import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import * as Location from 'expo-location';

export default function WeatherSection({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
      0: { emoji: '☀️', key: 'weather.clearSky' },
      1: { emoji: '🌤️', key: 'weather.mostlyClear' },
      2: { emoji: '⛅', key: 'weather.partlyCloudy' },
      3: { emoji: '☁️', key: 'weather.overcast' },
      45: { emoji: '🌫️', key: 'weather.fog' },
      48: { emoji: '🌫️', key: 'weather.rime' },
      51: { emoji: '🌦️', key: 'weather.lightDrizzle' },
      53: { emoji: '🌦️', key: 'weather.drizzle' },
      55: { emoji: '🌧️', key: 'weather.heavyDrizzle' },
      61: { emoji: '🌧️', key: 'weather.lightRain' },
      63: { emoji: '🌧️', key: 'weather.rain' },
      65: { emoji: '🌧️', key: 'weather.heavyRain' },
      71: { emoji: '🌨️', key: 'weather.lightSnow' },
      73: { emoji: '🌨️', key: 'weather.snow' },
      75: { emoji: '🌨️', key: 'weather.heavySnow' },
      77: { emoji: '🌨️', key: 'weather.snowGrains' },
      80: { emoji: '🌦️', key: 'weather.lightShowers' },
      81: { emoji: '🌧️', key: 'weather.showers' },
      82: { emoji: '⛈️', key: 'weather.heavyShowers' },
      85: { emoji: '🌨️', key: 'weather.snowShowers' },
      86: { emoji: '🌨️', key: 'weather.heavySnowShowers' },
      95: { emoji: '⛈️', key: 'weather.thunderstorm' },
      96: { emoji: '⛈️', key: 'weather.thunderstormHail' },
      99: { emoji: '⛈️', key: 'weather.severeThunderstorm' },
    };
    const weather = weatherCodes[code] || { emoji: '🌡️', key: 'weather.unknown' };
    return { emoji: weather.emoji, description: t(weather.key) };
  };

  if (loading) {
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('WeatherPage')}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={[styles.title, { color: theme.text }]}>{t('home.weather')}</Text>
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
          <Text style={[styles.title, { color: theme.text }]}>{t('home.weather')}</Text>
        </View>
        <View style={styles.weatherInfo}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>{t('weather.error')}</Text>
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
        <Text style={[styles.title, { color: theme.text }]}>{t('home.weather')}</Text>
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import HeaderView from '../../components/common/HeaderView';

export default function WeatherPage({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Begär platsåtkomst
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Platsåtkomst nekad. Appen behöver din plats för att visa väder.');
        setLoading(false);
        return;
      }

      // Hämta aktuell position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);

      // Hämta väderdata från Open-Meteo API (gratis, ingen API-nyckel krävs)
      const { latitude, longitude } = currentLocation.coords;
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=7`
      );

      if (!weatherResponse.ok) {
        throw new Error('Kunde inte hämta väderdata');
      }

      const data = await weatherResponse.json();
      
      // Hämta platsnamn via reverse geocoding
      const locationData = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      setWeatherData({
        current: data.current,
        hourly: data.hourly,
        location: locationData[0] || {},
      });

      // Formatera 7-dagars prognos
      const dailyForecast = data.daily.time.map((date, index) => ({
        date,
        weatherCode: data.daily.weather_code[index],
        tempMax: Math.round(data.daily.temperature_2m_max[index]),
        tempMin: Math.round(data.daily.temperature_2m_min[index]),
        precipitation: data.daily.precipitation_sum[index],
        precipitationProb: data.daily.precipitation_probability_max[index],
      }));

      setForecast(dailyForecast);
      setLoading(false);
    } catch (err) {
      console.error('Väderfel:', err);
      setError(err.message || 'Kunde inte hämta väderdata');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  // Konvertera WMO väderkod till emoji och beskrivning
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

  // Formatera datum
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) return 'Idag';
    if (dateOnly.getTime() === tomorrowOnly.getTime()) return 'Imorgon';

    const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
    return dayNames[date.getDay()];
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBackground} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Hämtar väderdata...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBackground} />
        <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: theme.headerText }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.headerText }]}>Väder</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🌦️</Text>
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadWeatherData}
          >
            <Text style={[styles.retryButtonText, { color: theme.textInverse }]}>Försök igen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentWeather = getWeatherInfo(weatherData.current.weather_code);

  return (
    <HeaderView
      title={t('weather.title')}
      subtitle={weatherData.location.city || weatherData.location.region || 'Din plats'}
      navigation={navigation}
    >

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Aktuellt väder - stor vy */}
        <View style={[styles.currentWeatherCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.currentEmoji}>{currentWeather.emoji}</Text>
          <Text style={styles.currentTemp}>{Math.round(weatherData.current.temperature_2m)}°</Text>
          <Text style={styles.currentDescription}>{currentWeather.description}</Text>
          <Text style={styles.feelsLike}>
            Känns som {Math.round(weatherData.current.apparent_temperature)}°
          </Text>

          {/* Detaljer */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>💧</Text>
              <Text style={styles.detailText}>{weatherData.current.relative_humidity_2m}%</Text>
              <Text style={styles.detailLabel}>Luftfuktighet</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>💨</Text>
              <Text style={styles.detailText}>{Math.round(weatherData.current.wind_speed_10m)} km/h</Text>
              <Text style={styles.detailLabel}>Vind</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>🌧️</Text>
              <Text style={styles.detailText}>{weatherData.current.precipitation} mm</Text>
              <Text style={styles.detailLabel}>Nederbörd</Text>
            </View>
          </View>
        </View>

        {/* 7-dagars prognos */}
        <View style={[styles.forecastSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>7-dagars prognos</Text>
          {forecast.map((day, index) => {
            const dayWeather = getWeatherInfo(day.weatherCode);
            return (
              <View
                key={day.date}
                style={[
                  styles.forecastDay,
                  { borderBottomColor: theme.border },
                  index === forecast.length - 1 && styles.lastForecastDay,
                ]}
              >
                <Text style={[styles.forecastDayName, { color: theme.text }]}>
                  {formatDate(day.date)}
                </Text>
                <View style={styles.forecastWeather}>
                  <Text style={styles.forecastEmoji}>{dayWeather.emoji}</Text>
                  <Text style={[styles.forecastDescription, { color: theme.textSecondary }]}>
                    {dayWeather.description}
                  </Text>
                </View>
                <View style={styles.forecastTemp}>
                  <Text style={[styles.forecastTempMax, { color: theme.text }]}>{day.tempMax}°</Text>
                  <Text style={[styles.forecastTempMin, { color: theme.textSecondary }]}>{day.tempMin}°</Text>
                </View>
                {day.precipitationProb > 0 && (
                  <Text style={[styles.forecastPrecip, { color: theme.accent }]}>
                    💧 {day.precipitationProb}%
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </HeaderView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 20,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  currentWeatherCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  currentEmoji: {
    fontSize: 100,
    marginBottom: 16,
  },
  currentTemp: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentDescription: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
  },
  feelsLike: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  forecastSection: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  forecastDay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastForecastDay: {
    borderBottomWidth: 0,
  },
  forecastDayName: {
    fontSize: 16,
    fontWeight: '600',
    width: 80,
  },
  forecastWeather: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  forecastDescription: {
    fontSize: 14,
  },
  forecastTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  forecastTempMax: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  forecastTempMin: {
    fontSize: 16,
  },
  forecastPrecip: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600',
  },
});

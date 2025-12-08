import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

const STORAGE_KEYS = {
  USER: '@user',
  USERS_DB: '@users_db',
  IS_LOGGED_IN: '@is_logged_in',
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Google OAuth Configuration - DISABLED until credentials are configured
  // TODO: Ersätt med riktiga credentials från Google Cloud Console
  /*
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });
  
  // Hantera Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication.accessToken);
    }
  }, [response]);
  */

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [userStr, loggedIn] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN),
      ]);

      if (loggedIn === 'true' && userStr) {
        setCurrentUser(JSON.parse(userStr));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      // Hämta befintliga användare
      const usersStr = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersStr ? JSON.parse(usersStr) : [];

      // Kolla om email redan finns
      if (users.some(u => u.email === userData.email)) {
        return { success: false, error: 'Email är redan registrerad' };
      }

      // Skapa ny användare
      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        password: userData.password, // I en riktig app skulle detta hashas!
        name: userData.name,
        role: userData.role || 'medlem', // 'admin' eller 'medlem'
        createdAt: new Date().toISOString(),
        avatar: userData.avatar || '👤',
      };

      // Spara användare
      users.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));

      // Logga in automatiskt efter registrering
      const userToSave = { ...newUser };
      delete userToSave.password; // Ta inte med lösenord i sparad session

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToSave));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');

      setCurrentUser(userToSave);
      setIsLoggedIn(true);

      return { success: true, user: userToSave };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Ett fel uppstod vid registrering' };
    }
  };

  const login = async (email, password) => {
    try {
      const usersStr = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersStr ? JSON.parse(usersStr) : [];

      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
        return { success: false, error: 'Fel email eller lösenord' };
      }

      const userToSave = { ...user };
      delete userToSave.password;

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToSave));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');

      setCurrentUser(userToSave);
      setIsLoggedIn(true);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Ett fel uppstod vid inloggning' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
      setCurrentUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = { ...currentUser, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      // Uppdatera även i users database
      const usersStr = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersStr ? JSON.parse(usersStr) : [];
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
      }
      
      setCurrentUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Kunde inte uppdatera profil' };
    }
  };

  const getAllUsers = async () => {
    try {
      const usersStr = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersStr ? JSON.parse(usersStr) : [];
      return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  };

  const deleteUser = async (userId) => {
    try {
      const usersStr = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersStr ? JSON.parse(usersStr) : [];
      const filteredUsers = users.filter(u => u.id !== userId);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(filteredUsers));
      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: 'Kunde inte ta bort användare' };
    }
  };
  
  // Google OAuth - Starta inloggningsflödet
  const loginWithGoogle = async () => {
    try {
      if (!request) {
        return { success: false, error: 'Google OAuth är inte redo' };
      }
      
      await promptAsync();
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Google-inloggning misslyckades' };
    }
  };
  
  // Hantera Google token och skapa/hitta användare
  const handleGoogleLogin = async (accessToken) => {
    try {
      // Hämta användarinfo från Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      const googleUser = await userInfoResponse.json();
      
      // Kolla om användaren redan finns
      const usersStr = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      let user = users.find(u => u.email === googleUser.email);
      
      if (!user) {
        // Skapa ny användare
        user = {
          id: Date.now().toString(),
          email: googleUser.email,
          name: googleUser.name,
          role: 'medlem',
          createdAt: new Date().toISOString(),
          avatar: '👤',
          googleId: googleUser.id,
          authProvider: 'google',
        };
        
        users.push(user);
        await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
      }
      
      // Logga in användaren
      const userToSave = { ...user };
      delete userToSave.password;
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToSave));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
      
      setCurrentUser(userToSave);
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (error) {
      console.error('Handle Google login error:', error);
      return { success: false, error: 'Kunde inte logga in med Google' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        getAllUsers,
        deleteUser,
        loginWithGoogle: null, // Disabled until Google OAuth is configured
        googleAuthRequest: null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

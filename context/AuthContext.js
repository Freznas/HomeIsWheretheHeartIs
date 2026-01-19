import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile as firebaseUpdateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const AuthContext = createContext();

// Get Firebase Auth instance
const auth = getAuth();

const STORAGE_KEYS = {
  USER: '@user',
  IS_LOGGED_IN: '@is_logged_in',
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in - load user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        const user = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          name: userData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          avatar: userData.avatar || '👤',
          role: userData.role || 'medlem',
        };
        
        setCurrentUser(user);
        setIsLoggedIn(true);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
      } else {
        // User is signed out
        setCurrentUser(null);
        setIsLoggedIn(false);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (userData) => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role || 'medlem',
        avatar: userData.avatar || '👤',
        createdAt: new Date().toISOString(),
      });

      // Update Firebase Auth profile
      await firebaseUpdateProfile(firebaseUser, {
        displayName: userData.name,
      });

      // Send email verification
      await sendEmailVerification(firebaseUser);

      const user = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        name: userData.name,
        avatar: userData.avatar || '👤',
        role: userData.role || 'medlem',
      };

      return { success: true, user, message: 'Konto skapat! Kontrollera din email för att verifiera ditt konto.' };
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Ett fel uppstod vid registrering';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email är redan registrerad';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Lösenordet måste vara minst 6 tecken';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Ogiltig email-adress';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Ett fel uppstod vid inloggning';
      if (error.code === 'auth/invalid-credential' || 
          error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password') {
        errorMessage = 'Fel email eller lösenord';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Ogiltig email-adress';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Ingen användare inloggad' };
      }
      
      if (auth.currentUser.emailVerified) {
        return { success: false, error: 'Email är redan verifierad' };
      }

      await sendEmailVerification(auth.currentUser);
      return { success: true, message: 'Verifieringsmail skickat! Kontrollera din inkorg.' };
    } catch (error) {
      console.error('Resend verification error:', error);
      
      let errorMessage = 'Kunde inte skicka verifieringsmail';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'För många försök. Vänta en stund innan du försöker igen.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!currentUser) return { success: false, error: 'Ingen användare inloggad' };

      // Update Firestore
      await setDoc(doc(db, 'users', currentUser.id), updates, { merge: true });
      
      // Update Firebase Auth profile if name is updated
      if (updates.name && auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: updates.name,
        });
      }

      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Kunde inte uppdatera profil' };
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
        resendVerificationEmail,
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

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, deleteDoc, updateDoc, serverTimestamp, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Your web app's Firebase configuration
// Using environment variables for security
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 🔥 Enable offline persistence - cachar data lokalt för offline-åtkomst
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Flera flikar öppna samtidigt, persistence kan bara aktiveras i en flik
    console.warn('Offline persistence: Flera flikar öppna, endast en kan ha persistence aktiverad');
  } else if (err.code === 'unimplemented') {
    // Webbläsaren stöder ej persistence
    console.warn('Offline persistence: Denna webbläsare stöder inte offline persistence');
  }
});

// Export for use in other modules
export { auth, db, storage };

// ============================================
// HOUSEHOLD FUNCTIONS
// ============================================

/**
 * Skapa ett nytt hushåll
 * @param {string} householdName - Namnet på hushållet
 * @param {string} userId - ID på användaren som skapar
 * @param {string} email - Email på användaren som skapar
 * @param {string} displayName - Användarens visningsnamn
 * @returns {Promise<{success: boolean, household?: object, error?: string}>}
 */
export const createHousehold = async (householdName, userId, email, displayName = null) => {
  try {
    // ✅ Kolla email verification
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser || !currentUser.emailVerified) {
      return { success: false, error: 'Du måste verifiera din email innan du kan skapa ett hushåll' };
    }

    const householdId = `household_${Date.now()}`;
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();

    const householdData = {
      id: householdId,
      name: householdName.trim(),
      inviteCode,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      members: [{
        userId,
        email,
        displayName: displayName || email.split('@')[0],
        role: 'admin',
        joinedAt: new Date().toISOString(),
      }],
    };

    // VIKTIGT: Koppla användaren till hushållet FÖRST (innan household skapas)
    // Detta gör att Security Rules kan verifiera membership
    await setDoc(doc(db, 'userHouseholds', userId), {
      householdId,
      joinedAt: serverTimestamp(),
    });

    // Sedan spara hushållet i Firestore
    await setDoc(doc(db, 'households', householdId), householdData);

    return { success: true, household: householdData };
  } catch (error) {
    console.error('Error creating household:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gå med i ett befintligt hushåll via inbjudningskod
 * @param {string} inviteCode - 6-siffrig inbjudningskod
 * @param {string} userId - ID på användaren som går med
 * @param {string} email - Email på användaren som går med
 * @param {string} displayName - Användarens visningsnamn
 * @returns {Promise<{success: boolean, household?: object, error?: string}>}
 */
export const joinHousehold = async (inviteCode, userId, email, displayName = null) => {
  try {
    // Validera input
    if (!userId || !email) {
      return { success: false, error: 'Användar-ID och email krävs' };
    }

    // ✅ Kolla email verification
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser || !currentUser.emailVerified) {
      return { success: false, error: 'Du måste verifiera din email innan du kan gå med i ett hushåll' };
    }

    // Hitta hushåll med matchande inbjudningskod
    const householdsRef = collection(db, 'households');
    const q = query(householdsRef, where('inviteCode', '==', inviteCode.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Inbjudningskoden är ogiltig' };
    }

    const householdDoc = querySnapshot.docs[0];
    const household = householdDoc.data();

    // Kolla om användaren redan är medlem
    if (household.members && household.members.some(m => m.userId === userId)) {
      return { success: false, error: 'Du är redan medlem i detta hushåll' };
    }

    // Lägg till användaren i medlemslistan
    const newMember = {
      userId: userId,
      email: email,
      displayName: displayName || email.split('@')[0],
      role: 'member',
      joinedAt: new Date().toISOString(),
    };

    const updatedMembers = [...(household.members || []), newMember];

    await updateDoc(doc(db, 'households', household.id), {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });

    // Koppla användaren till hushållet
    await setDoc(doc(db, 'userHouseholds', userId), {
      householdId: household.id,
      joinedAt: serverTimestamp(),
    });

    return { success: true, household: { ...household, members: updatedMembers } };
  } catch (error) {
    console.error('Error joining household:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Hämta användarens hushåll
 * @param {string} userId - ID på användaren
 * @returns {Promise<{success: boolean, household?: object, error?: string}>}
 */
export const getUserHousehold = async (userId) => {
  try {
    // Hämta användarens hushålls-ID
    const userHouseholdDoc = await getDoc(doc(db, 'userHouseholds', userId));
    
    if (!userHouseholdDoc.exists()) {
      return { success: true, household: null, householdId: null };
    }

    const { householdId } = userHouseholdDoc.data();

    // Hämta hushållsdata
    const householdDoc = await getDoc(doc(db, 'households', householdId));
    
    if (!householdDoc.exists()) {
      return { success: true, household: null, householdId: null };
    }

    return { success: true, household: householdDoc.data(), householdId };
  } catch (error) {
    console.error('Error getting user household:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lyssna på realtidsuppdateringar för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion som anropas vid uppdateringar
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToHousehold = (householdId, callback) => {
  const unsubscribe = onSnapshot(
    doc(db, 'households', householdId),
    (doc) => {
      if (doc.exists()) {
        callback({ success: true, household: doc.data() });
      } else {
        callback({ success: false, error: 'Hushåll hittades inte' });
      }
    },
    (error) => {
      console.error('Error subscribing to household:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Lämna ett hushåll
 * @param {string} householdId - ID på hushållet
 * @param {string} userId - ID på användaren som lämnar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const leaveHousehold = async (householdId, userId) => {
  try {
    // ✅ Kolla email verification
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser || !currentUser.emailVerified) {
      return { success: false, error: 'Du måste verifiera din email för att utföra denna åtgärd' };
    }

    const householdDoc = await getDoc(doc(db, 'households', householdId));
    
    if (!householdDoc.exists()) {
      return { success: false, error: 'Hushåll hittades inte' };
    }

    const household = householdDoc.data();
    const updatedMembers = household.members.filter(m => m.userId !== userId);

    // Om inga medlemmar kvar, radera hushållet
    if (updatedMembers.length === 0) {
      await deleteDoc(doc(db, 'households', householdId));
    } else {
      await updateDoc(doc(db, 'households', householdId), {
        members: updatedMembers,
      });
    }

    // Ta bort användarens koppling till hushållet
    await deleteDoc(doc(db, 'userHouseholds', userId));

    return { success: true };
  } catch (error) {
    console.error('Error leaving household:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort en medlem från hushållet (endast admin)
 * @param {string} householdId - ID på hushållet
 * @param {string} memberUserId - ID på medlemmen som ska tas bort
 * @param {string} adminUserId - ID på admin som utför åtgärden
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeMember = async (householdId, memberUserId, adminUserId) => {
  try {
    // ✅ Kolla email verification
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser || !currentUser.emailVerified) {
      return { success: false, error: 'Du måste verifiera din email för att utföra denna åtgärd' };
    }

    const householdDoc = await getDoc(doc(db, 'households', householdId));
    
    if (!householdDoc.exists()) {
      return { success: false, error: 'Hushåll hittades inte' };
    }

    const household = householdDoc.data();

    // Verifiera att personen som tar bort är admin
    const admin = household.members.find(m => m.userId === adminUserId);
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'Du har inte behörighet att ta bort medlemmar' };
    }

    const updatedMembers = household.members.filter(m => m.userId !== memberUserId);

    await updateDoc(doc(db, 'households', householdId), {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });

    // Ta bort medlemmens koppling till hushållet
    await deleteDoc(doc(db, 'userHouseholds', memberUserId));

    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera hushållsnamn (endast admin)
 * @param {string} householdId - ID på hushållet
 * @param {string} newName - Nytt namn
 * @param {string} userId - ID på användaren som uppdaterar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateHouseholdName = async (householdId, newName, userId) => {
  try {
    const householdDoc = await getDoc(doc(db, 'households', householdId));
    
    if (!householdDoc.exists()) {
      return { success: false, error: 'Hushåll hittades inte' };
    }

    const household = householdDoc.data();

    // Verifiera att personen som uppdaterar är admin
    const admin = household.members.find(m => m.userId === userId);
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'Du har inte behörighet att uppdatera hushållet' };
    }

    await updateDoc(doc(db, 'households', householdId), {
      name: newName.trim(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating household name:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

/**
 * Uppdatera användarprofil
 * @param {string} userId - ID på användaren
 * @param {object} updates - Data att uppdatera
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Hämta användarstatistik från alla hushållsdata
 * @param {string} userId - ID på användaren
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getUserStats = async (userId, householdId) => {
  try {
    if (!householdId) {
      return { success: true, stats: { notes: 0, visitors: 0, chores: 0 } };
    }

    // Räkna anteckningar
    const notesRef = collection(db, 'householdData', householdId, 'notes');
    const notesQuery = query(notesRef, where('createdBy', '==', userId));
    const notesSnapshot = await getDocs(notesQuery);
    
    // Räkna besökare
    const visitorsRef = collection(db, 'householdData', householdId, 'visitors');
    const visitorsQuery = query(visitorsRef, where('createdBy', '==', userId));
    const visitorsSnapshot = await getDocs(visitorsQuery);
    
    // Räkna sysslor (tilldelade + skapade)
    const choresRef = collection(db, 'householdData', householdId, 'chores');
    const choresSnapshot = await getDocs(choresRef);
    const userChores = choresSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.assignedTo === userId || data.createdBy === userId;
    });

    return {
      success: true,
      stats: {
        notes: notesSnapshot.size,
        visitors: visitorsSnapshot.size,
        chores: userChores.length,
      }
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera användarens lösenord
 * @param {string} currentPassword - Nuvarande lösenord
 * @param {string} newPassword - Nytt lösenord
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      return { success: false, error: 'Ingen användare inloggad' };
    }

    // Reautenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    
    if (error.code === 'auth/wrong-password') {
      return { success: false, error: 'Fel nuvarande lösenord' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Lösenordet är för svagt' };
    }
    
    return { success: false, error: error.message };
  }
};

// ============================================
// PANTRY FUNCTIONS
// ============================================

/**
 * Hämta alla pantry items för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, items?: array, error?: string}>}
 */
export const getPantryItems = async (householdId) => {
  try {
    const pantryRef = collection(db, 'householdData', householdId, 'pantry');
    const querySnapshot = await getDocs(pantryRef);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, items };
  } catch (error) {
    console.error('Error getting pantry items:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lyssna på realtidsuppdateringar för pantry
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToPantry = (householdId, callback) => {
  const pantryRef = collection(db, 'householdData', householdId, 'pantry');
  
  const unsubscribe = onSnapshot(
    pantryRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, items });
    },
    (error) => {
      console.error('Error subscribing to pantry:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Lägg till pantry item
 * @param {string} householdId - ID på hushållet
 * @param {object} item - Pantry item data
 * @param {string} userId - ID på användaren som skapar itemet
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addPantryItem = async (householdId, item, userId) => {
  try {
    const itemId = `pantry_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'pantry', itemId), {
      ...item,
      id: itemId,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding pantry item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera pantry item
 * @param {string} householdId - ID på hushållet
 * @param {string} itemId - ID på itemet
 * @param {object} updates - Data att uppdatera
 * @param {string} userId - ID på användaren som uppdaterar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updatePantryItem = async (householdId, itemId, updates, userId) => {
  try {
    await updateDoc(doc(db, 'householdData', householdId, 'pantry', itemId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating pantry item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort pantry item
 * @param {string} householdId - ID på hushållet
 * @param {string} itemId - ID på itemet
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deletePantryItem = async (householdId, itemId) => {
  try {
    await deleteDoc(doc(db, 'householdData', householdId, 'pantry', itemId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SHOPPING LIST FUNCTIONS
// ============================================

/**
 * Hämta alla shopping list items för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, items?: array, error?: string}>}
 */
export const getShoppingListItems = async (householdId) => {
  try {
    const shoppingRef = collection(db, 'householdData', householdId, 'shoppingList');
    const querySnapshot = await getDocs(shoppingRef);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, items };
  } catch (error) {
    console.error('Error getting shopping list items:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lyssna på realtidsuppdateringar för shopping list
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToShoppingList = (householdId, callback) => {
  const shoppingRef = collection(db, 'householdData', householdId, 'shoppingList');
  
  const unsubscribe = onSnapshot(
    shoppingRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, items });
    },
    (error) => {
      console.error('Error subscribing to shopping list:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Lägg till shopping list item
 * @param {string} householdId - ID på hushållet
 * @param {object} item - Shopping list item data
 * @param {string} userId - ID på användaren som skapar itemet
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addShoppingListItem = async (householdId, item, userId) => {
  try {
    const itemId = `shopping_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'shoppingList', itemId), {
      ...item,
      id: itemId,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding shopping list item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera shopping list item
 * @param {string} householdId - ID på hushållet
 * @param {string} itemId - ID på itemet
 * @param {object} updates - Data att uppdatera
 * @param {string} userId - ID på användaren som uppdaterar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateShoppingListItem = async (householdId, itemId, updates, userId) => {
  try {
    await updateDoc(doc(db, 'householdData', householdId, 'shoppingList', itemId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating shopping list item:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort shopping list item
 * @param {string} householdId - ID på hushållet
 * @param {string} itemId - ID på itemet
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteShoppingListItem = async (householdId, itemId) => {
  try {
    await deleteDoc(doc(db, 'householdData', householdId, 'shoppingList', itemId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting shopping list item:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CHORES FUNCTIONS
// ============================================

/**
 * Hämta alla sysslor för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, chores?: Array, error?: string}>}
 */
export const getChores = async (householdId) => {
  try {
    const choresRef = collection(db, 'householdData', householdId, 'chores');
    const snapshot = await getDocs(choresRef);
    
    const chores = [];
    snapshot.forEach((doc) => {
      chores.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, chores };
  } catch (error) {
    console.error('Error getting chores:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prenumerera på sysslor för ett hushåll (real-time updates)
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion som anropas vid uppdateringar
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToChores = (householdId, callback) => {
  const choresRef = collection(db, 'householdData', householdId, 'chores');
  
  const unsubscribe = onSnapshot(
    choresRef,
    (snapshot) => {
      const chores = [];
      snapshot.forEach((doc) => {
        chores.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, chores });
    },
    (error) => {
      console.error('Error subscribing to chores:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Lägg till en ny syssla
 * @param {string} householdId - ID på hushållet
 * @param {object} chore - Syssla data
 * @param {string} userId - ID på användaren som skapar sysslan
 * @param {string} displayName - Visningsnamn på användaren
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addChore = async (householdId, chore, userId, displayName) => {
  try {
    const choreId = `chore_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'chores', choreId), {
      ...chore,
      id: choreId,
      assignedToName: displayName, // Cache displayName för snabb visning
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding chore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera en syssla
 * @param {string} householdId - ID på hushållet
 * @param {string} choreId - ID på sysslan
 * @param {object} updates - Data att uppdatera
 * @param {string} userId - ID på användaren som uppdaterar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateChore = async (householdId, choreId, updates, userId) => {
  try {
    await updateDoc(doc(db, 'householdData', householdId, 'chores', choreId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating chore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort en syssla
 * @param {string} householdId - ID på hushållet
 * @param {string} choreId - ID på sysslan
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteChore = async (householdId, choreId) => {
  try {
    await deleteDoc(doc(db, 'householdData', householdId, 'chores', choreId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting chore:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BILLS FUNCTIONS
// ============================================

/**
 * Hämta alla räkningar för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, bills?: Array, error?: string}>}
 */
export const getBills = async (householdId) => {
  try {
    const billsRef = collection(db, 'householdData', householdId, 'bills');
    const snapshot = await getDocs(billsRef);
    
    const bills = [];
    snapshot.forEach((doc) => {
      bills.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, bills };
  } catch (error) {
    console.error('Error getting bills:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prenumerera på räkningar för ett hushåll (real-time updates)
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion som anropas vid uppdateringar
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToBills = (householdId, callback) => {
  const billsRef = collection(db, 'householdData', householdId, 'bills');
  
  const unsubscribe = onSnapshot(
    billsRef,
    (snapshot) => {
      const bills = [];
      snapshot.forEach((doc) => {
        bills.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, bills });
    },
    (error) => {
      console.error('Error subscribing to bills:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Lägg till en ny räkning
 * @param {string} householdId - ID på hushållet
 * @param {object} bill - Räkning data
 * @param {string} userId - ID på användaren som skapar räkningen
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addBill = async (householdId, bill, userId) => {
  try {
    const billId = `bill_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'bills', billId), {
      ...bill,
      id: billId,
      amount: parseFloat(bill.amount), // Konvertera till nummer
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding bill:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera en räkning
 * @param {string} householdId - ID på hushållet
 * @param {string} billId - ID på räkningen
 * @param {object} updates - Data att uppdatera
 * @param {string} userId - ID på användaren som uppdaterar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateBill = async (householdId, billId, updates, userId) => {
  try {
    const updateData = { ...updates };
    if (updates.amount) {
      updateData.amount = parseFloat(updates.amount);
    }
    
    await updateDoc(doc(db, 'householdData', householdId, 'bills', billId), {
      ...updateData,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating bill:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort en räkning
 * @param {string} householdId - ID på hushållet
 * @param {string} billId - ID på räkningen
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteBill = async (householdId, billId) => {
  try {
    await deleteDoc(doc(db, 'householdData', householdId, 'bills', billId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting bill:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// VISITORS FUNCTIONS
// ============================================

/**
 * Hämta alla besökare för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, visitors?: Array, error?: string}>}
 */
export const getVisitors = async (householdId) => {
  try {
    const visitorsRef = collection(db, 'householdData', householdId, 'visitors');
    const snapshot = await getDocs(visitorsRef);
    
    const visitors = [];
    snapshot.forEach((doc) => {
      visitors.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, visitors };
  } catch (error) {
    console.error('Error getting visitors:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prenumerera på besökare för ett hushåll (real-time updates)
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion som anropas vid uppdateringar
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToVisitors = (householdId, callback) => {
  const visitorsRef = collection(db, 'householdData', householdId, 'visitors');
  
  const unsubscribe = onSnapshot(
    visitorsRef,
    (snapshot) => {
      const visitors = [];
      snapshot.forEach((doc) => {
        visitors.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, visitors });
    },
    (error) => {
      console.error('Error subscribing to visitors:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Lägg till en ny besökare
 * @param {string} householdId - ID på hushållet
 * @param {object} visitor - Besökare data
 * @param {string} userId - ID på användaren som skapar besökaren
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addVisitor = async (householdId, visitor, userId) => {
  try {
    const visitorId = `visitor_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'visitors', visitorId), {
      ...visitor,
      id: visitorId,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding visitor:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera en besökare
 * @param {string} householdId - ID på hushållet
 * @param {string} visitorId - ID på besökaren
 * @param {object} updates - Data att uppdatera
 * @param {string} userId - ID på användaren som uppdaterar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateVisitor = async (householdId, visitorId, updates, userId) => {
  try {
    await updateDoc(doc(db, 'householdData', householdId, 'visitors', visitorId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating visitor:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort en besökare
 * @param {string} householdId - ID på hushållet
 * @param {string} visitorId - ID på besökaren
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteVisitor = async (householdId, visitorId) => {
  try {
    await deleteDoc(doc(db, 'householdData', householdId, 'visitors', visitorId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting visitor:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CALENDAR FUNCTIONS
// ============================================

/**
 * Hämta alla kalenderhändelser för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, events?: Array, error?: string}>}
 */
export const getCalendarEvents = async (householdId) => {
  try {
    const eventsRef = collection(db, 'householdData', householdId, 'calendar');
    const snapshot = await getDocs(eventsRef);
    
    const events = [];
    snapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, events };
  } catch (error) {
    console.error('Error getting calendar events:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prenumerera på kalenderhändelser för ett hushåll (real-time updates)
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion som anropas vid uppdateringar
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToCalendar = (householdId, callback) => {
  const eventsRef = collection(db, 'householdData', householdId, 'calendar');
  
  const unsubscribe = onSnapshot(
    eventsRef,
    (snapshot) => {
      const events = [];
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, events });
    },
    (error) => {
      console.error('Error subscribing to calendar:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Lägg till en ny kalenderhändelse
 * @param {string} householdId - ID på hushållet
 * @param {object} event - Händelse data
 * @param {string} userId - ID på användaren som skapar händelsen
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addCalendarEvent = async (householdId, event, userId) => {
  try {
    const eventId = `event_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'calendar', eventId), {
      ...event,
      id: eventId,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding calendar event:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera en kalenderhändelse
 * @param {string} householdId - ID på hushållet
 * @param {string} eventId - ID på händelsen
 * @param {object} updates - Data att uppdatera
 * @param {string} userId - ID på användaren som uppdaterar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateCalendarEvent = async (householdId, eventId, updates, userId) => {
  try {
    await updateDoc(doc(db, 'householdData', householdId, 'calendar', eventId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort en kalenderhändelse
 * @param {string} householdId - ID på hushållet
 * @param {string} eventId - ID på händelsen
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCalendarEvent = async (householdId, eventId) => {
  try {
    await deleteDoc(doc(db, 'householdData', householdId, 'calendar', eventId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CHAT FUNCTIONS
// ============================================

/**
 * Hämta alla chatmeddelanden för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, messages?: Array, error?: string}>}
 */
export const getChatMessages = async (householdId) => {
  try {
    const messagesRef = collection(db, 'householdData', householdId, 'chat');
    const snapshot = await getDocs(messagesRef);
    
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, messages };
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prenumerera på chatmeddelanden för ett hushåll (real-time updates)
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion som anropas vid uppdateringar
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToChat = (householdId, callback) => {
  const messagesRef = collection(db, 'householdData', householdId, 'chat');
  
  const unsubscribe = onSnapshot(
    messagesRef,
    (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, messages });
    },
    (error) => {
      console.error('Error subscribing to chat:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Skicka ett nytt chatmeddelande
 * @param {string} householdId - ID på hushållet
 * @param {object} message - Meddelande data
 * @param {string} userId - ID på användaren som skickar meddelandet
 * @param {string} displayName - Visningsnamn på användaren
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendChatMessage = async (householdId, message, userId, displayName) => {
  try {
    const messageId = `msg_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'chat', messageId), {
      ...message,
      id: messageId,
      sender: userId,
      senderName: displayName, // Cache displayName för snabb visning
      readBy: [userId], // Användaren har läst sitt eget meddelande
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending chat message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Markera ett meddelande som läst
 * @param {string} householdId - ID på hushållet
 * @param {string} messageId - ID på meddelandet
 * @param {string} userId - ID på användaren som läser
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markMessageAsRead = async (householdId, messageId, userId) => {
  try {
    const messageRef = doc(db, 'householdData', householdId, 'chat', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      
      if (!readBy.includes(userId)) {
        await updateDoc(messageRef, {
          readBy: [...readBy, userId],
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort ett chatmeddelande
 * @param {string} householdId - ID på hushållet
 * @param {string} messageId - ID på meddelandet
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteChatMessage = async (householdId, messageId) => {
  try {
    await deleteDoc(doc(db, 'householdData', householdId, 'chat', messageId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting chat message:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// NOTES FUNCTIONS
// ============================================

/**
 * Hämta alla anteckningar för ett hushåll
 * @param {string} householdId - ID på hushållet
 * @returns {Promise<{success: boolean, notes?: Array, error?: string}>}
 */
export const getNotes = async (householdId) => {
  try {
    const notesRef = collection(db, 'householdData', householdId, 'notes');
    const snapshot = await getDocs(notesRef);
    
    const notes = [];
    snapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, notes };
  } catch (error) {
    console.error('Error getting notes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prenumerera på anteckningar för ett hushåll (real-time updates)
 * @param {string} householdId - ID på hushållet
 * @param {function} callback - Callback-funktion som anropas vid uppdateringar
 * @returns {function} Unsubscribe-funktion
 */
export const subscribeToNotes = (householdId, callback) => {
  const notesRef = collection(db, 'householdData', householdId, 'notes');
  
  const unsubscribe = onSnapshot(
    notesRef,
    (snapshot) => {
      const notes = [];
      snapshot.forEach((doc) => {
        notes.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, notes });
    },
    (error) => {
      console.error('Error subscribing to notes:', error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

/**
 * Lägg till en ny anteckning
 * @param {string} householdId - ID på hushållet
 * @param {object} note - Anteckning data
 * @param {string} userId - ID på användaren som skapar anteckningen
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addNote = async (householdId, note, userId) => {
  try {
    const noteId = `note_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'notes', noteId), {
      ...note,
      id: noteId,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding note:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uppdatera en anteckning
 * @param {string} householdId - ID på hushållet
 * @param {string} noteId - ID på anteckningen
 * @param {object} updates - Data att uppdatera
 * @param {string} userId - ID på användaren som uppdaterar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateNote = async (householdId, noteId, updates, userId) => {
  try {
    await updateDoc(doc(db, 'householdData', householdId, 'notes', noteId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating note:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ta bort en anteckning
 * @param {string} householdId - ID på hushållet
 * @param {string} noteId - ID på anteckningen
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteNote = async (householdId, noteId) => {
  try {
    await deleteDoc(doc(db, 'householdData', householdId, 'notes', noteId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: error.message };
  }
};

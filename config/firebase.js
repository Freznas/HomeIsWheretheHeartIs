// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzv2NAF-tah4mg1Tb68EM4bzsYNcuTtfc",
  authDomain: "home-is-where-the-hearth-is.firebaseapp.com",
  projectId: "home-is-where-the-hearth-is",
  storageBucket: "home-is-where-the-hearth-is.firebasestorage.app",
  messagingSenderId: "694290922820",
  appId: "1:694290922820:web:6709fe1d2a36990b10ab11",
  measurementId: "G-2GEHK78VQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// ============================================
// HOUSEHOLD FUNCTIONS
// ============================================

/**
 * Skapa ett nytt hushåll
 * @param {string} householdName - Namnet på hushållet
 * @param {string} userId - ID på användaren som skapar
 * @param {string} email - Email på användaren som skapar
 * @returns {Promise<{success: boolean, household?: object, error?: string}>}
 */
export const createHousehold = async (householdName, userId, email) => {
  try {
    const householdId = `household_${Date.now()}`;
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();

    const householdData = {
      id: householdId,
      name: householdName.trim(),
      inviteCode,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      members: [{
        userId,
        email,
        role: 'admin',
        joinedAt: new Date().toISOString(),
      }],
    };

    // Spara hushållet i Firestore
    await setDoc(doc(db, 'households', householdId), householdData);

    // Koppla användaren till hushållet
    await setDoc(doc(db, 'userHouseholds', userId), {
      householdId,
      joinedAt: new Date().toISOString(),
    });

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
 * @returns {Promise<{success: boolean, household?: object, error?: string}>}
 */
export const joinHousehold = async (inviteCode, userId, email) => {
  try {
    // Validera input
    if (!userId || !email) {
      return { success: false, error: 'Användar-ID och email krävs' };
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
      role: 'member',
      joinedAt: new Date().toISOString(),
    };

    const updatedMembers = [...(household.members || []), newMember];

    await updateDoc(doc(db, 'households', household.id), {
      members: updatedMembers,
    });

    // Koppla användaren till hushållet
    await setDoc(doc(db, 'userHouseholds', userId), {
      householdId: household.id,
      joinedAt: new Date().toISOString(),
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
      return { success: true, household: null };
    }

    const { householdId } = userHouseholdDoc.data();

    // Hämta hushållsdata
    const householdDoc = await getDoc(doc(db, 'households', householdId));
    
    if (!householdDoc.exists()) {
      return { success: true, household: null };
    }

    return { success: true, household: householdDoc.data() };
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
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating household name:', error);
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addPantryItem = async (householdId, item) => {
  try {
    const itemId = `pantry_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'pantry', itemId), {
      ...item,
      id: itemId,
      createdAt: new Date().toISOString(),
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updatePantryItem = async (householdId, itemId, updates) => {
  try {
    await updateDoc(doc(db, 'householdData', householdId, 'pantry', itemId), {
      ...updates,
      updatedAt: new Date().toISOString(),
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addShoppingListItem = async (householdId, item) => {
  try {
    const itemId = `shopping_${Date.now()}`;
    await setDoc(doc(db, 'householdData', householdId, 'shoppingList', itemId), {
      ...item,
      id: itemId,
      createdAt: new Date().toISOString(),
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateShoppingListItem = async (householdId, itemId, updates) => {
  try {
    await updateDoc(doc(db, 'householdData', householdId, 'shoppingList', itemId), {
      ...updates,
      updatedAt: new Date().toISOString(),
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

export { db };

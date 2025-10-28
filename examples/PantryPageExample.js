// Exempel: Hur du använder AsyncStorage i PantryPage
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { usePantryData } from '../hooks/useAsyncStorage';

export default function PantryPage({ navigation }) {
  // 🎯 Använd custom hook - automatisk save/load!
  const [pantryItems, setPantryItems, removePantryData, loading] = usePantryData();
  const [newItem, setNewItem] = useState('');

  // ➕ Lägg till ny vara
  const addItem = () => {
    if (newItem.trim()) {
      const newPantryItem = {
        id: Date.now().toString(),
        name: newItem.trim(),
        addedDate: new Date().toISOString(),
      };
      
      // 💾 Spara automatiskt till AsyncStorage
      setPantryItems(currentItems => [...currentItems, newPantryItem]);
      setNewItem('');
    }
  };

  // 🗑️ Ta bort vara
  const removeItem = (itemId) => {
    setPantryItems(currentItems => 
      currentItems.filter(item => item.id !== itemId)
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Laddar skafferidata...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Skafferi ({pantryItems.length} varor)
      </Text>

      {/* Lägg till ny vara */}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <TextInput
          style={{ 
            flex: 1, 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            marginRight: 10 
          }}
          placeholder="Lägg till vara..."
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={addItem}
        />
        <TouchableOpacity 
          onPress={addItem}
          style={{ 
            backgroundColor: '#3949ab', 
            padding: 10, 
            borderRadius: 5 
          }}
        >
          <Text style={{ color: 'white' }}>Lägg till</Text>
        </TouchableOpacity>
      </View>

      {/* Lista med varor */}
      <FlatList
        data={pantryItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: 15,
            backgroundColor: '#f5f5f5',
            marginBottom: 10,
            borderRadius: 8
          }}>
            <Text style={{ fontSize: 16 }}>{item.name}</Text>
            <TouchableOpacity 
              onPress={() => removeItem(item.id)}
              style={{ backgroundColor: '#ff4444', padding: 5, borderRadius: 3 }}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>Ta bort</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 50 }}>
            Inga varor i skafferiet ännu. Lägg till något!
          </Text>
        }
      />
    </View>
  );
}
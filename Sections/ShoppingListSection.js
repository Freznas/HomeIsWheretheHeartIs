import {Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ShoppingListSection({ navigation }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate("ShoppingListPage")}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>Inköpslista</Text>
      <Text style={styles.text}>🥛 Mjölk (tar slut snart)</Text>
      <Text style={styles.text}>🍞 Bröd (1 paket kvar)</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    backgroundColor: "#f0ffe0ff", 
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    padding: 12,
  },
  sectionTitle: {
       fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  
  },
  text: {
    fontSize: 16,
    marginTop: 4,
  },
});


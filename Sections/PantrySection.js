import { View, Text,StyleSheet } from "react-native";




export default function PantrySection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pantry</Text>
      <View style={styles.card}>
        <Text style = {styles.text}>🥛 Mjölk (tar slut snart)</Text>
        <Text style = {styles.text}>🍞 Bröd (1 paket kvar)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
});


import {Text, StyleSheet, TouchableOpacity } from "react-native";

export default function BillsSection({ navigation }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation && navigation.navigate("BillsPage")}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>Räkningar</Text>
      <Text style={styles.text}>💡 Elräkning (förfallodag: 2023-09-30)</Text>
      <Text style={styles.text}>📅 Hyra (förfallodag: 2023-10-01)</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    backgroundColor: "#ffe0e0ff", 
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



import { View, Text,StyleSheet } from "react-native";
export default function ChatSection() {
  return (
    <View>
      {/* Messenger Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messenger</Text>
        <View style={styles.card}>
          <Text>👩 Anna: "Kan du handla mjölk på vägen hem?"</Text>
          <Text>👨 Erik: "Mötet flyttat till 19:00"</Text>
        </View>
      </View>
       
       <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messenger</Text>
        <View style={styles.card}>
          <Text>👩 Anna: "Kan du handla mjölk på vägen hem?"</Text>
          <Text>👨 Erik: "Mötet flyttat till 19:00"</Text>
        </View>
      </View>
       <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messenger</Text>
        <View style={styles.card}>
          <Text>👩 Anna: "Kan du handla mjölk på vägen hem?"</Text>
          <Text>👨 Erik: "Mötet flyttat till 19:00"</Text>
        </View>
      </View>
       <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messenger</Text>
        <View style={styles.card}>
          <Text>👩 Anna: "Kan du handla mjölk på vägen hem?"</Text>
          <Text>👨 Erik: "Mötet flyttat till 19:00"</Text>
        </View>
      </View>
      
      </View>
)}

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


import { View, Text,StyleSheet } from "react-native";
const HighlightSection = ({style}
    
    ) => {
      return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Highlight</Text>
        <View style={styles.card}>
          <Text style = {styles.text}>🎉 Idag fyller någon i familjen år!</Text>
          <Text style = {styles.text}>🗓️ Middag bokad imorgon kl. 18:00</Text>
        </View>
      </View>
)}

      export default HighlightSection;
  
  const styles = StyleSheet.create({
  section: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  card: {
    height:250,
    
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: "#000",
  },
});
//Lägg till en bild 
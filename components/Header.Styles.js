
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    backgroundColor: "#68b3d2",
    paddingVertical: 12,
    paddingHorizontal: 16,
  
    flexDirection: "row",      // lägger knappar och titel i rad
    alignItems: "center",      // vertikal centrering
    justifyContent: "space-between", // placerar vänster, mitten och höger
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    position: "absolute",       // gör att titeln kan centreras oberoende av knappar
    left: 0,
    right: 0,
    textAlign: "center",
  },
  leftButton: {
    padding: 8,
  },
  rightButton: {
    padding: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  scroll: {
    padding: 16,
  },
});

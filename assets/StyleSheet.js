import { StyleSheet } from "react-native";

export default StyleSheet.create({
  // --- Generella container-stilar ---
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },

  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  column: {
    flexDirection: "column",
  },

  // --- Text-stilar ---
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },

  text: {
    fontSize: 16,
    color: "#000",
  },

  smallText: {
    fontSize: 14,
    color: "#666",
  },

  // --- Box / kort ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // --- Buttons ---
  button: {
    backgroundColor: "#4A90E2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // --- Margins och padding generellt ---
  marginVertical: {
    marginVertical: 8,
  },
  marginHorizontal: {
    marginHorizontal: 8,
  },
  paddingHorizontal: {
    paddingHorizontal: 16,
  },
});

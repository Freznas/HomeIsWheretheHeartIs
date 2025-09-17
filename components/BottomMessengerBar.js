import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BottomMessengerBar({ message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>💬 Senaste meddelande:</Text>
      <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#009bba",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
  },
  label: {
    color: "#fff",
    fontWeight: "bold",
    marginRight: 8,
  },
  message: {
    color: "#fff",
    flex: 1,
  },
});
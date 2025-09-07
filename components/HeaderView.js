import React from "react";
import { SafeAreaView, View, Text, ScrollView, StatusBar, Platform, Pressable } from "react-native";

import styles from "./Header.Styles"
const HeaderView = ({ 
  style, 
  contentContainerStyle, 
  children, 
  onBackPress, 
  onProfilePress, 
  title = "Mitt Hushåll" // standardtitel
}) => {
  // SafeArea + Android-statusbar
  const safeAreaStyle = [
    styles.safe,
    style,
    { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }
  ];

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <View style={styles.container}>
        {/* Back-knapp vänster */}
        <Pressable style={styles.leftButton} onPress={onBackPress}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>

        {/* Titel centrerad */}
        <Text style={styles.title}>{title}</Text>

        {/* Profilikon höger */}
        <Pressable style={styles.rightButton} onPress={onProfilePress}>
          <Text style={styles.buttonText}>Profile</Text>
        </Pressable>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={[styles.scroll, contentContainerStyle]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HeaderView;

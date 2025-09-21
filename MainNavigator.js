import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import App from "./App";

import PantryPage from "./PantryPage";
const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={App} />
        <Stack.Screen name="PantryPage" component={PantryPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
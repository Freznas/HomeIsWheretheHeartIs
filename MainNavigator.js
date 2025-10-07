import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import App from "./App";

import PantryPage from "./Pages/PantryPage";
import ShoppingListPage from "./Pages/ShoppingListPage";
import ChoresPage from "./Pages/ChoresPage";
import BillsListPage from "./Pages/BillsPage";
import NotesPage from "./Pages/NotesPage";
const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={App} />
        <Stack.Screen name="PantryPage" component={PantryPage} />
        <Stack.Screen name="ShoppingListPage" component={ShoppingListPage} />
        <Stack.Screen name="ChoresPage" component={ChoresPage} />
        <Stack.Screen name="BillsPage" component={BillsListPage} />
        <Stack.Screen name="NotesPage" component={NotesPage} />

      </Stack.Navigator>
          
    </NavigationContainer>
  );
}


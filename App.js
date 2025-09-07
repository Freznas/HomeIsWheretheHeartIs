
import { View, Text,StyleSheet } from "react-native";
import HeaderView from "./components/HeaderView";
import HighlightSection from "./Sections/HighlightSection"

export default function App() {
  const handleBack = () => {
    console.log("Back pressed");
  };

 const handleProfile = () => {
    console.log("Profile pressed");
  };

  return (
  <HeaderView 
      onBackPress={handleBack} 
      onProfilePress={handleProfile}
      title="Mitt Hushåll"
    >
   <HighlightSection />
      {/* Här kan du lägga EventsSection, PantrySection osv */}
    </HeaderView>


  

    
     

      
   
  );
}






import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationsContext';
import { getUserHousehold, subscribeToPantry, addPantryItem, updatePantryItem, deletePantryItem } from '../../config/firebase';
import { pickAndUploadImage, deleteImage, getPathFromURL } from '../../utils/imageUpload';
import HeaderView from '../../components/common/HeaderView';
import { SkeletonList, PantryCategorySkeleton } from '../../components/common/SkeletonLoader';


export default function PantryPage({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const { sendPushToHousehold } = useNotifications();
  
  // 🔥 Firebase state - realtidsuppdatering
  const [pantryItems, setPantryItems] = useState([]);
  const [householdId, setHouseholdId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("st");
  const [newCategory, setNewCategory] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  
  const units = [
    { label: 'st', value: 'st', icon: '📦' },
    { label: 'kg', value: 'kg', icon: '⚖️' },
    { label: 'liter', value: 'liter', icon: '🧃' },
    { label: 'paket', value: 'paket', icon: '🎁' },
    { label: 'burk', value: 'burk', icon: '🥫' },
  ];

  // 🔥 Load household and setup real-time listener
  useEffect(() => {
    loadHouseholdAndPantry();
  }, []);

  useEffect(() => {
    if (!householdId) return;

    // Lyssna på realtidsuppdateringar från Firebase
    const unsubscribe = subscribeToPantry(householdId, (result) => {
      if (result.success) {
        setPantryItems(result.items || []);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [householdId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Firebase realtidsuppdatering sköter refresh automatiskt
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const loadHouseholdAndPantry = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const result = await getUserHousehold(currentUser.id);
    if (result.success && result.householdId) {
      setHouseholdId(result.householdId);
    } else {
      setLoading(false);
    }
  };

  // Produkt-databas för automatisk kategori-igenkänning
  const productDatabase = {
    'Frukt & Grönt': [
      'äpple', 'banan', 'apelsin', 'päron', 'vindruvor', 'jordgubbar', 'blåbär', 'hallon',
      'melon', 'vattenmelon', 'ananas', 'mango', 'kiwi', 'citron', 'lime', 'persika',
      'tomat', 'gurka', 'paprika', 'lök', 'vitlök', 'morot', 'potatis', 'sallad',
      'broccoli', 'blomkål', 'spenat', 'kål', 'zucchini', 'aubergine', 'pumpa',
      'avokado', 'chili', 'ingefära', 'purjolök', 'selleri', 'rädisa', 'rödlök'
    ],
    'Mejeri': [
      'mjölk', 'filmjölk', 'yoghurt', 'grädde', 'matlagningsgrädde', 'vispgrädde',
      'ost', 'smör', 'margarin', 'crème fraiche', 'kvarg', 'kesella', 'ägg'
    ],
    'Kött & Fisk': [
      'kyckling', 'köttfärs', 'bacon', 'korv', 'fläskfilé', 'fläskkotlett', 'entrecote',
      'oxfilé', 'lax', 'torsk', 'räkor', 'tonfisk', 'makrill', 'köttbullar', 'kött'
    ],
    'Bröd & Bageri': [
      'bröd', 'toast', 'frallor', 'hamburgerbröd', 'tortilla', 'pitabröd',
      'croissant', 'bulle', 'kaka', 'tårta', 'knäckebröd'
    ],
    'Skafferi': [
      'pasta', 'ris', 'couscous', 'bulgur', 'quinoa', 'müsli', 'havregryn',
      'mjöl', 'socker', 'salt', 'peppar', 'kryddor', 'olja', 'olivolja',
      'ketchup', 'senap', 'majonnäs', 'sås', 'buljong', 'tomatpuré', 'passata',
      'konserver', 'linser', 'bönor', 'kikärtor', 'nötter', 'mandel'
    ],
    'Dryck': [
      'juice', 'läsk', 'vatten', 'kaffe', 'te', 'öl', 'vin', 'saft', 'mjölk'
    ],
    'Frys': [
      'glass', 'pizza', 'frysta grönsaker', 'frysta bär', 'glass', 'pommes'
    ]
  };

  // Normalisera sträng för kategori-matchning
  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .replace(/&/g, 'och')
      .replace(/\s+/g, '') // Ta bort alla mellanslag
      .replace(/[^a-zåäö]/g, ''); // Behåll bara bokstäver
  };

  // Automatisk produkt-igenkänning
  const detectProductCategory = (productName) => {
    if (!productName || productName.trim().length < 2) return null;
    
    const normalized = productName.toLowerCase().trim();
    
    // Sök igenom alla kategorier
    for (const [category, products] of Object.entries(productDatabase)) {
      for (const product of products) {
        if (normalized.includes(product) || product.includes(normalized)) {
          return category;
        }
      }
    }
    
    return null;
  };

  // Hitta matchande kategori bland befintliga
  const findMatchingCategory = (input) => {
    if (!input || input.trim().length < 2) return null;
    
    const normalized = normalizeString(input);
    const existingCategories = [...new Set(pantryItems.map(item => item.category).filter(Boolean))];
    
    // Hitta exakt matchning eller liknande
    for (const category of existingCategories) {
      const categoryNormalized = normalizeString(category);
      if (categoryNormalized === normalized || categoryNormalized.includes(normalized) || normalized.includes(categoryNormalized)) {
        return category;
      }
    }
    return null;
  };

  // Hantera produktnamn-ändring med automatisk kategori-detektion
  const handleProductNameChange = (text) => {
    setNewName(text);
    if (errors.name) setErrors({ ...errors, name: undefined });
    
    // Auto-fyll kategori baserat på produktnamn (endast för nya produkter, inte vid redigering)
    if (text.trim().length >= 3 && !newCategory && !editingItem) {
      const detectedCategory = detectProductCategory(text);
      if (detectedCategory) {
        setNewCategory(detectedCategory);
      }
    }
  };

  // Uppdatera kategori-förslag när användaren skriver
  const handleCategoryChange = (text) => {
    setNewCategory(text);
    if (errors.category) setErrors({ ...errors, category: undefined });
    
    if (text.trim().length >= 2) {
      const existingCategories = [...new Set(pantryItems.map(item => item.category).filter(Boolean))];
      const normalized = normalizeString(text);
      
      const suggestions = existingCategories.filter(category => {
        const categoryNormalized = normalizeString(category);
        return categoryNormalized.includes(normalized) || normalized.includes(categoryNormalized);
      });
      
      setCategorySuggestions(suggestions);
      setShowCategorySuggestions(suggestions.length > 0);
    } else {
      setShowCategorySuggestions(false);
      setCategorySuggestions([]);
    }
  };
  // Gruppera items per kategori från AsyncStorage data
  const groupedPantry = useMemo(() => {
    return (pantryItems || []).reduce((acc, item) => {
      const category = item.category || "Okategoriserat";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [pantryItems]);

 if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.text }]}>Laddar skafferidata...</Text>
      </View>
    );
  }

  if (!householdId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBackground} />
        <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backIcon, { color: theme.headerText }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.headerText }]}>Skafferi</Text>
          </View>
        </View>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={[styles.emptyText, { color: theme.text }]}>Du måste vara med i ett hushåll</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Gå till Profil och skapa eller gå med i ett hushåll först
            </Text>
            <TouchableOpacity 
              style={[styles.goToProfileButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.goToProfileText}>Gå till Profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }







  
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.itemCard, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor, borderColor: theme.border }]} 
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemRow}>
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.itemImage}
          />
        )}
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
            <View style={[styles.quantityBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.quantityText, { color: theme.textInverse }]}>{item.quantity + " " + item.unit}</Text>
            </View>
          </View>
          <View style={styles.itemFooter}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Text style={styles.editHint}>Tryck för att redigera</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item: categoryName }) => {
    const items = groupedPantry[categoryName];
    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={[styles.categoryTitle, { color: theme.text }]}>{categoryName}</Text>
          <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>{items.length} varor</Text>
        </View>
        {items.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={[styles.itemCard, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor, borderColor: theme.border }]} 
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
              <View style={[styles.quantityBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.quantityText, { color: theme.textInverse }]}>{item.quantity + " " + item.unit}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewQuantity(item.quantity);
    setNewUnit(item.unit);
    setNewCategory(item.category);
    setNewImage(item.image || null);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewName("");
    setNewQuantity("");
    setNewUnit("st");
    setNewCategory("");
    setNewImage(null);
    setModalVisible(true);
  };

  const handleUploadImage = async () => {
    try {
      setUploadingImage(true);
      
      const storagePath = `pantry/${householdId}/${Date.now()}.jpg`;
      const downloadURL = await pickAndUploadImage(storagePath, {
        aspect: [4, 3],
        quality: 0.8,
        compress: { width: 600, height: 450, compress: 0.7 },
      });
      
      if (downloadURL) {
        setNewImage(downloadURL);
        toast.success('📷 Bild uppladdad!');
      }
    } catch (error) {
      console.error('Error uploading pantry image:', error);
      toast.error('Kunde inte ladda upp bild');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    let newErrors = {};
    if (!newName.trim()) newErrors.name = "Fyll i produktnamn";
    if (!newQuantity.trim()) newErrors.quantity = "Fyll i mängd";
    if (!newCategory.trim()) newErrors.category = "Fyll i kategori";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (!householdId) {
      toast.error('Du måste vara med i ett hushåll för att lägga till varor.');
      return;
    }

    // Använd matchad kategori om den finns
    const matchedCategory = findMatchingCategory(newCategory) || newCategory.trim();

    if (editingItem) {
      // 🔥 Uppdatera befintlig vara i Firebase
      const updates = {
        name: newName.trim(),
        quantity: newQuantity.trim(),
        unit: newUnit,
        category: matchedCategory,
      };
      
      // Add image if changed
      if (newImage !== editingItem.image) {
        updates.image = newImage;
        
        // Delete old image if exists and is different
        if (editingItem.image && editingItem.image.startsWith('http')) {
          const oldPath = getPathFromURL(editingItem.image);
          if (oldPath) {
            await deleteImage(oldPath);
          }
        }
      }
      
      const result = await updatePantryItem(householdId, editingItem.id, updates, currentUser.id);
      
      if (!result.success) {
        toast.error(result.error || 'Kunde inte uppdatera vara');
        return;
      }
      toast.success('Varan har uppdaterats!');
      
      // 🔔 Check if quantity is low and send warning
      const quantity = parseInt(newQuantity.trim());
      if (!isNaN(quantity) && quantity <= 2) {
        await sendPushToHousehold({
          title: '⚠️ Lågt lager i skafferiet',
          body: `${newName.trim()} håller på att ta slut! Endast ${newQuantity.trim()} ${newUnit} kvar.`,
          data: { type: 'pantry', screen: 'PantryPage', alert: 'low-stock' },
          excludeUserId: currentUser.id,
        });
      }
    } else {
      // 🔥 Lägg till ny vara i Firebase
      const result = await addPantryItem(householdId, {
        name: newName.trim(),
        quantity: newQuantity.trim(),
        unit: newUnit,
        category: matchedCategory,
        image: newImage || null,
      }, currentUser.id);
      
      if (!result.success) {
        toast.error(result.error || 'Kunde inte lägga till vara');
        return;
      }
      toast.success('Varan har lagts till!');
      
      // 🔔 Send push notification to household
      await sendPushToHousehold({
        title: '🥫 Ny vara i skafferiet',
        body: `${currentUser.displayName || 'Någon'} lade till: ${newName.trim()} (${newQuantity.trim()} ${newUnit})`,
        data: { type: 'pantry', screen: 'PantryPage' },
        excludeUserId: currentUser.id,
      });
    }

    resetModal();
  };

  const handleDelete = async () => {
    if (editingItem && householdId) {
      // 🔥 Ta bort vara från Firebase
      const result = await deletePantryItem(householdId, editingItem.id);
      
      if (!result.success) {
        toast.error(result.error || 'Kunde inte ta bort vara');
        return;
      }
      
      toast.success('Varan har tagits bort');
      resetModal();
    }
  };

  const resetModal = () => {
    setNewName("");
    setNewQuantity("");
    setNewUnit("st");
    setNewCategory("");
    setEditingItem(null);
    setErrors({});
    setModalVisible(false);
    setShowCategorySuggestions(false);
    setCategorySuggestions([]);
  };

  return (
    <HeaderView
      title={t('pantry.title')}
      subtitle={`${(pantryItems || []).length} varor totalt`}
      navigation={navigation}
    >

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {loading ? (
          <SkeletonList count={3} CardComponent={PantryCategorySkeleton} />
        ) : Object.keys(groupedPantry).length > 0 ? (
          <FlatList
            data={Object.keys(groupedPantry)}
            keyExtractor={item => item}
            renderItem={renderCategory}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🥫</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Tomt skafferi</Text>
            <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
              Ditt skafferi är tomt! Tryck på knappen nedan för att lägga till dina första varor.
            </Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ {t('pantry.add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Modern Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={resetModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.modalBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingItem ? t('pantry.edit') : t('pantry.add')}
              </Text>
              <TouchableOpacity onPress={resetModal} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: theme.text }]}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Produktnamn</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }, errors.name && styles.inputError]}
                  placeholder="T.ex. Mjölk, Bröd, Äpple..."
                  placeholderTextColor={theme.textSecondary}
                  value={newName}
                  onChangeText={handleProductNameChange}
                />
                {errors.name && <Text style={[styles.errorText, { color: theme.error }]}>{errors.name}</Text>}
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: 12 }]}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Mängd</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }, errors.quantity && styles.inputError]}
                    placeholder="Antal"
                    placeholderTextColor={theme.textSecondary}
                    value={newQuantity}
                    onChangeText={text => {
                      const numeric = text.replace(/[^0-9]/g, "");
                      setNewQuantity(numeric);
                      if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                    }}
                    keyboardType="numeric"
                  />
                  {errors.quantity && <Text style={[styles.errorText, { color: theme.error }]}>{errors.quantity}</Text>}
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Enhet</Text>
                  <TouchableOpacity
                    style={[styles.unitPickerButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                    onPress={() => setShowUnitPicker(!showUnitPicker)}
                  >
                    <Text style={[styles.unitPickerText, { color: theme.text }]}>
                      {units.find(u => u.value === newUnit)?.icon} {newUnit}
                    </Text>
                    <Text style={styles.dropdownArrow}>{showUnitPicker ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  
                  {showUnitPicker && (
                    <ScrollView 
                      style={[styles.unitScrollList, { backgroundColor: theme.card, borderColor: theme.border }]}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {units.map((unit, index) => (
                        <TouchableOpacity
                          key={unit.value}
                          style={[
                            styles.unitOption,
                            newUnit === unit.value && styles.unitOptionActive,
                            index !== units.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                          ]}
                          onPress={() => {
                            setNewUnit(unit.value);
                            setShowUnitPicker(false);
                          }}
                        >
                          <Text style={[styles.unitOptionText, { color: theme.text }]}>
                            {unit.icon} {unit.label}
                          </Text>
                          {newUnit === unit.value && (
                            <Text style={styles.checkIcon}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Kategori</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }, errors.category && styles.inputError]}
                  placeholder="T.ex. Mejeri, Bageri..."
                  placeholderTextColor={theme.textSecondary}
                  value={newCategory}
                  onChangeText={handleCategoryChange}
                />
                {showCategorySuggestions && categorySuggestions.length > 0 && (
                  <View style={[styles.suggestionsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.suggestionsTitle, { color: theme.textSecondary }]}>Föreslagna kategorier:</Text>
                    {categorySuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
                        onPress={() => {
                          setNewCategory(suggestion);
                          setShowCategorySuggestions(false);
                        }}
                      >
                        <Text style={[styles.suggestionText, { color: theme.text }]}>{suggestion}</Text>
                        <Text style={styles.suggestionIcon}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {errors.category && <Text style={[styles.errorText, { color: theme.error }]}>{errors.category}</Text>}
              </View>
              
              {/* Image Upload Section */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Produktbild (valfritt)</Text>
                {newImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: newImage }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: theme.error }]}
                      onPress={() => setNewImage(null)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.uploadImageButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                    onPress={handleUploadImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <>
                        <Text style={styles.uploadImageIcon}>📷</Text>
                        <Text style={[styles.uploadImageText, { color: theme.text }]}>Lägg till bild</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, { backgroundColor: theme.success }]} 
                onPress={handleSave}
              >
                <Text style={[styles.saveButtonText, { color: theme.textInverse }]}>
                  {editingItem ? t('common.edit') : t('common.add')}
                </Text>
              </TouchableOpacity>
              
              {editingItem && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton, { backgroundColor: theme.error }]} 
                  onPress={handleDelete}
                >
                  <Text style={[styles.deleteButtonText, { color: theme.textInverse }]}>{t('common.delete')}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton, { borderColor: theme.border }]} 
                onPress={resetModal}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </HeaderView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    backgroundColor: "#3949ab",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  addHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  addHeaderIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  categoryCount: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: "#3949ab",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryTag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  editHint: {
    fontSize: 10,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#3949ab",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    minHeight: "70%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#6b7280",
    fontWeight: "bold",
  },
  modalForm: {
    padding: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#1f2937",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  rowInputs: {
    flexDirection: "row",
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  picker: {
    height: 48,
    color: "#1f2937",
  },
  unitPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  unitPickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  unitScrollList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 180,
    borderWidth: 2,
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  unitOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  unitOptionActive: {
    backgroundColor: 'rgba(57, 73, 171, 0.1)',
  },
  unitOptionText: {
    fontSize: 16,
  },
  checkIcon: {
    fontSize: 18,
    color: '#3949ab',
    fontWeight: 'bold',
  },
  modalActions: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#3949ab",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  // Tom lista styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionsTitle: {
    fontSize: 11,
    color: '#6b7280',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1f2937',
  },
  suggestionIcon: {
    fontSize: 16,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  goToProfileButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goToProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  uploadImageIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  uploadImageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});


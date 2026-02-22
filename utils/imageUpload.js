import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Begär kamera- och galleri-behörigheter
 */
export const requestPermissions = async () => {
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
  const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  return {
    camera: cameraStatus === 'granted',
    library: libraryStatus === 'granted',
  };
};

/**
 * Välj bild från galleri
 * @param {Object} options - Konfiguration för bildval
 * @returns {Promise<Object|null>} Bildresultat eller null
 */
export const pickImageFromLibrary = async (options = {}) => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: options.aspect || [1, 1],
      quality: options.quality || 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image from library:', error);
    throw error;
  }
};

/**
 * Ta foto med kameran
 * @param {Object} options - Konfiguration för kamera
 * @returns {Promise<Object|null>} Bildresultat eller null
 */
export const takePhoto = async (options = {}) => {
  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: options.aspect || [1, 1],
      quality: options.quality || 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

/**
 * Komprimera och ändra storlek på bild
 * @param {string} uri - Bildens URI
 * @param {Object} options - Komprimeringsinställningar
 * @returns {Promise<Object>} Komprimerad bild
 */
export const compressImage = async (uri, options = {}) => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: options.width || 800,
            height: options.height || 800,
          },
        },
      ],
      {
        compress: options.compress || 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipResult;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

/**
 * Ladda upp bild till Firebase Storage
 * @param {string} uri - Bildens lokala URI
 * @param {string} path - Sökväg i Firebase Storage (t.ex. "profiles/user123.jpg")
 * @returns {Promise<string>} Download URL för uppladdad bild
 */
export const uploadImage = async (uri, path) => {
  try {
    // Konvertera URI till blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Skapa referens till Firebase Storage
    const storageRef = ref(storage, path);

    // Ladda upp blob
    await uploadBytes(storageRef, blob);

    // Hämta download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Ta bort bild från Firebase Storage
 * @param {string} path - Sökväg i Firebase Storage
 * @returns {Promise<boolean>} True om borttagningen lyckades
 */
export const deleteImage = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Komplett bilduppladdningsflöde: välj -> komprimera -> ladda upp
 * @param {string} storagePath - Sökväg i Firebase Storage
 * @param {Object} options - Konfiguration
 * @returns {Promise<string|null>} Download URL eller null
 */
export const pickAndUploadImage = async (storagePath, options = {}) => {
  try {
    // Begär behörigheter
    const permissions = await requestPermissions();
    if (!permissions.library) {
      throw new Error('Galleri-behörighet nekad');
    }

    // Välj bild
    const image = await pickImageFromLibrary(options);
    if (!image) return null;

    // Komprimera bild
    const compressed = await compressImage(image.uri, options.compress);

    // Ladda upp till Firebase Storage
    const downloadURL = await uploadImage(compressed.uri, storagePath);

    return downloadURL;
  } catch (error) {
    console.error('Error in pickAndUploadImage:', error);
    throw error;
  }
};

/**
 * Komplett fotoflöde: ta foto -> komprimera -> ladda upp
 * @param {string} storagePath - Sökväg i Firebase Storage
 * @param {Object} options - Konfiguration
 * @returns {Promise<string|null>} Download URL eller null
 */
export const takeAndUploadPhoto = async (storagePath, options = {}) => {
  try {
    // Begär behörigheter
    const permissions = await requestPermissions();
    if (!permissions.camera) {
      throw new Error('Kamera-behörighet nekad');
    }

    // Ta foto
    const photo = await takePhoto(options);
    if (!photo) return null;

    // Komprimera bild
    const compressed = await compressImage(photo.uri, options.compress);

    // Ladda upp till Firebase Storage
    const downloadURL = await uploadImage(compressed.uri, storagePath);

    return downloadURL;
  } catch (error) {
    console.error('Error in takeAndUploadPhoto:', error);
    throw error;
  }
};

/**
 * Extrahera filnamn från Firebase Storage URL
 * @param {string} url - Firebase Storage URL
 * @returns {string|null} Filnamn eller null
 */
export const getPathFromURL = (url) => {
  try {
    if (!url) return null;
    
    // Firebase Storage URLs har format: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?alt=media&token=...
    const match = url.match(/\/o\/(.+?)\?/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
};

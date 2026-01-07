import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { uploadRequestFile, UploadedFile } from './fileUploadService';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Service for handling image and file picking for supplier evidence
 */

export interface PickedMedia {
    uri: string;
    name: string;
    type: string;
    size?: number;
}

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
        return true; // Web doesn't need explicit permissions
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert(
            'Permiso Requerido',
            'Se necesita permiso para acceder a la cámara'
        );
        return false;
    }
    return true;
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
        return true;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert(
            'Permiso Requerido',
            'Se necesita permiso para acceder a la galería'
        );
        return false;
    }
    return true;
};

/**
 * Take a photo with camera
 */
export const takePhoto = async (): Promise<PickedMedia | null> => {
    try {
        const hasPermission = await requestCameraPermissions();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (result.canceled) {
            return null;
        }

        const asset = result.assets[0];
        return {
            uri: asset.uri,
            name: `photo_${Date.now()}.jpg`,
            type: 'image/jpeg',
            size: asset.fileSize,
        };
    } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'No se pudo tomar la foto');
        return null;
    }
};

/**
 * Pick image from gallery
 */
export const pickFromGallery = async (): Promise<PickedMedia | null> => {
    try {
        const hasPermission = await requestMediaLibraryPermissions();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (result.canceled) {
            return null;
        }

        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || `image_${Date.now()}.jpg`;

        return {
            uri: asset.uri,
            name: fileName,
            type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
            size: asset.fileSize,
        };
    } catch (error) {
        console.error('Error picking from gallery:', error);
        Alert.alert('Error', 'No se pudo seleccionar la imagen');
        return null;
    }
};

/**
 * Pick multiple images from gallery
 */
export const pickMultipleImages = async (): Promise<PickedMedia[]> => {
    try {
        const hasPermission = await requestMediaLibraryPermissions();
        if (!hasPermission) return [];

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (result.canceled) {
            return [];
        }

        return result.assets.map((asset, index) => {
            const fileName = asset.uri.split('/').pop() || `image_${Date.now()}_${index}.jpg`;
            return {
                uri: asset.uri,
                name: fileName,
                type: 'image/jpeg',
                size: asset.fileSize,
            };
        });
    } catch (error) {
        console.error('Error picking multiple images:', error);
        Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
        return [];
    }
};

/**
 * Pick a document/file
 */
export const pickDocument = async (): Promise<PickedMedia | null> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return null;
        }

        const file = result.assets[0];
        return {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
            size: file.size,
        };
    } catch (error) {
        console.error('Error picking document:', error);
        Alert.alert('Error', 'No se pudo seleccionar el archivo');
        return null;
    }
};

/**
 * Show upload options dialog
 */
export const showUploadOptions = (
    onCamera: () => void,
    onGallery: () => void,
    onDocument: () => void
) => {
    Alert.alert(
        'Subir Evidencia',
        'Selecciona una opción',
        [
            {
                text: 'Tomar Foto',
                onPress: onCamera,
            },
            {
                text: 'Desde Galería',
                onPress: onGallery,
            },
            {
                text: 'Seleccionar Archivo',
                onPress: onDocument,
            },
            {
                text: 'Cancelar',
                style: 'cancel',
            },
        ],
        { cancelable: true }
    );
};

/**
 * Upload supplier evidence to Firebase Storage
 */
export const uploadSupplierEvidence = async (
    supplierId: string,
    category: 'quality' | 'supply' | 'evidence',
    identifier: string, // questionId or categoryId
    fileUri: string,
    fileName: string
): Promise<string> => {
    try {
        // Read file as blob
        const response = await fetch(fileUri);
        const blob = await response.blob();

        // Create storage reference
        const storagePath = `suppliers/${supplierId}/${category}/${identifier}/${fileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // Progress tracking (optional)
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload is ${progress}% done`);
                },
                (error) => {
                    console.error('Upload error:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error uploading supplier evidence:', error);
        throw error;
    }
};

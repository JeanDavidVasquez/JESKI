import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebaseConfig';


/**
 * Service for handling file uploads and downloads for requests
 */

export interface UploadProgress {
    bytesTransferred: number;
    totalBytes: number;
    percentage: number;
}

export interface UploadedFile {
    name: string;
    url: string;
    type?: string;
    size?: number;
}

/**
 * Upload a file to Firebase Storage for a specific request
 * @param requestId - ID of the request
 * @param fileUri - Local file URI
 * @param fileName - Name of the file
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with uploaded file metadata
 */
export const uploadRequestFile = async (
    requestId: string,
    fileUri: string,
    fileName: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFile> => {
    try {
        // Read file as blob
        const response = await fetch(fileUri);
        const blob = await response.blob();

        // Create storage reference
        const storageRef = ref(storage, `requests/${requestId}/${fileName}`);

        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // Progress callback
                    if (onProgress) {
                        const progress: UploadProgress = {
                            bytesTransferred: snapshot.bytesTransferred,
                            totalBytes: snapshot.totalBytes,
                            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                        };
                        onProgress(progress);
                    }
                },
                (error) => {
                    // Error callback
                    console.error('Upload error:', error);
                    reject(error);
                },
                async () => {
                    // Success callback
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        // Get file info from blob directly (works on web & native)
                        const uploadedFile: UploadedFile = {
                            name: fileName,
                            url: downloadURL,
                            type: blob.type,
                            size: blob.size,
                        };

                        resolve(uploadedFile);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

/**
 * Delete a file from Firebase Storage
 * @param fileUrl - Full download URL of the file
 */
export const deleteRequestFile = async (fileUrl: string): Promise<void> => {
    try {
        // Extract storage path from URL
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

/**
 * Get file name from download URL
 * @param url - Download URL
 * @returns File name
 */
export const getFileNameFromUrl = (url: string): string => {
    try {
        const decodedUrl = decodeURIComponent(url);
        const parts = decodedUrl.split('/');
        const fileNameWithParams = parts[parts.length - 1];
        const fileName = fileNameWithParams.split('?')[0];
        return fileName;
    } catch (error) {
        console.error('Error extracting file name:', error);
        return 'file';
    }
};

/**
 * Get file extension from file name
 * @param fileName - Name of the file
 * @returns File extension (e.g., 'pdf', 'jpg')
 */
export const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., '2.5 MB')
 */
export const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Desconocido';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Validate file size (max 10MB by default)
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes (default: 10MB)
 * @returns True if valid, false otherwise
 */
export const validateFileSize = (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
    return size <= maxSize;
};

import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, deleteObject, getDownloadURL } from '@angular/fire/storage';

@Injectable({
    providedIn: 'root'
})
export class PhotoStorageService {
    private readonly USER_PHOTOS = 'user_photos';
    private readonly DOCTOR_PHOTOS = 'doctor_photos';
    private readonly ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

    constructor(private storage: Storage) { }

    /**
     * Validates if the file has an allowed MIME type.
     * @param file The file to validate.
     * @returns True if the MIME type is allowed, false otherwise.
     */
    private isValidFileType(file: File): boolean {
        return this.ALLOWED_FILE_TYPES.includes(file.type);
    }

    /**
     * Uploads or updates a user's photo in Firebase Storage.
     * The photo is stored with the name '{id}' without an extension.
     * @param id The unique identifier of the user.
     * @param file The image file to upload.
     * @returns A promise that resolves to the download URL of the uploaded photo.
     * @throws Will throw an error if the file type is not allowed.
     */
    async setUserPhoto(id: string, file: File): Promise<string> {
        if (!this.isValidFileType(file)) {
            throw new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.');
        }

        const filePath = `${this.USER_PHOTOS}/${id}`;
        const storageRef = ref(this.storage, filePath);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    }

    /**
     * Uploads or updates a doctor's photo in Firebase Storage.
     * The photo is stored with the name '{id}' without an extension.
     * @param id The unique identifier of the doctor.
     * @param file The image file to upload.
     * @returns A promise that resolves to the download URL of the uploaded photo.
     * @throws Will throw an error if the file type is not allowed.
     */
    async setDoctorPhoto(id: string, file: File): Promise<string> {
        if (!this.isValidFileType(file)) {
            throw new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.');
        }

        const filePath = `${this.DOCTOR_PHOTOS}/${id}`;
        const storageRef = ref(this.storage, filePath);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    }

    /**
     * Deletes a user's photo from Firebase Storage based on their unique identifier.
     * The photo is stored with the name '{id}' without an extension.
     * @param id The unique identifier of the user.
     * @returns A promise that resolves when the photo is deleted.
     * @throws Will throw an error if deletion fails.
     */
    async deleteUserPhoto(id: string): Promise<void> {
        const filePath = `${this.USER_PHOTOS}/${id}`;
        const storageRef = ref(this.storage, filePath);
        await deleteObject(storageRef);
    }

    /**
     * Deletes a doctor's photo from Firebase Storage based on their unique identifier.
     * The photo is stored with the name '{id}' without an extension.
     * @param id The unique identifier of the doctor.
     * @returns A promise that resolves when the photo is deleted.
     * @throws Will throw an error if deletion fails.
     */
    async deleteDoctorPhoto(id: string): Promise<void> {
        const filePath = `${this.DOCTOR_PHOTOS}/${id}`;
        const storageRef = ref(this.storage, filePath);
        await deleteObject(storageRef);
    }

    /**
     * Retrieves the download URL of a user's photo.
     * The photo is stored with the name '{id}' without an extension.
     * @param id The unique identifier of the user.
     * @returns A promise that resolves to the download URL of the user's photo.
     * @throws Will throw an error if retrieval fails.
     */
    async getUserPhotoUrl(id: string): Promise<string> {
        const filePath = `${this.USER_PHOTOS}/${id}`;
        const storageRef = ref(this.storage, filePath);
        return getDownloadURL(storageRef);
    }

    /**
     * Retrieves the download URL of a doctor's photo.
     * The photo is stored with the name '{id}' without an extension.
     * @param id The unique identifier of the doctor.
     * @returns A promise that resolves to the download URL of the doctor's photo.
     * @throws Will throw an error if retrieval fails.
     */
    async getDoctorPhotoUrl(id: string): Promise<string> {
        const filePath = `${this.DOCTOR_PHOTOS}/${id}`;
        const storageRef = ref(this.storage, filePath);
        return getDownloadURL(storageRef);
    }
}
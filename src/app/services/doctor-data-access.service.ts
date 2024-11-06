import { Injectable } from '@angular/core';
import { Database, ref, onValue, off, set, remove, child } from '@angular/fire/database';
import { Doctor } from '../models/doctor.model';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

/**
 * Service for accessing and managing doctor data in the Firebase Realtime Database.
 * Provides methods to retrieve, create, update, and delete doctor records.
 */
@Injectable({
    providedIn: 'root'
})
export class DoctorDataAccessService {
    private readonly DOCTORS_ROOT = 'doctors';

    constructor(private db: Database) { }

    /**
     * Retrieves all doctors in real-time.
     * 
     * @returns Observable emitting arrays of Doctor objects.
     * @throws Will emit an error if there is an issue accessing the database.
     */
    getAllDoctors(): Observable<Doctor[]> {
        return new Observable<Doctor[]>(observer => {
            const doctorsRef = ref(this.db, this.DOCTORS_ROOT);

            const onValueCallback = (snapshot: any) => {
                const doctorsData = snapshot.val();
                if (doctorsData) {
                    const doctors: Doctor[] = Object.values(doctorsData) as Doctor[];
                    observer.next(doctors);
                } else {
                    observer.next([]);
                }
            };

            // Subscribe to changes in the doctors data
            onValue(doctorsRef, onValueCallback, (error) => {
                observer.error(error);
            });

            // Teardown logic to unsubscribe from the listener when the Observable is unsubscribed
            return () => {
                off(doctorsRef, 'value', onValueCallback);
            };
        });
    }

    /**
     * Retrieves a doctor by their unique identifier (ID).
     * 
     * @param id The unique identifier of the doctor to retrieve.
     * @returns A promise that resolves to the Doctor object if found, otherwise `null`.
     * @throws Will reject the promise if there is an error accessing the database.
     */
    async getDoctorById(id: string): Promise<Doctor | null> {
        const doctorRef = ref(this.db, `${this.DOCTORS_ROOT}/${id}`);
        return new Promise((resolve, reject) => {
            onValue(doctorRef, snapshot => {
                resolve(snapshot.val() || null);
            }, error => {
                reject(error);
            });
        });
    }

    /**
     * Sets or updates a doctor's data by their unique identifier (ID).
     * 
     * @param id The unique identifier of the doctor.
     * @param name The name of the doctor.
     * @param degrees The degrees held by the doctor.
     * @param phoneNumber The doctor's phone number.
     * @param profilePictureUri URI to the doctor's profile picture.
     * @param departmentId The ID of the department the doctor belongs to.
     * @param hospitalId The ID of the hospital the doctor is affiliated with.
     * @returns A promise that resolves when the doctor data is successfully set.
     * @throws Will reject the promise if there is an error setting the doctor data.
     */
    async setDoctorById(
        id: string,
        name: string,
        degrees: string,
        phoneNumber: string,
        profilePictureUri: string,
        departmentId: string,
        hospitalId: string
    ): Promise<void> {
        const doctor: Doctor = { id, name, degrees, phoneNumber, profilePictureUri, departmentId, hospitalId };
        const doctorRef = child(ref(this.db, this.DOCTORS_ROOT), id);
        await set(doctorRef, doctor);
    }

    /**
     * Adds a new doctor with the provided details.
     * Generates a unique identifier for the doctor.
     * 
     * @param name The name of the doctor.
     * @param degrees The degrees held by the doctor.
     * @param phoneNumber The doctor's phone number.
     * @param profilePictureUri URI to the doctor's profile picture.
     * @param departmentId The ID of the department the doctor belongs to.
     * @param hospitalId The ID of the hospital the doctor is affiliated with.
     * @returns A promise that resolves when the doctor is successfully added.
     * @throws Will reject the promise if there is an error adding the doctor.
     */
    async addDoctor(
        name: string,
        degrees: string,
        phoneNumber: string,
        profilePictureUri: string,
        departmentId: string,
        hospitalId: string
    ): Promise<void> {
        const id = uuidv4().replace(/-/g, '');
        const doctor: Doctor = { id, name, degrees, phoneNumber, profilePictureUri, departmentId, hospitalId };
        const doctorRef = child(ref(this.db, this.DOCTORS_ROOT), id);
        await set(doctorRef, doctor);
    }

    /**
     * Removes a doctor from the database by their unique identifier (ID).
     * 
     * @param id The unique identifier of the doctor to remove.
     * @returns A promise that resolves when the doctor is successfully removed.
     * @throws Will reject the promise if there is an error removing the doctor.
     */
    async removeDoctorById(id: string): Promise<void> {
        const doctorRef = child(ref(this.db, this.DOCTORS_ROOT), id);
        await remove(doctorRef);
    }
}
import { Injectable } from '@angular/core';
import { Database, ref, onValue, off, set, remove, child } from '@angular/fire/database';
import { Hospital } from '../models/hospital.model';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

/**
 * Service for accessing and managing hospital data in the Firebase Realtime Database.
 * Provides methods to retrieve, create, update, and delete hospital records.
 */
@Injectable({
    providedIn: 'root'
})
export class HospitalDataAccessService {
    private readonly HOSPITALS_ROOT = 'hospitals';

    constructor(private db: Database) { }

    /**
     * Retrieves all hospitals in real-time.
     * 
     * @returns Observable emitting arrays of Hospital objects.
     * @throws Will emit an error if there is an issue accessing the database.
     */
    getAllHospitals(): Observable<Hospital[]> {
        return new Observable<Hospital[]>(observer => {
            const hospitalsRef = ref(this.db, this.HOSPITALS_ROOT);

            const onValueCallback = (snapshot: any) => {
                const hospitalsData = snapshot.val();
                if (hospitalsData) {
                    const hospitals: Hospital[] = Object.values(hospitalsData) as Hospital[];
                    observer.next(hospitals);
                } else {
                    observer.next([]);
                }
            };

            // Subscribe to changes in the hospitals data
            onValue(hospitalsRef, onValueCallback, (error) => {
                observer.error(error);
            });

            // Teardown logic to unsubscribe from the listener when the Observable is unsubscribed
            return () => {
                off(hospitalsRef, 'value', onValueCallback);
            };
        });
    }

    /**
     * Retrieves a hospital by its unique identifier (ID).
     * 
     * @param id The unique identifier of the hospital to retrieve.
     * @returns A promise that resolves to the Hospital object if found, otherwise `null`.
     * @throws Will reject the promise if there is an error accessing the database.
     */
    async getHospitalById(id: string): Promise<Hospital | null> {
        const hospitalRef = ref(this.db, `${this.HOSPITALS_ROOT}/${id}`);
        return new Promise((resolve, reject) => {
            onValue(hospitalRef, snapshot => {
                resolve(snapshot.val() || null);
            }, error => {
                reject(error);
            });
        });
    }

    /**
     * Sets or updates a hospital's data by its unique identifier (ID).
     * 
     * @param id The unique identifier of the hospital.
     * @param name The name of the hospital.
     * @param streetAddress The street address of the hospital.
     * @param neighborhood The neighborhood where the hospital is located.
     * @param city The city where the hospital is located.
     * @param postalCode The postal code of the hospital's location.
     * @param country The country where the hospital is located.
     * @param appointmentLink The appointment scheduling link for the hospital.
     * @returns A promise that resolves when the hospital data is successfully set.
     * @throws Will reject the promise if there is an error setting the hospital data.
     */
    async setHospitalById(
        id: string,
        name: string,
        streetAddress: string,
        neighborhood: string,
        city: string,
        postalCode: string,
        country: string,
        appointmentLink: string
    ): Promise<void> {
        const hospital: Hospital = { id, name, streetAddress, neighborhood, city, postalCode, country, appointmentLink };
        const hospitalRef = child(ref(this.db, this.HOSPITALS_ROOT), id);
        await set(hospitalRef, hospital);
    }

    /**
     * Adds a new hospital with the provided details.
     * Generates a unique identifier for the hospital.
     * 
     * @param name The name of the hospital.
     * @param streetAddress The street address of the hospital.
     * @param neighborhood The neighborhood where the hospital is located.
     * @param city The city where the hospital is located.
     * @param postalCode The postal code of the hospital's location.
     * @param country The country where the hospital is located.
     * @param appointmentLink The appointment scheduling link for the hospital.
     * @returns A promise that resolves when the hospital is successfully added.
     * @throws Will reject the promise if there is an error adding the hospital.
     */
    async addHospital(
        name: string,
        streetAddress: string,
        neighborhood: string,
        city: string,
        postalCode: string,
        country: string,
        appointmentLink: string
    ): Promise<void> {
        const id = uuidv4().replace(/-/g, '');
        const hospital: Hospital = { id, name, streetAddress, neighborhood, city, postalCode, country, appointmentLink };
        const hospitalRef = child(ref(this.db, this.HOSPITALS_ROOT), id);
        await set(hospitalRef, hospital);
    }

    /**
     * Removes a hospital from the database by its unique identifier (ID).
     * 
     * @param id The unique identifier of the hospital to remove.
     * @returns A promise that resolves when the hospital is successfully removed.
     * @throws Will reject the promise if there is an error removing the hospital.
     */
    async removeHospitalById(id: string): Promise<void> {
        const hospitalRef = child(ref(this.db, this.HOSPITALS_ROOT), id);
        await remove(hospitalRef);
    }
}
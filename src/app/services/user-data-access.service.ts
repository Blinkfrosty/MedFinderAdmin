import { Injectable } from '@angular/core';
import { Database, ref, onValue, off, set, remove, child } from '@angular/fire/database';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';

/**
 * Service for accessing and managing user data in the Firebase Realtime Database.
 * Provides methods to retrieve, create, update, and delete user records.
 */
@Injectable({
    providedIn: 'root'
})
export class UserDataAccessService {
    private readonly USERS_ROOT = 'users';

    constructor(private db: Database) { }

    /**
     * Retrieves all users excluding specified UIDs in real-time.
     * 
     * @param excludeUids Array of user IDs to exclude from the result.
     * @returns Observable emitting arrays of User objects excluding the specified UIDs.
     */
    getAllUsersObservableExcluding(excludeUids: string[]): Observable<User[]> {
        return new Observable<User[]>(observer => {
            const usersRef = ref(this.db, this.USERS_ROOT);

            const onValueCallback = (snapshot: any) => {
                const usersData = snapshot.val();
                if (usersData) {
                    const users: User[] = (Object.values(usersData) as User[])
                        .filter(user => !excludeUids.includes(user.id));
                    observer.next(users);
                } else {
                    observer.next([]);
                }
            };

            // Subscribe to changes
            onValue(usersRef, onValueCallback, (error) => {
                observer.error(error);
            });

            // Teardown logic to unsubscribe from the listener
            return () => {
                off(usersRef, 'value', onValueCallback);
            };
        });
    }
    
    /**
     * Retrieves a user by their unique identifier (UID).
     * 
     * @param uid The unique identifier of the user to retrieve.
     * @returns A promise that resolves to the User object if found, otherwise `null`.
     * @throws Will reject the promise if there is an error accessing the database.
     */
    async getUserByUid(uid: string): Promise<User | null> {
        const userRef = ref(this.db, `${this.USERS_ROOT}/${uid}`);
        return new Promise((resolve, reject) => {
            onValue(userRef, snapshot => {
                resolve(snapshot.val() || null);
            }, error => {
                reject(error);
            });
        });
    }

    /**
     * Sets or updates a user's data by their unique identifier (UID).
     * 
     * @param id The unique identifier of the user.
     * @param firstName The user's first name.
     * @param lastName The user's last name.
     * @param email The user's email address.
     * @param phoneNumber The user's phone number.
     * @param genderCode The code representing the user's gender.
     * @param profilePictureUri URI to the user's profile picture.
     * @param isPatient Indicates if the user is a patient.
     * @param isHospitalAdmin Indicates if the user has hospital admin privileges.
     * @param isSystemAdmin Indicates if the user has system admin privileges.
     * @returns A promise that resolves when the user data is successfully set.
     * @throws Will reject the promise if there is an error setting the user data.
     */
    async setUserByUid(
        id: string,
        firstName: string,
        lastName: string,
        email: string,
        phoneNumber: string,
        genderCode: string,
        profilePictureUri: string,
        isPatient: boolean,
        isHospitalAdmin: boolean,
        isSystemAdmin: boolean
    ): Promise<void> {
        const user: User = {
            id,
            firstName,
            lastName,
            email,
            phoneNumber,
            genderCode,
            profilePictureUri,
            isPatient,
            isHospitalAdmin,
            isSystemAdmin
        };
        const userRef = child(ref(this.db, this.USERS_ROOT), id);
        await set(userRef, user);
    }

    /**
     * Removes a user from the database by their unique identifier (UID).
     * 
     * @param uid The unique identifier of the user to remove.
     * @returns A promise that resolves when the user is successfully removed.
     * @throws Will reject the promise if there is an error removing the user.
     */
    async removeUserByUid(uid: string): Promise<void> {
        const userRef = child(ref(this.db, this.USERS_ROOT), uid);
        await remove(userRef);
    }
}
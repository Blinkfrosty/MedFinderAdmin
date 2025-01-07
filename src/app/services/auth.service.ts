import { Inject, Injectable } from '@angular/core';
import {
    Auth, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signInWithEmailAndPassword,
    UserCredential, onAuthStateChanged, User as FirebaseUser, browserLocalPersistence
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { UserDataAccessService } from './user-data-access.service';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { BehaviorSubject, Observable } from 'rxjs';
import { connectFunctionsEmulator } from 'firebase/functions';

/**
 * Service responsible for handling user authentication and authorization operations.
 * It manages user login, logout, registration, and role verification using Firebase Authentication and Cloud Functions.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
    private loadingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    /**
     * Observable that emits the current authenticated user.
     */
    public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

    /**
     * Observable that emits the current loading state.
     */
    public loading$: Observable<boolean> = this.loadingSubject.asObservable();

    constructor(
        private auth: Auth,
        private functions: Functions,
        private userDataAccessService: UserDataAccessService,
        private router: Router,
        @Inject('EMULATE_FUNCTIONS') private emulateFunctions: boolean
    ) {
        if (this.emulateFunctions) {
            connectFunctionsEmulator(this.functions, 'localhost', 5001);
        }
    }

    /**
     * Initializes the authentication state listener.
     * Sets the persistence type and listens for authentication state changes.
     * Updates the current user observable based on authentication status.
     * 
     * @returns A promise that resolves when initialization is complete.
     */
    initializeAuth(): Promise<void> {
        this.loadingSubject.next(true);
        return this.auth.setPersistence(browserLocalPersistence).then(() => {
            return new Promise((resolve) => {
                onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
                    if (firebaseUser) {
                        try {
                            const user = await this.userDataAccessService.getUserByUid(firebaseUser.uid);
                            this.currentUserSubject.next(user);
                        } catch (error) {
                            console.error('Error fetching user data', error);
                            this.currentUserSubject.next(null);
                        }
                    } else {
                        this.currentUserSubject.next(null);
                    }
                    this.loadingSubject.next(false);
                    resolve();
                });
            });
        });
    }

    /**
     * Authenticates a user with email and password.
     * 
     * @param email The user's email address.
     * @param password The user's password.
     * @returns A promise that resolves when the login process is complete.
     * @throws Will throw an error if authentication fails or the user lacks admin privileges.
     */
    async login(email: string, password: string): Promise<void> {
        this.loadingSubject.next(true);
        try {
            const userCredential: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const userId = userCredential.user.uid;
            const user: User | null = await this.userDataAccessService.getUserByUid(userId);
            this.currentUserSubject.next(user);

            if (!user) {
                throw new Error('User not found');
            }

            if (user.isSystemAdmin && !user.isHospitalAdmin && !user.isPatient) {
                this.router.navigate(['/system-admin-dashboard']);
            } else if (user.isHospitalAdmin && !user.isSystemAdmin && !user.isPatient) {
                // TODO: Implement hospital admin login 
                throw new Error('Hospital admin login not implemented');
            } else {
                throw new Error('User is not an admin');
            }
        } catch (error) {
            console.error('Login failed', error);
            this.logout();
            throw error;
        } finally {
            this.loadingSubject.next(false);
        }
    }

    /**
     * Logs out the currently authenticated user.
     * 
     * @returns A promise that resolves when the logout process is complete.
     * @throws Will throw an error if the logout process fails.
     */
    async logout(): Promise<void> {
        this.loadingSubject.next(true);
        try {
            await this.auth.signOut();
            this.currentUserSubject.next(null);
            this.router.navigate(['/login']);
        } catch (error) {
            console.error('Logout failed', error);
            throw error;
        } finally {
            this.loadingSubject.next(false);
        }
    }

    /**
     * Retrieves the currently authenticated user.
     * 
     * @returns A promise that resolves with the current user or `null` if no user is authenticated.
     */
    async getCurrentUser(): Promise<User | null> {
        return this.currentUserSubject.value;
    }

    /**
     * Checks if a user is currently authenticated.
     * 
     * @returns A promise that resolves to `true` if a user is authenticated, otherwise `false`.
     */
    async isAuthenticated(): Promise<boolean> {
        return this.currentUserSubject.value !== null;
    }

    /**
     * Checks if the authenticated user possesses a specific role.
     * 
     * @param role The role to check against the authenticated user.
     * @returns A promise that resolves to `true` if the user has the specified role, otherwise `false`.
     */
    async hasRole(role: string): Promise<boolean> {
        const user = this.currentUserSubject.value;
        if (!user) {
            return false;
        }

        switch (role) {
            case 'systemAdmin':
                return user.isSystemAdmin;
            case 'hospitalAdmin':
                return user.isHospitalAdmin;
            // Add more roles as needed
            default:
                return false;
        }
    }

    /**
     * Creates a new user with the provided details.
     * 
     * @param email The user's email address.
     * @param password The user's password.
     * @param firstName The user's first name.
     * @param lastName The user's last name.
     * @param phoneNumber The user's phone number.
     * @param genderCode The code representing the user's gender.
     * @param profilePictureUri URI to the user's profile picture.
     * @param isPatient Indicates if the user is a patient.
     * @param isHospitalAdmin Indicates if the user has hospital admin privileges.
     * @param isSystemAdmin Indicates if the user has system admin privileges.
     * @returns A promise that resolves when the user creation process is complete.
     * @throws Will throw an error if the user creation process fails.
     */
    async createUser(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        genderCode: string,
        profilePictureUri: string,
        isPatient: boolean,
        isHospitalAdmin: boolean,
        isSystemAdmin: boolean
    ): Promise<void> {
        try {
            await this.verifyAdminPermissions();

            // Create user via Firebase Cloud Function
            const createUserCallable = httpsCallable<any, { uid: string }>(this.functions, 'createUser');
            const result = await createUserCallable({ email, password });
            const id = result.data.uid;

            // Save user data to the database
            await this.userDataAccessService.setUserByUid(
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
            );
        } catch (error) {
            console.error('Error creating user', error);
            throw error;
        }
    }

    /**
     * Updates an existing user's details.
     * 
     * @param id The unique identifier of the user to update.
     * @param email The user's new email address.
     * @param password The user's new password (optional).
     * @param firstName The user's new first name.
     * @param lastName The user's new last name.
     * @param phoneNumber The user's new phone number.
     * @param genderCode The new gender code for the user.
     * @param profilePictureUri The new URI to the user's profile picture.
     * @param isPatient Indicates if the user is a patient.
     * @param isHospitalAdmin Indicates if the user has hospital admin privileges.
     * @param isSystemAdmin Indicates if the user has system admin privileges.
     * @param currentPassword The user's current password (required for email and password changes).
     * @returns A promise that resolves when the user update process is complete.
     * @throws Will throw an error if the user update process fails or the user is not found.
     */
    async updateUser(
        id: string,
        email: string,
        newPassword: string,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        genderCode: string,
        profilePictureUri: string,
        isPatient: boolean,
        isHospitalAdmin: boolean,
        isSystemAdmin: boolean,
        currentPassword?: string
    ): Promise<void> {
        try {
            await this.verifyAdminPermissions();
            let isUpdatingCurrentUser = this.currentUserSubject.value?.id === id;
    
            // Fetch target user data
            const targetUser = await this.userDataAccessService.getUserByUid(id);
            if (!targetUser) {
                throw new Error('User not found');
            }
    
            // Prepare update payload
            const updatePayload: { uid: string; email?: string; newPassword?: string;
                currentPassword?: string } = { uid: id };
            let shouldUpdateAuth = false;
    
            // Check if email has changed
            if (email !== targetUser.email) {
                updatePayload.email = email;
                shouldUpdateAuth = true;
            }
    
            // Check if password is provided
            if (newPassword && newPassword.trim() !== '') {
                updatePayload.newPassword = newPassword;
                shouldUpdateAuth = true;
            }

            // Check if current password is provided
            if (currentPassword && currentPassword.trim() !== '') {
                updatePayload.currentPassword = currentPassword;
            }
    
            if (shouldUpdateAuth) {
                if (isUpdatingCurrentUser) {
                    // Re-authenticate current user
                    if (this.auth.currentUser && updatePayload.currentPassword) {
                        const credential = EmailAuthProvider.credential(this.auth.currentUser.email!, updatePayload.currentPassword);
                        await reauthenticateWithCredential(this.auth.currentUser, credential);
                    } else {
                        throw new Error('Re-authentication required');
                    }
    
                    // Update current user via Firebase Auth
                    if (this.auth.currentUser) {
                        if (updatePayload.email) {
                            await updateEmail(this.auth.currentUser, updatePayload.email);
                        }
                        if (updatePayload.newPassword) {
                            await updatePassword(this.auth.currentUser, updatePayload.newPassword);
                        }
                    } else {
                        throw new Error('No authenticated user found');
                    }
                }
                else {
                    // Update user via Firebase Cloud Function
                    const updateUserCallable = httpsCallable(this.functions, 'updateUser');
                    await updateUserCallable(updatePayload);
                }
            }
    
            // Update user data in the database
            await this.userDataAccessService.setUserByUid(
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
            );
    
            if (isUpdatingCurrentUser) {
                if (shouldUpdateAuth) {
                    // Logout if email or password changed
                    await this.logout();
                }
                else {
                    // Update current user observable
                    const updatedUser = await this.userDataAccessService.getUserByUid(id);
                    this.currentUserSubject.next(updatedUser);
                }
            }
        } catch (error) {
            if ((error as any).code === 'auth/requires-recent-login') {
                throw new Error('Please re-authenticate to update your credentials.');
            } else if ((error as any).code === 'auth/wrong-password') {
                throw new Error('Incorrect password. Please check your credentials.')
            }
            console.error('Error updating user', error);
            throw error;
        }
    }

    /**
     * Deletes a user with the specified ID.
     * 
     * @param id The unique identifier of the user to delete.
     * @returns A promise that resolves when the user deletion process is complete.
     * @throws Will throw an error if the user deletion process fails.
     */
    async deleteUser(id: string): Promise<void> {
        try {
            await this.verifyAdminPermissions();

            // Delete user via Firebase Cloud Function
            const deleteUserCallable = httpsCallable(this.functions, 'deleteUser');
            await deleteUserCallable({ uid: id });

            // Remove user data from the database
            await this.userDataAccessService.removeUserByUid(id);
        } catch (error) {
            console.error('Error deleting user', error);
            throw error;
        }
    }

    /**
     * Verifies that the current user has administrative permissions.
     * 
     * @returns A promise that resolves when the permission check is complete.
     * @throws Will throw an error if the user is not authenticated or lacks system admin privileges.
     */
    async verifyAdminPermissions(): Promise<void> {
        const user = this.currentUserSubject.value;

        if (!user) {
            throw new Error('Unauthorized access');
        }

        if (!user.isSystemAdmin) {
            throw new Error('Insufficient permissions');
        }
    }
}
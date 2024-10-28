import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    updateEmail, updatePassword, UserCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { UserDataAccessService } from './user-data-access.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(
        private auth: Auth,
        private userDataAccessService: UserDataAccessService,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    async login(email: string, password: string): Promise<void> {
        try {
            const userCredential: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const userId = userCredential.user.uid;
            const user: User = await this.userDataAccessService.getUserByUid(userId);

            if (user.isSystemAdmin && !user.isHospitalAdmin && !user.isPatient) {
                // Store user data in local storage or a service
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('user', JSON.stringify(user));
                }
                this.router.navigate(['/system-admin-dashboard']);
            } else if (user.isHospitalAdmin && !user.isSystemAdmin && !user.isPatient) {
                // TODO: Implement hospital admin login 
                throw new Error('Hospital admin login not implemented');
            } else {
                throw new Error('User is not an admin');
            }
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.auth.signOut();
            localStorage.removeItem('user');
        }
        this.router.navigate(['/login']);
    }

    getUser(): User | null {
        if (isPlatformBrowser(this.platformId)) {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    }

    isAuthenticated(): boolean {
        return !!this.getUser();
    }

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
            const userCredential: UserCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const uid = userCredential.user.uid;
            await this.userDataAccessService.setUserByUid(
                uid,
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

    async updateUser(
        uid: string,
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
            const user = this.auth.currentUser;
            if (user) {
                if (user.email !== email) {
                    await updateEmail(user, email);
                }
                if (password) {
                    await updatePassword(user, password);
                }
                await this.userDataAccessService.setUserByUid(
                    uid,
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
            } else {
                throw new Error('No authenticated user found');
            }
        } catch (error) {
            console.error('Error updating user', error);
            throw error;
        }
    }
}
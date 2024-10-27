import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, signInWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { Database, ref, get } from '@angular/fire/database';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(
        private auth: Auth,
        private db: Database,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    async login(email: string, password: string): Promise<void> {
        try {
            const userCredential: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const userId = userCredential.user.uid;
            const userRef = ref(this.db, `users/${userId}`);
            const userSnapshot = await get(userRef);
            const user: User = userSnapshot.val();

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
}
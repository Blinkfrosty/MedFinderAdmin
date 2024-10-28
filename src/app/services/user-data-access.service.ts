import { Injectable } from '@angular/core';
import { Database, ref, get, set, remove, child, DatabaseReference } from '@angular/fire/database';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserDataAccessService {
    private readonly USERS_ROOT = 'users';
    private userRef: DatabaseReference;

    constructor(private db: Database) {
        this.userRef = ref(this.db, this.USERS_ROOT);
    }

    async getUserByUid(uid: string): Promise<User> {
        const userSnapshot = await get(child(this.userRef, uid));
        return userSnapshot.val();
    }

    async getAllUsers(excludeUid?: string): Promise<User[]> {
        const usersSnapshot = await get(this.userRef);
        const users: { [key: string]: User } = usersSnapshot.val();
        return Object.keys(users)
            .filter(uid => uid !== excludeUid)
            .map(uid => users[uid]);
    }

    async setUserByUid(
        uid: string,
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
        const userRef = child(this.userRef, uid);
        await set(userRef, user);
    }

    async removeUserByUid(uid: string): Promise<void> {
        const userRef = child(this.userRef, uid);
        await remove(userRef);
    }
}
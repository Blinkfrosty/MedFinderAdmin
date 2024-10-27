import { Injectable } from '@angular/core';
import { Database, ref, get, child, DatabaseReference } from '@angular/fire/database';
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
}
import { Injectable } from '@angular/core';
import { Database, ref, get, set, child, remove, DatabaseReference } from '@angular/fire/database';
import { Doctor } from '../models/doctor.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class DoctorDataAccessService {
    private readonly DOCTORS_ROOT = 'doctors';
    private doctorRef: DatabaseReference;

    constructor(private db: Database) {
        this.doctorRef = ref(this.db, this.DOCTORS_ROOT);
    }

    async getAllDoctors(excludeId?: string): Promise<Doctor[]> {
        const doctorsSnapshot = await get(this.doctorRef);
        const doctors: { [key: string]: Doctor } = doctorsSnapshot.val();
        return Object.keys(doctors)
            .filter(id => id !== excludeId)
            .map(id => doctors[id]);
    }

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
        const doctorRef = child(this.doctorRef, id);
        await set(doctorRef, doctor);
    }

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
        const doctorRef = child(this.doctorRef, id);
        await set(doctorRef, doctor);
    }

    async removeDoctorById(id: string): Promise<void> {
        const doctorRef = child(this.doctorRef, id);
        await remove(doctorRef);
    }
}
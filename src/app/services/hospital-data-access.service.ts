import { Injectable } from '@angular/core';
import { Database, ref, get, set, child, remove, DatabaseReference } from '@angular/fire/database';
import { Hospital } from '../models/hospital.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class HospitalDataAccessService {
    private readonly HOSPITALS_ROOT = 'hospitals';
    private hospitalRef: DatabaseReference;

    constructor(private db: Database) {
        this.hospitalRef = ref(this.db, this.HOSPITALS_ROOT);
    }

    async getAllHospitals(excludeId?: string): Promise<Hospital[]> {
        const hospitalsSnapshot = await get(this.hospitalRef);
        const hospitals: { [key: string]: Hospital } = hospitalsSnapshot.val();
        return Object.keys(hospitals)
            .filter(id => id !== excludeId)
            .map(id => hospitals[id]);
    }

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
        const hospitalRef = child(this.hospitalRef, id);
        await set(hospitalRef, hospital);
    }

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
        const hospitalRef = child(this.hospitalRef, id);
        await set(hospitalRef, hospital);
    }

    async removeHospitalById(id: string): Promise<void> {
        const hospitalRef = child(this.hospitalRef, id);
        await remove(hospitalRef);
    }
}
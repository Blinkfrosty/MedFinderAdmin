import { Injectable } from '@angular/core';
import { Database, ref, get, set, remove, onValue, off } from '@angular/fire/database';
import { HospitalAdminAssignment } from '../models/hospital-admin-assignment.model';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HospitalAdminAssignmentDataAccessService {
    private readonly HOSPITAL_ADMIN_ASSIGNMENTS_ROOT = 'hospitalAdminAssignments';
    private readonly RECORD_PREFIX = 'hospital_admin_' 

    constructor(private db: Database) { }

    /**
     * Retrieves all hospital-admin assignments in real-time.
     * 
     * @returns Observable emitting arrays of HospitalAdminAssignment objects.
     */
    getAllAssignments(): Observable<HospitalAdminAssignment[]> {
        return new Observable<HospitalAdminAssignment[]>(observer => {
            const assignmentsRef = ref(this.db, this.HOSPITAL_ADMIN_ASSIGNMENTS_ROOT);

            const onValueCallback = (snapshot: any) => {
                const data = snapshot.val();
                if (data) {
                    const assignments: HospitalAdminAssignment[] = Object.values(data) as HospitalAdminAssignment[];
                    observer.next(assignments);
                } else {
                    observer.next([]);
                }
            };

            onValue(assignmentsRef, onValueCallback, (error) => {
                observer.error(error);
            });

            return () => {
                off(assignmentsRef, 'value', onValueCallback);
            };
        });
    }

    /**
     * Sets a hospital-admin assignment.
     * 
     * @param userId The unique identifier of the user.
     * @param hospitalId The unique identifier of the hospital.
     * @returns A promise that resolves when the assignment is set.
     */
    async setAssignment(userId: string, hospitalId: string): Promise<void> {
        const assignmentRef = 
            ref(this.db, `${this.HOSPITAL_ADMIN_ASSIGNMENTS_ROOT}/${this.RECORD_PREFIX}${userId}`);
        const assignment: HospitalAdminAssignment = { userId, hospitalId };
        await set(assignmentRef, assignment);
    }

    /**
     * Deletes a hospital-admin assignment.
     * 
     * @param userId The unique identifier of the user.
     * @returns A promise that resolves when the assignment is deleted.
     */
    async deleteAssignment(userId: string): Promise<void> {
        const assignmentRef = 
            ref(this.db, `${this.HOSPITAL_ADMIN_ASSIGNMENTS_ROOT}/${this.RECORD_PREFIX}${userId}`);
        await remove(assignmentRef);
    }

    /**
     * Retrieves the assigned hospital ID for a given user ID.
     * 
     * @param userId The unique identifier of the user.
     * @returns A promise that resolves to the hospital ID or null if not assigned.
     */
    async getAssignedHospitalId(userId: string): Promise<string | null> {
        const assignmentRef = ref(this.db, `${this.HOSPITAL_ADMIN_ASSIGNMENTS_ROOT}/${this.RECORD_PREFIX}${userId}`);
        try {
            const snapshot = await get(assignmentRef);
            if (snapshot.exists()) {
                const data = snapshot.val() as HospitalAdminAssignment;
                return data.hospitalId;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching assignment for userId ${userId}:`, error);
            return null;
        }
    }
}
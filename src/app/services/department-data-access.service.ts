import { Injectable } from '@angular/core';
import { Database, ref, onValue, off, set, remove, child } from '@angular/fire/database';
import { Department } from '../models/department.model';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

/**
 * Service for accessing and managing department data in the Firebase Realtime Database.
 * Provides methods to retrieve, create, update, and delete department records.
 */
@Injectable({
    providedIn: 'root'
})
export class DepartmentDataAccessService {
    private readonly DEPARTMENTS_ROOT = 'departments';

    constructor(private db: Database) { }

    /**
     * Retrieves all departments in real-time.
     * 
     * @returns Observable emitting arrays of Department objects.
     * @throws Will emit an error if there is an issue accessing the database.
     */
    getAllDepartments(): Observable<Department[]> {
        return new Observable<Department[]>(observer => {
            const departmentsRef = ref(this.db, this.DEPARTMENTS_ROOT);

            const onValueCallback = (snapshot: any) => {
                const departmentsData = snapshot.val();
                if (departmentsData) {
                    const departments: Department[] = Object.values(departmentsData) as Department[];
                    observer.next(departments);
                } else {
                    observer.next([]);
                }
            };

            // Subscribe to changes in the departments data
            onValue(departmentsRef, onValueCallback, (error) => {
                observer.error(error);
            });

            // Teardown logic to unsubscribe from the listener when the Observable is unsubscribed
            return () => {
                off(departmentsRef, 'value', onValueCallback);
            };
        });
    }

    /**
     * Retrieves a department by its unique identifier (ID).
     * 
     * @param id The unique identifier of the department to retrieve.
     * @returns A promise that resolves to the Department object if found, otherwise `null`.
     * @throws Will reject the promise if there is an error accessing the database.
     */
    async getDepartmentById(id: string): Promise<Department | null> {
        const departmentRef = ref(this.db, `${this.DEPARTMENTS_ROOT}/${id}`);
        return new Promise((resolve, reject) => {
            onValue(departmentRef, snapshot => {
                resolve(snapshot.val() || null);
            }, error => {
                reject(error);
            });
        });
    }

    /**
     * Sets or updates a department's data by its unique identifier (ID).
     * 
     * @param id The unique identifier of the department.
     * @param name The name of the department.
     * @param description The description of the department's functions and responsibilities.
     * @returns A promise that resolves when the department data is successfully set.
     * @throws Will reject the promise if there is an error setting the department data.
     */
    async setDepartmentById(
        id: string,
        name: string,
        description: string
    ): Promise<void> {
        const department: Department = { id, name, description };
        const departmentRef = child(ref(this.db, this.DEPARTMENTS_ROOT), id);
        await set(departmentRef, department);
    }

    /**
     * Adds a new department with the provided details.
     * Generates a unique identifier for the department.
     * 
     * @param name The name of the department.
     * @param description The description of the department's functions and responsibilities.
     * @returns A promise that resolves when the department is successfully added.
     * @throws Will reject the promise if there is an error adding the department.
     */
    async addDepartment(name: string, description: string): Promise<void> {
        const id = uuidv4().replace(/-/g, '');
        const department: Department = { id, name, description };
        const departmentRef = child(ref(this.db, this.DEPARTMENTS_ROOT), id);
        await set(departmentRef, department);
    }

    /**
     * Removes a department from the database by its unique identifier (ID).
     * 
     * @param id The unique identifier of the department to remove.
     * @returns A promise that resolves when the department is successfully removed.
     * @throws Will reject the promise if there is an error removing the department.
     */
    async removeDepartmentById(id: string): Promise<void> {
        const departmentRef = child(ref(this.db, this.DEPARTMENTS_ROOT), id);
        await remove(departmentRef);
    }
}
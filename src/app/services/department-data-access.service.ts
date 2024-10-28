import { Injectable } from '@angular/core';
import { Database, ref, get, set, child, remove, DatabaseReference } from '@angular/fire/database';
import { Department } from '../models/department.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class DepartmentDataAccessService {
    private readonly DEPARTMENTS_ROOT = 'departments';
    private departmentRef: DatabaseReference;

    constructor(private db: Database) {
        this.departmentRef = ref(this.db, this.DEPARTMENTS_ROOT);
    }

    async getAllDepartments(excludeId?: string): Promise<Department[]> {
        const departmentsSnapshot = await get(this.departmentRef);
        const departments: { [key: string]: Department } = departmentsSnapshot.val();
        return Object.keys(departments)
            .filter(id => id !== excludeId)
            .map(id => departments[id]);
    }

    async setDepartmentById(
        id: string,
        name: string,
        description: string
    ): Promise<void> {
        const department: Department = { id, name, description };
        const departmentRef = child(this.departmentRef, id);
        await set(departmentRef, department);
    }

    async addDepartment(name: string, description: string): Promise<void> {
        const id = uuidv4().replace(/-/g, '');
        const department: Department = { id, name, description };
        const departmentRef = child(this.departmentRef, id);
        await set(departmentRef, department);
    }

    async removeDepartmentById(id: string): Promise<void> {
        const departmentRef = child(this.departmentRef, id);
        await remove(departmentRef);
    }
}
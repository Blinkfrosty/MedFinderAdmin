import { OfficeHours } from './office-hours.model';

/**
 * Doctor data model
 */
export interface Doctor {
    id: string;
    name: string;
    degrees: string;
    phoneNumber: string;
    profilePictureUri: string;
    departmentId: string;
    hospitalId: string;
    officeHours: OfficeHours;
}
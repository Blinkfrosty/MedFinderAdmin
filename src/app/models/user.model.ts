/**
 * User data model
 */
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    genderCode: string;
    profilePictureUri: string;
    isPatient: boolean;
    isHospitalAdmin: boolean;
    isSystemAdmin: boolean;
}
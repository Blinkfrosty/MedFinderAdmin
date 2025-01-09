/**
 * Appointment model
 */
export interface Appointment {
    id: string;
    userId: string;
    appointmentStartTime: string;
    date: string;
    reasonForVisit: string;
    doctorId: string;
    departmentId: string;
    hospitalId: string;
    appointmentNotes: string;
}
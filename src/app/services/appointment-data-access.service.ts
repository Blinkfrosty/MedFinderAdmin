import { Injectable } from '@angular/core';
import { Database, ref, onValue, off, set, remove, child, 
    query, orderByChild, equalTo } from '@angular/fire/database';
import { Appointment } from '../models/appointment.model';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

/**
 * Service for accessing and managing appointment data in the Firebase Realtime Database.
 * Provides methods to retrieve, create, update, and delete appointment records.
 */
@Injectable({
    providedIn: 'root'
})
export class AppointmentDataAccessService {
    private readonly APPOINTMENTS_ROOT = 'appointments';

    constructor(private db: Database) { }

    /**
     * Retrieves all appointments in real-time.
     * 
     * @returns Observable emitting arrays of Appointment objects.
     * @throws Will emit an error if there is an issue accessing the database.
     */
    getAllAppointments(): Observable<Appointment[]> {
        return new Observable<Appointment[]>(observer => {
            const appointmentsRef = ref(this.db, this.APPOINTMENTS_ROOT);

            const onValueCallback = (snapshot: any) => {
                const appointmentsData = snapshot.val();
                if (appointmentsData) {
                    const appointments: Appointment[] = Object.values(appointmentsData) as Appointment[];
                    observer.next(appointments);
                } else {
                    observer.next([]);
                }
            };

            // Subscribe to changes in the appointments data
            onValue(appointmentsRef, onValueCallback, (error) => {
                observer.error(error);
            });

            // Teardown logic to unsubscribe from the listener when the Observable is unsubscribed
            return () => {
                off(appointmentsRef, 'value', onValueCallback);
            };
        });
    }

    /**
     * Retrieves an appointment by its unique identifier (ID).
     * 
     * @param id The unique identifier of the appointment to retrieve.
     * @returns A promise that resolves to the Appointment object if found, otherwise `null`.
     * @throws Will reject the promise if there is an error accessing the database.
     */
    async getAppointmentById(id: string): Promise<Appointment | null> {
        const appointmentRef = ref(this.db, `${this.APPOINTMENTS_ROOT}/${id}`);
        return new Promise((resolve, reject) => {
            onValue(appointmentRef, snapshot => {
                resolve(snapshot.val() || null);
            }, error => {
                reject(error);
            });
        });
    }

    /**
     * Retrieves all appointments for a specific doctor for a specific date.
     * 
     * @param doctorId The unique identifier of the doctor.
     * @param date The date to filter the appointments by.
     * @returns Observable emitting arrays of Appointment objects.
     * @throws Will emit an error if there is an issue accessing the database.
     */
    getAppointmentsByDoctorForDate(doctorId: string, date: string): Observable<Appointment[]> {
        return new Observable<Appointment[]>(observer => {
            const appointmentsRef = ref(this.db, this.APPOINTMENTS_ROOT);
            const appointmentsQuery = query(
                appointmentsRef,
                orderByChild('doctorId'),
                equalTo(doctorId)
            );
    
            const onValueCallback = (snapshot: any) => {
                const appointmentsData = snapshot.val();
                if (appointmentsData) {
                    const appointments: Appointment[] = Object.values(appointmentsData) as Appointment[];
                    const filteredAppointments = appointments.filter(appointment => appointment.date === date);
                    observer.next(filteredAppointments);
                } else {
                    observer.next([]);
                }
            };
    
            onValue(appointmentsQuery, onValueCallback, (error) => {
                observer.error(error);
            });
    
            return () => {
                off(appointmentsQuery, 'value', onValueCallback);
            };
        });
    }

    /**
     * Sets or updates an appointment's data by its unique identifier (ID).
     * 
     * @param id The unique identifier of the appointment.
     * @param userId The unique identifier of the user.
     * @param appointmentStartTime The start time of the appointment.
     * @param date The date of the appointment.
     * @param reasonForVisit The reason for the visit.
     * @param doctorId The unique identifier of the doctor.
     * @param departmentId The unique identifier of the department.
     * @param hospitalId The unique identifier of the hospital.
     * @param appointmentNotes Any additional notes for the appointment.
     * @returns A promise that resolves when the appointment data is successfully set.
     * @throws Will reject the promise if there is an error setting the appointment data.
     */
    async setAppointment(
        id: string,
        userId: string,
        appointmentStartTime: string,
        date: string,
        reasonForVisit: string,
        doctorId: string,
        departmentId: string,
        hospitalId: string,
        appointmentNotes: string
    ): Promise<void> {
        const appointment: Appointment = {
            id,
            userId,
            appointmentStartTime,
            date,
            reasonForVisit,
            doctorId,
            departmentId,
            hospitalId,
            appointmentNotes
        };
        const appointmentRef = child(ref(this.db, this.APPOINTMENTS_ROOT), id);
        await set(appointmentRef, appointment);
    }

    /**
     * Creates a new appointment with the provided details.
     * Generates a unique identifier for the appointment.
     * 
     * @param userId The unique identifier of the user.
     * @param appointmentStartTime The start time of the appointment.
     * @param date The date of the appointment.
     * @param reasonForVisit The reason for the visit.
     * @param doctorId The unique identifier of the doctor.
     * @param departmentId The unique identifier of the department.
     * @param hospitalId The unique identifier of the hospital.
     * @param appointmentNotes Any additional notes for the appointment.
     * @returns A promise that resolves when the appointment is successfully created.
     * @throws Will reject the promise if there is an error creating the appointment.
     */
    async createAppointment(
        userId: string,
        appointmentStartTime: string,
        date: string,
        reasonForVisit: string,
        doctorId: string,
        departmentId: string,
        hospitalId: string,
        appointmentNotes: string
    ): Promise<void> {
        const id = uuidv4().replace(/-/g, '');
        const appointment: Appointment = {
            id,
            userId,
            appointmentStartTime,
            date,
            reasonForVisit,
            doctorId,
            departmentId,
            hospitalId,
            appointmentNotes
        };
        const appointmentRef = child(ref(this.db, this.APPOINTMENTS_ROOT), id);
        await set(appointmentRef, appointment);
    }

    /**
     * Removes an appointment from the database by its unique identifier (ID).
     * 
     * @param id The unique identifier of the appointment to remove.
     * @returns A promise that resolves when the appointment is successfully removed.
     * @throws Will reject the promise if there is an error removing the appointment.
     */
    async removeAppointment(id: string): Promise<void> {
        const appointmentRef = child(ref(this.db, this.APPOINTMENTS_ROOT), id);
        await remove(appointmentRef);
    }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppointmentDataAccessService } from '../../services/appointment-data-access.service';
import { DoctorDataAccessService } from '../../services/doctor-data-access.service';
import { UserDataAccessService } from '../../services/user-data-access.service';
import { Appointment } from '../../models/appointment.model';
import { Doctor } from '../../models/doctor.model';
import { User } from '../../models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeleteConfirmationDialogComponent, DeleteDialogData } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { TimeMapping } from '../../helpers/time-mapping.helper';
import { LoadingService } from '../../services/loading.service';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { EditAppointmentDialogComponent } from '../edit-appointment-dialog/edit-appointment-dialog.component';

@Component({
  selector: 'app-manage-upcoming-appointments',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './manage-upcoming-appointments.component.html',
  styleUrls: ['./manage-upcoming-appointments.component.css']
})
export class ManageUpcomingAppointmentsComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  filteredAppointments: Array<{
    appointment: Appointment;
    doctor: Doctor;
    user: User;
    formattedTime: string;
  }> = [];
  private appointmentsSubscription?: Subscription;

  constructor(
    private appointmentService: AppointmentDataAccessService,
    private doctorService: DoctorDataAccessService,
    private userService: UserDataAccessService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.appointmentsSubscription?.unsubscribe();
  }

  private async loadAppointments(): Promise<void> {
    this.loadingService.show();
    this.appointmentsSubscription = this.appointmentService.getAllAppointments().subscribe({
      next: async (appointments: Appointment[]) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const currentTime24h = TimeMapping.get24HourTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) || '00:00';
        const currentDate = now.toISOString().split('T')[0];

        this.filteredAppointments = [];
        for (const appointment of appointments) {
          if (
            appointment.date > currentDate ||
            (appointment.date === currentDate && appointment.appointmentStartTime >= currentTime24h)
          ) {
            const doctor = await this.doctorService.getDoctorById(appointment.doctorId);
            const user = await this.userService.getUserByUid(appointment.userId);
            if (doctor && user) {
              const formattedTime = TimeMapping.get12HourTime(appointment.appointmentStartTime) || appointment.appointmentStartTime;
              this.filteredAppointments.push({ appointment, doctor, user, formattedTime });
            }
          }
        }

  // Sorting the filteredAppointments
  this.filteredAppointments.sort((a, b) => {
    // Compare Doctor's Name
    const doctorNameA = a.doctor.name.toLowerCase();
    const doctorNameB = b.doctor.name.toLowerCase();
    if (doctorNameA < doctorNameB) return -1;
    if (doctorNameA > doctorNameB) return 1;

    // Compare Appointment Date
    if (a.appointment.date < b.appointment.date) return -1;
    if (a.appointment.date > b.appointment.date) return 1;

    // Compare Formatted Time
    const timeA = a.appointment.appointmentStartTime;
    const timeB = b.appointment.appointmentStartTime;
    if (timeA < timeB) return -1;
    if (timeA > timeB) return 1;

    return 0;
  });

        this.loadingService.hide();
      },
      error: (error: any) => {
        console.error('Error fetching appointments', error);
        this.snackBar.open('Failed to load appointments', 'Dismiss', { duration: 5000 });
        this.loadingService.hide();
      }
    });
  }

  addAppointment(): void {
    const dialogRef = this.dialog.open(EditAppointmentDialogComponent, { data: { appointment: null } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Appointment added successfully', 'Dismiss', { duration: 3000 });
        // Optionally refresh the appointments list
        this.loadingService.show();
        this.loadAppointments();
        this.loadingService.hide();
      }
    });
  }

  editAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(EditAppointmentDialogComponent, { data: { appointment } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Appointment updated successfully', 'Dismiss', { duration: 3000 });
        // Refresh the appointments list
        this.loadingService.show();
        this.loadAppointments();
        this.loadingService.hide();
      }
    });
  }

  deleteAppointment(appointment: Appointment): void {
    const dialogData: DeleteDialogData = {
      title: 'Delete Appointment',
      message: `Are you sure you want to delete this appointment?`,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    };

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        try {
          await this.appointmentService.removeAppointment(appointment.id);
          this.snackBar.open('Appointment deleted successfully', 'Dismiss', { duration: 3000 });
        } catch (error) {
          console.error('Error deleting appointment', error);
          this.snackBar.open('Failed to delete appointment', 'Dismiss', { duration: 5000 });
        } finally {
          // Refresh the appointments list
          this.loadingService.show();
          this.loadAppointments();
          this.loadingService.hide();
        }
      }
    });
  }
}
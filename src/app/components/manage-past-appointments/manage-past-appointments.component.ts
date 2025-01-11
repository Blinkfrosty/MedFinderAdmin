import { Component, OnInit, OnDestroy } from '@angular/core';
import { ManageUpcomingAppointmentsComponent } from '../manage-upcoming-appointments/manage-upcoming-appointments.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { AppointmentDataAccessService } from '../../services/appointment-data-access.service';
import { DoctorDataAccessService } from '../../services/doctor-data-access.service';
import { UserDataAccessService } from '../../services/user-data-access.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoadingService } from '../../services/loading.service';
import { Appointment } from '../../models/appointment.model';
import { EditPastAppointmentDialogComponent } from '../edit-past-appointment-dialog/edit-past-appointment-dialog.component';
import { DeleteConfirmationDialogComponent, DeleteDialogData } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { TimeMapping } from '../../helpers/time-mapping.helper';
import { NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'dd/MM/yyyy',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-manage-past-appointments',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }
  ],
  templateUrl: './manage-past-appointments.component.html',
  styleUrls: ['./manage-past-appointments.component.css']
})
export class ManagePastAppointmentsComponent extends ManageUpcomingAppointmentsComponent implements OnInit, OnDestroy {
  constructor(
    appointmentService: AppointmentDataAccessService,
    doctorService: DoctorDataAccessService,
    userService: UserDataAccessService,
    dialog: MatDialog,
    snackBar: MatSnackBar,
    loadingService: LoadingService,
    fb: FormBuilder
  ) {
    super(appointmentService, doctorService, userService, dialog, snackBar, loadingService, fb);
  }

  override async loadAppointments(): Promise<void> {
    this.loadingService.show();
    this.filterForm.reset();

    this.appointmentsSubscription = this.appointmentService.getAllAppointments().subscribe({
      next: async (appointments: Appointment[]) => {
        try {
          const now = new Date();
          const currentTime24h = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const currentDate = now.toISOString().split('T')[0];

          this.appointmentsList = [];
          for (const appointment of appointments) {
            if (appointment.date < currentDate ||
              (appointment.date === currentDate && appointment.appointmentStartTime < currentTime24h)) {
              const doctor = await this.doctorService.getDoctorById(appointment.doctorId);
              const user = await this.userService.getUserByUid(appointment.userId);
              if (doctor && user) {
                const formattedTime = TimeMapping.get12HourTime(appointment.appointmentStartTime) || appointment.appointmentStartTime;
                this.appointmentsList.push({ appointment, doctor, user, formattedTime });
              }
            }
          }

          // Sorting the appointments
          this.appointmentsList.sort((a, b) => {
            // Compare Doctor's Name
            const doctorNameA = a.doctor.name.toLowerCase();
            const doctorNameB = b.doctor.name.toLowerCase();
            if (doctorNameA < doctorNameB) return -1;
            if (doctorNameA > doctorNameB) return 1;

            // Compare Appointment Date
            if (a.appointment.date < b.appointment.date) return -1;
            if (a.appointment.date > b.appointment.date) return 1;

            // Compare Formatted Time
            if (a.appointment.appointmentStartTime < b.appointment.appointmentStartTime) return -1;
            if (a.appointment.appointmentStartTime > b.appointment.appointmentStartTime) return 1;

            return 0;
          });

          // Initial filter application
          this.applyFilters();
        } catch (error) {
          console.error('Error fetching appointments', error);
          this.snackBar.open('Failed to load appointments', 'Dismiss', { duration: 5000 });
        } finally {
          this.loadingService.hide();
        }
      },
      error: (error: any) => {
        console.error('Error fetching appointments', error);
        this.snackBar.open('Failed to load appointments', 'Dismiss', { duration: 5000 });
        this.loadingService.hide();
      }
    });
  }

  override addAppointment(): void {
    // Remove Add Appointment functionality by not implementing it
  }

  override editAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(EditPastAppointmentDialogComponent, { data: { appointment } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Appointment updated successfully', 'Dismiss', { duration: 5000 });
        this.loadAppointments();
      }
    });
  }

  override deleteAppointment(appointment: Appointment): void {
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
          this.snackBar.open('Appointment deleted successfully', 'Dismiss', { duration: 5000 });
        } catch (error) {
          console.error('Error deleting appointment', error);
          this.snackBar.open('Failed to delete appointment', 'Dismiss', { duration: 5000 });
        } finally {
          this.loadAppointments();
        }
      }
    });
  }
}
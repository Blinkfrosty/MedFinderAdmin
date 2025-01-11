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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MatNativeDateModule } from '@angular/material/core';
import { NativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';

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
  selector: 'app-manage-upcoming-appointments',
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
  templateUrl: './manage-upcoming-appointments.component.html',
  styleUrls: ['./manage-upcoming-appointments.component.css']
})
export class ManageUpcomingAppointmentsComponent implements OnInit, OnDestroy {
  appointmentsList: Array<{
    appointment: Appointment;
    doctor: Doctor;
    user: User;
    formattedTime: string;
  }> = [];
  filteredAppointments: Array<{
    appointment: Appointment;
    doctor: Doctor;
    user: User;
    formattedTime: string;
  }> = [];
  filterForm: FormGroup;
  protected appointmentsSubscription?: Subscription;

  constructor(
    protected appointmentService: AppointmentDataAccessService,
    protected doctorService: DoctorDataAccessService,
    protected userService: UserDataAccessService,
    protected dialog: MatDialog,
    protected snackBar: MatSnackBar,
    protected loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      doctorName: [''],
      patientSearch: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadAppointments();

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.appointmentsSubscription?.unsubscribe();
  }

  protected async loadAppointments(): Promise<void> {
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
            if (appointment.date > currentDate ||
              (appointment.date === currentDate && appointment.appointmentStartTime >= currentTime24h)) {
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

  protected applyFilters(): void {
    const { doctorName, patientSearch, startDate, endDate } = this.filterForm.value;

    this.filteredAppointments = this.appointmentsList;

    this.filteredAppointments = this.filteredAppointments.filter(item => {
      const matchesDoctor = doctorName ? item.doctor.name.toLowerCase().includes(doctorName.toLowerCase()) : true;

      const matchesPatient = patientSearch ?
        (item.user.firstName.toLowerCase().includes(patientSearch.toLowerCase()) ||
          item.user.lastName.toLowerCase().includes(patientSearch.toLowerCase()) ||
          item.user.email.toLowerCase().includes(patientSearch.toLowerCase()))
        : true;

      let matchesStartDate = true;
      let matchesEndDate = true;

      if (startDate) {
        const appointmentDate = this.normalizeDate(new Date(item.appointment.date));
        const filterStartDate = this.normalizeDate(new Date(startDate));
        matchesStartDate = appointmentDate >= filterStartDate;
      }

      if (endDate) {
        const appointmentDate = this.normalizeDate(new Date(item.appointment.date));
        const filterEndDate = this.normalizeDate(new Date(endDate));
        matchesEndDate = appointmentDate <= filterEndDate;
      }

      return matchesDoctor && matchesPatient && matchesStartDate && matchesEndDate;
    });
  }

  addAppointment(): void {
    const dialogRef = this.dialog.open(EditAppointmentDialogComponent, { data: { appointment: null } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Appointment added successfully', 'Dismiss', { duration: 5000 });
        // Optionally refresh the appointments list
        this.loadAppointments();
      }
    });
  }

  editAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(EditAppointmentDialogComponent, { data: { appointment } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Appointment updated successfully', 'Dismiss', { duration: 5000 });
        // Refresh the appointments list
        this.loadAppointments();
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
          this.snackBar.open('Appointment deleted successfully', 'Dismiss', { duration: 5000 });
        } catch (error) {
          console.error('Error deleting appointment', error);
          this.snackBar.open('Failed to delete appointment', 'Dismiss', { duration: 5000 });
        } finally {
          // Refresh the appointments list
          this.loadAppointments();
        }
      }
    });
  }

  /**
   * Resets the time of a Date object to midnight.
   * @param date The Date object to normalize.
   * @returns A new Date object set to midnight.
   */
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
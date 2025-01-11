import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditAppointmentDialogComponent, CUSTOM_DATE_FORMATS } from '../edit-appointment-dialog/edit-appointment-dialog.component';
import { UserDataAccessService } from '../../services/user-data-access.service';
import { HospitalDataAccessService } from '../../services/hospital-data-access.service';
import { DoctorDataAccessService } from '../../services/doctor-data-access.service';
import { AppointmentDataAccessService } from '../../services/appointment-data-access.service';
import { LoadingService } from '../../services/loading.service';
import { AuthService } from '../../services/auth.service';
import { Appointment } from '../../models/appointment.model';
import { TimeMapping } from '../../helpers/time-mapping.helper';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-past-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }
  ],
  templateUrl: './edit-past-appointment-dialog.component.html',
  styleUrls: ['./edit-past-appointment-dialog.component.css']
})
export class EditPastAppointmentDialogComponent extends EditAppointmentDialogComponent implements OnInit {

  constructor(
    fb: FormBuilder,
    dialogRef: MatDialogRef<EditPastAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { appointment: Appointment | null },
    userService: UserDataAccessService,
    hospitalService: HospitalDataAccessService,
    doctorService: DoctorDataAccessService,
    appointmentService: AppointmentDataAccessService,
    loadingService: LoadingService,
    snackBar: MatSnackBar,
    authService: AuthService,
    cdr: ChangeDetectorRef
  ) {
    super(fb, dialogRef, data, userService, hospitalService, doctorService, appointmentService, loadingService,
      snackBar, authService, cdr);
  }

  override async ngOnInit(): Promise<void> {
    // Defer loadingService.show() to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadingService.show();
      this.initializeForm();
    }, 0);
  }

  override async initializeForm(): Promise<void> {
    try {
      await this.checkIfSystemAdmin();

      // Fetch patient users
      const allUsers = await firstValueFrom(this.userService.getAllUsersObservableExcluding([]));
      this.users = allUsers.filter(user => user.isPatient);
      this.users.sort((a, b) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));

      // Fetch all hospitals
      this.hospitals = await firstValueFrom(this.hospitalService.getAllHospitals());
      this.hospitals.sort((a, b) => a.name.localeCompare(b.name));

      if (this.data.appointment) {
        // Populate form with existing appointment data
        this.editAppointmentForm.patchValue({
          id: this.data.appointment.id,
          userId: this.data.appointment.userId,
          hospitalId: this.data.appointment.hospitalId,
          doctorId: this.data.appointment.doctorId,
          date: new Date(this.data.appointment.date),
          appointmentStartTime: TimeMapping.get12HourTime(this.data.appointment.appointmentStartTime),
          reasonForVisit: this.data.appointment.reasonForVisit,
          appointmentNotes: this.data.appointment.appointmentNotes
        });

        // Load doctors for the selected hospital
        await this.loadDoctors(this.data.appointment.hospitalId);
      }
    } catch (error) {
      console.error('Error initializing dialog', error);
      this.snackBar.open('Failed to load data', 'Dismiss', { duration: 5000 });
    } finally {
      this.disableFields();
      this.loadingService.hide();
      this.cdr.detectChanges(); // Trigger change detection
    }
  }

  private disableFields(): void {
    this.editAppointmentForm.get('hospitalId')?.disable();
    this.editAppointmentForm.get('doctorId')?.disable();
    this.editAppointmentForm.get('userId')?.disable();
    this.editAppointmentForm.get('appointmentStartTime')?.disable();
    this.editAppointmentForm.get('date')?.disable();
  }

  override async onSubmit(): Promise<void> {
    if (this.editAppointmentForm.invalid) {
      return;
    }

    const formValues = this.editAppointmentForm.getRawValue();

    const appointment: Appointment = {
      id: formValues.id,
      userId: formValues.userId,
      hospitalId: formValues.hospitalId,
      doctorId: formValues.doctorId,
      date: this.formatDate(formValues.date),
      appointmentStartTime: TimeMapping.get24HourTime(formValues.appointmentStartTime) || '',
      reasonForVisit: formValues.reasonForVisit,
      departmentId: this.getDepartmentId(formValues.doctorId),
      appointmentNotes: formValues.appointmentNotes || ''
    };

    this.loadingService.show();
    try {
      await this.appointmentService.setAppointment(
        appointment.id,
        appointment.userId,
        appointment.appointmentStartTime,
        appointment.date,
        appointment.reasonForVisit,
        appointment.doctorId,
        appointment.departmentId,
        appointment.hospitalId,
        appointment.appointmentNotes
      );
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving appointment', error);
      this.snackBar.open('Failed to save appointment', 'Dismiss', { duration: 5000 });
    }
    this.loadingService.hide();
  }

  override onCancel(): void {
    this.dialogRef.close(false);
  }
}

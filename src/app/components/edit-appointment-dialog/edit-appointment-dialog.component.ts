import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserDataAccessService } from '../../services/user-data-access.service';
import { HospitalDataAccessService } from '../../services/hospital-data-access.service';
import { DoctorDataAccessService } from '../../services/doctor-data-access.service';
import { AppointmentDataAccessService } from '../../services/appointment-data-access.service';
import { User } from '../../models/user.model';
import { Hospital } from '../../models/hospital.model';
import { Doctor } from '../../models/doctor.model';
import { Appointment } from '../../models/appointment.model';
import { TimeMapping } from '../../helpers/time-mapping.helper';
import { LoadingService } from '../../services/loading.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { OfficeHours } from '../../models/office-hours.model';
import { AuthService } from '../../services/auth.service';

export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'MM/DD/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'MM/DD/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-edit-appointment-dialog',
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
  templateUrl: './edit-appointment-dialog.component.html',
  styleUrls: ['./edit-appointment-dialog.component.css']
})
export class EditAppointmentDialogComponent implements OnInit {
  editAppointmentForm: FormGroup;
  isNew: boolean = false;
  isSystemAdmin: boolean = false;
  users: User[] = [];
  hospitals: Hospital[] = [];
  doctors: Doctor[] = [];
  availableTimes: string[] = [];
  currentDate: Date = new Date();
  minDate: Date = new Date();

  constructor(
    private fb: FormBuilder,
    protected dialogRef: MatDialogRef<EditAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { appointment: Appointment | null },
    protected userService: UserDataAccessService,
    protected hospitalService: HospitalDataAccessService,
    protected doctorService: DoctorDataAccessService,
    protected appointmentService: AppointmentDataAccessService,
    protected loadingService: LoadingService,
    protected snackBar: MatSnackBar,
    private authService: AuthService,
    protected cdr: ChangeDetectorRef
  ) {
    this.isNew = !data.appointment;

    this.editAppointmentForm = this.fb.group({
      id: [{ value: '', disabled: true }],
      userId: ['', Validators.required],
      hospitalId: ['', Validators.required],
      doctorId: [{ value: '', disabled: true }, Validators.required],
      date: ['', [Validators.required, this.dateValidator]],
      appointmentStartTime: [{ value: '', disabled: true }, Validators.required],
      reasonForVisit: ['', Validators.required],
      appointmentNotes: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    // Defer loadingService.show() to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadingService.show();
      this.initializeForm();
    }, 0);
  }

  protected async initializeForm(): Promise<void> {
    try {
      await this.checkIfSystemAdmin();

      // Fetch patient users
      const allUsers = await firstValueFrom(this.userService.getAllUsersObservableExcluding([]));
      this.users = allUsers.filter(user => user.isPatient);
      this.users.sort((a, b) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));

      // Fetch all hospitals
      this.hospitals = await firstValueFrom(this.hospitalService.getAllHospitals());
      this.hospitals.sort((a, b) => a.name.localeCompare(b.name));

      if (!this.isNew && this.data.appointment) {
        // Populate form with existing appointment data
        this.editAppointmentForm.patchValue({
          id: this.data.appointment.id,
          userId: this.data.appointment.userId,
          hospitalId: this.data.appointment.hospitalId,
          doctorId: this.data.appointment.doctorId,
          date: new Date(this.data.appointment.date),
          // Setting start time later
          reasonForVisit: this.data.appointment.reasonForVisit,
          appointmentNotes: this.data.appointment.appointmentNotes
        });

        // Load doctors for the selected hospital
        await this.loadDoctors(this.data.appointment.hospitalId);

        // Load available times based on selected date and doctor
        const selectedDate = new Date(this.data.appointment.date);
        await this.loadAvailableTimes(selectedDate, this.data.appointment.doctorId, this.data.appointment);

        // After availableTimes are loaded, set the appointmentStartTime
        const formattedStartTime = TimeMapping.get12HourTime(this.data.appointment.appointmentStartTime);
        if (formattedStartTime && this.availableTimes.includes(formattedStartTime)) {
          this.editAppointmentForm.patchValue({
            appointmentStartTime: formattedStartTime
          });
          this.editAppointmentForm.get('appointmentStartTime')!.enable();
        } else {
          this.editAppointmentForm.get('appointmentStartTime')!.reset();
          this.editAppointmentForm.get('appointmentStartTime')!.disable();
        }
      }

      // Listen to changes in hospital selection to load doctors
      this.editAppointmentForm.get('hospitalId')!.valueChanges.subscribe(async (hospitalId: string) => {
        await this.loadDoctors(hospitalId);
        this.editAppointmentForm.get('doctorId')!.reset();
        this.availableTimes = [];
        this.editAppointmentForm.get('appointmentStartTime')!.reset();
        this.editAppointmentForm.get('appointmentStartTime')!.disable();
      });

      // Listen to changes in date selection to load available times
      this.editAppointmentForm.get('date')!.valueChanges.subscribe(async (date: Date) => {
        const doctorId = this.editAppointmentForm.get('doctorId')!.value;
        this.editAppointmentForm.get('appointmentStartTime')!.reset();
        if (doctorId && date) {
          if (!this.isNew && this.data.appointment) {
            await this.loadAvailableTimes(date, doctorId, this.data.appointment);
          } else {
            await this.loadAvailableTimes(date, doctorId);
          }
        } else {
          this.availableTimes = [];
          this.editAppointmentForm.get('appointmentStartTime')!.disable();
        }
      });

      // Listen to changes in doctor selection to load available times
      this.editAppointmentForm.get('doctorId')!.valueChanges.subscribe(async (doctorId: string) => {
        const date = this.editAppointmentForm.get('date')!.value;
        this.editAppointmentForm.get('appointmentStartTime')!.reset();
        if (doctorId && date) {
          if (!this.isNew && this.data.appointment) {
            await this.loadAvailableTimes(date, doctorId, this.data.appointment);
          } else {
            await this.loadAvailableTimes(date, doctorId);
          }
        } else {
          this.availableTimes = [];
          this.editAppointmentForm.get('appointmentStartTime')!.disable();
        }
      });
    } catch (error) {
      console.error('Error initializing dialog', error);
      this.snackBar.open('Failed to load data', 'Dismiss', { duration: 5000 });
    } finally {
      this.loadingService.hide();
      this.cdr.detectChanges(); // Trigger change detection
    }
  }

  /**
   * Checks if the current user is a system admin.
   */
  protected async checkIfSystemAdmin(): Promise<void> {
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (currentUser) {
        this.isSystemAdmin = currentUser.isSystemAdmin;
      }
    } catch (error) {
      console.error('Error checking if user is system admin', error);
    }
  }

  private dateValidator(control: AbstractControl): { [key: string]: any } | null {
    const selectedDate = control.value;
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(selectedDate);
      if (inputDate < today) {
        return { 'dateInvalid': true };
      }
    }
    return null;
  }

  protected async loadDoctors(hospitalId: string): Promise<void> {
    if (hospitalId) {
      this.loadingService.show();
      try {
        const allDoctors = await firstValueFrom(this.doctorService.getAllDoctors());
        this.doctors = allDoctors.filter(doctor => doctor.hospitalId === hospitalId);
        this.doctors.sort((a, b) => a.name.localeCompare(b.name));
        this.editAppointmentForm.get('doctorId')!.enable();
      } catch (error) {
        console.error('Error loading doctors', error);
        this.snackBar.open('Failed to load doctors', 'Dismiss', { duration: 5000 });
      }
      this.loadingService.hide();
    } else {
      this.doctors = [];
      this.editAppointmentForm.get('doctorId')!.disable();
    }
  }

  protected async loadAvailableTimes(date: Date, doctorId: string, currentAppointment: Appointment | null = null): Promise<void> {
    this.loadingService.show();
    try {
      const formattedDate = this.formatDate(date);
      const appointments = await firstValueFrom(this.appointmentService.getAppointmentsByDoctorForDate(doctorId, formattedDate));
      const bookedTimes24 = appointments.map(app => app.appointmentStartTime);
      let bookedTimes12 = bookedTimes24.map(time => TimeMapping.get12HourTime(time)).filter(time => time !== undefined) as string[];

      if (currentAppointment && formattedDate === currentAppointment.date) {
        const currentAppointmentTime12 = TimeMapping.get12HourTime(currentAppointment.appointmentStartTime) || '';
        bookedTimes12 = bookedTimes12.filter(time => time !== currentAppointmentTime12);
      }

      const day = this.getDayOfWeek(date);
      const officeHours = this.doctors.find(doc => doc.id === doctorId)?.officeHours[day];
      if (officeHours && officeHours.available) {
        const generatedTimes = this.generateTimeSlots(officeHours.startTime, officeHours.endTime);
        this.availableTimes = generatedTimes.filter(time => !bookedTimes12.includes(time));
        this.editAppointmentForm.get('appointmentStartTime')!.enable();
      } else {
        this.availableTimes = [];
        this.editAppointmentForm.get('appointmentStartTime')!.disable();
      }
    } catch (error) {
      this.snackBar.open('Failed to load available times', 'Close', { duration: 5000 });
    } finally {
      this.loadingService.hide();
    }
  }

  private getDayOfWeek(date: Date): keyof OfficeHours {
    const days: Array<keyof OfficeHours> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days[date.getDay() === 0 ? 6 : date.getDay() - 1];
  }

  private generateTimeSlots(start: string, end: string): string[] {
    const times: string[] = [];
    let [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);
    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);

    while (startDate < endDate) {
      const time24h = `${this.pad(startDate.getHours())}:${this.pad(startDate.getMinutes())}`;
      const time12h = TimeMapping.get12HourTime(time24h) || time24h;
      times.push(time12h);
      startDate.setMinutes(startDate.getMinutes() + 30);
    }
    return times;
  }

  async onSubmit(): Promise<void> {
    if (this.editAppointmentForm.invalid) {
      return;
    }

    const formValues = this.editAppointmentForm.getRawValue();

    const appointment: Appointment = {
      id: this.isNew ? '' : formValues.id,
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
      if (this.isNew) {
        await this.appointmentService.createAppointment(
          appointment.userId,
          appointment.appointmentStartTime,
          appointment.date,
          appointment.reasonForVisit,
          appointment.doctorId,
          appointment.departmentId,
          appointment.hospitalId,
          appointment.appointmentNotes
        );
      } else {
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
      }
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving appointment', error);
      this.snackBar.open('Failed to save appointment', 'Dismiss', { duration: 5000 });
    }
    this.loadingService.hide();
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  protected formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = this.pad(date.getMonth() + 1);
    const day = this.pad(date.getDate());
    return `${year}-${month}-${day}`;
  }

  protected getDepartmentId(doctorId: string): string {
    const doctor = this.doctors.find(d => d.id === doctorId);
    return doctor ? doctor.departmentId : '';
  }
}
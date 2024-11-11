import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Hospital } from '../../models/hospital.model';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-edit-hospital-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './edit-hospital-dialog.component.html',
  styleUrls: ['./edit-hospital-dialog.component.css']
})
export class EditHospitalDialogComponent implements OnInit {
  editHospitalForm: FormGroup;
  isNew: boolean = false;
  isSystemAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditHospitalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { hospital: Hospital | null },
    private authService: AuthService
  ) {
    this.isNew = !data.hospital;
    this.editHospitalForm = this.fb.group({
      id: [{ value: data.hospital ? data.hospital.id : '', disabled: true }],
      name: [data.hospital ? data.hospital.name : '', Validators.required],
      streetAddress: [data.hospital ? data.hospital.streetAddress : '', Validators.required],
      neighborhood: [data.hospital ? data.hospital.neighborhood : '', Validators.required],
      city: [data.hospital ? data.hospital.city : '', Validators.required],
      postalCode: [data.hospital ? data.hospital.postalCode : '', Validators.required],
      country: [data.hospital ? data.hospital.country : '', Validators.required],
      appointmentLink: [data.hospital ? data.hospital.appointmentLink : '', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.checkIfSystemAdmin();
  }

  /**
   * Checks if the current user is a system admin.
   */
  private async checkIfSystemAdmin(): Promise<void> {
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (currentUser) {
        this.isSystemAdmin = currentUser.isSystemAdmin;
      }
    } catch (error) {
      console.error('Error checking if user is system admin', error);
    }
  }

  /**
   * Handles the form submission for adding or editing a hospital.
   * If adding a new hospital, closes the dialog with the new hospital data.
   * If editing an existing hospital, closes the dialog with the updated hospital data.
   */
  async onSubmit(): Promise<void> {
    if (this.editHospitalForm.valid) {
      const formValue = this.editHospitalForm.value;

      const hospitalData = {
        id: this.data.hospital?.id || '',
        name: formValue.name,
        streetAddress: formValue.streetAddress,
        neighborhood: formValue.neighborhood,
        city: formValue.city,
        postalCode: formValue.postalCode,
        country: formValue.country,
        appointmentLink: formValue.appointmentLink
      };

      this.dialogRef.close(hospitalData);
    }
  }

  /**
   * Closes the dialog without saving any changes.
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component representing the dialog for adding or editing a user.
 */
@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatRadioModule,
    MatButtonModule
  ],
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.css']
})
export class EditUserDialogComponent {
  editUserForm: FormGroup;
  isNew: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User | null },
    private authService: AuthService
  ) {
    this.isNew = !data.user;
    this.editUserForm = this.fb.group({
      id: [{ value: data.user ? data.user.id : '', disabled: true }],
      email: [data.user ? data.user.email : '', [Validators.required, Validators.email]],
      firstName: [data.user ? data.user.firstName : '', Validators.required],
      lastName: [data.user ? data.user.lastName : '', Validators.required],
      phoneNumber: [data.user ? data.user.phoneNumber : '', [Validators.pattern(/^[+\d\-()\s]+$/)]],
      gender: [data.user ? data.user.genderCode : '', Validators.required],
      profilePictureUri: [data.user ? data.user.profilePictureUri : ''],
      role: [data.user ? this.getUserRole(data.user) : '', Validators.required],
      password: [
        '',
        this.isNew ? [Validators.required] : []
      ]
    });
  }

  /**
   * Determines the role of a user based on boolean flags.
   * 
   * @param user The user whose role is to be determined.
   * @returns The role of the user as a string.
   */
  private getUserRole(user: User): string {
    if (user.isPatient) return 'patient';
    if (user.isHospitalAdmin) return 'hospitalAdmin';
    if (user.isSystemAdmin) return 'systemAdmin';
    return '';
  }

  /**
   * Handles the form submission for adding or editing a user.
   * If adding a new user, closes the dialog with the new user data.
   * If editing an existing user, closes the dialog with the updated user data.
   */
  async onSubmit(): Promise<void> {
    if (this.editUserForm.valid) {
      const formValue = this.editUserForm.value;

      const userData = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phoneNumber: formValue.phoneNumber,
        genderCode: formValue.gender,
        profilePictureUri: formValue.profilePictureUri,
        isPatient: formValue.role === 'patient',
        isHospitalAdmin: formValue.role === 'hospitalAdmin',
        isSystemAdmin: formValue.role === 'systemAdmin',
        password: formValue.password,
        isNew: this.isNew
      };

      if (this.isNew) {
        this.dialogRef.close(userData);
      } else {
        const updatedUser = {
          ...userData,
          id: this.data.user?.id || ''
        };
        this.dialogRef.close(updatedUser);
      }
    }
  }

  /**
   * Closes the dialog without saving any changes.
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
import { Component, Inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models/user.model';
import { PhotoStorageService } from '../../services/photo-storage.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoadingService } from '../../services/loading.service';

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
    MatTooltipModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.css']
})
export class EditUserDialogComponent implements OnInit {
  editUserForm: FormGroup;
  isNew: boolean = false;
  isSystemAdmin: boolean = false;
  isPasswordVisible: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  wasPhotoCleared: boolean = false;
  functionsDisabled: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User | null },
    private photoStorageService: PhotoStorageService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    @Inject('DISABLE_FUNCTIONS') private disableFunctionsConfig: boolean
  ) {
    this.isNew = !data.user;
    this.functionsDisabled = this.disableFunctionsConfig;
    this.editUserForm = this.fb.group({
      id: [{ value: data.user ? data.user.id : '', disabled: true }],
      email: [
        { value: data.user ? data.user.email : '', disabled: this.functionsDisabled },
        [Validators.required, Validators.email]],
      firstName: [data.user ? data.user.firstName : '', Validators.required],
      lastName: [data.user ? data.user.lastName : '', Validators.required],
      phoneNumber: [data.user ? data.user.phoneNumber : '', [Validators.pattern(/^[+\d\-()\s]+$/)]],
      gender: [data.user ? data.user.genderCode : '', Validators.required],
      role: [data.user ? this.getUserRole(data.user) : '', Validators.required],
      password: [
        { value: '', disabled: this.functionsDisabled },
        this.isNew ? [Validators.required] : []
      ]
    });

    if (!this.isNew && data.user?.profilePictureUri) {
      this.previewUrl = data.user.profilePictureUri;
    }
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
   * Opens the file input dialog to upload a photo.
   */
  uploadPhoto(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handles the file selection event.
   * @param event The file input change event.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        this.loadingService.show();

        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrl = e.target.result;
        };
        reader.readAsDataURL(file);
        this.wasPhotoCleared = false;

        this.loadingService.hide();
      } else {
        this.snackBar.open('Invalid file type. Only JPEG, PNG, and GIF images are allowed.', 'Dismiss', {
          duration: 5000,
        });
      }
    }
  }

  /**
   * Clears the selected photo.
   */
  clearPhoto(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.wasPhotoCleared = true;
  }

  /**
   * Handles the form submission for adding or editing a user.
   * If adding a new user, closes the dialog with the new user data.
   * If editing an existing user, closes the dialog with the updated user data.
   */
  async onSubmit(): Promise<void> {
    if (this.editUserForm.valid) {
      const formValue = this.editUserForm.getRawValue();

      let profilePictureUri = this.data.user ? this.data.user.profilePictureUri : '';

      if (!this.isNew) { // Only handle photo for existing users
        if (this.selectedFile) {
          try {
            this.loadingService.show();
            profilePictureUri = await this.photoStorageService.setUserPhoto(
              this.data.user!.id,
              this.selectedFile
            );
          } catch (error) {
            console.error('Error uploading photo', error);
            this.snackBar.open('Failed to upload photo', 'Dismiss', {
              duration: 5000,
            });
            return;
          }
          finally {
            this.loadingService.hide();
          }
        }

        if (this.wasPhotoCleared) {
          try {
            this.loadingService.show();
            await this.photoStorageService.deleteUserPhoto(this.data.user!.id);
            profilePictureUri = '';
          } catch (error) {
            console.error('Error deleting photo', error);
            this.snackBar.open('Failed to delete photo', 'Dismiss', {
              duration: 5000,
            });
            return;
          }
          finally {
            this.loadingService.hide();
          }
        }
      }

        const userData = {
          email: formValue.email,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phoneNumber: formValue.phoneNumber,
          genderCode: formValue.gender,
          profilePictureUri: profilePictureUri,
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
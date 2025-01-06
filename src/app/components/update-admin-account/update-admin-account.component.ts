import { Component, Inject, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { PhotoStorageService } from '../../services/photo-storage.service';
import { LoadingService } from '../../services/loading.service';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Component for updating the current admin's account information.
 */
@Component({
  selector: 'app-update-admin-account',
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
  templateUrl: './update-admin-account.component.html',
  styleUrls: ['./update-admin-account.component.css']
})
export class UpdateAdminAccountComponent implements OnInit {
  updateAdminForm: FormGroup;
  isPasswordVisible: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  wasPhotoCleared: boolean = false;
  private currentUser: User | null = null;
  functionsDisabled: boolean;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private photoStorageService: PhotoStorageService,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    @Inject('DISABLE_FUNCTIONS') private disableFunctionsConfig: boolean
  ) {
    this.functionsDisabled = this.disableFunctionsConfig;
    this.updateAdminForm = this.fb.group({
      id: [{ value: '', disabled: true }],
      email: [
        { value: '', disabled: this.functionsDisabled },
        [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', [Validators.pattern(/^[+\d\-()\s]+$/)]],
      gender: ['', Validators.required],
      role: ['', Validators.required],
      password: [{ value: '', disabled: this.functionsDisabled }]
    });
  }

  async ngOnInit(): Promise<void> {
    this.loadingService.show();
    try {
      this.currentUser = await this.authService.getCurrentUser();
      if (this.currentUser) {
        this.updateAdminForm.patchValue({
          id: this.currentUser.id,
          email: this.currentUser.email,
          firstName: this.currentUser.firstName,
          lastName: this.currentUser.lastName,
          phoneNumber: this.currentUser.phoneNumber,
          gender: this.currentUser.genderCode,
          role: this.getUserRole(this.currentUser)
        });
        if (this.currentUser.profilePictureUri) {
          this.previewUrl = this.currentUser.profilePictureUri;
        }
      }
    } catch (error) {
      console.error('Error loading current user', error);
      this.snackBar.open('Failed to load account information', 'Dismiss', { duration: 5000 });
    } finally {
      this.loadingService.hide();
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
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          this.previewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.snackBar.open('Invalid file type. Only JPEG, PNG, and GIF images are allowed.', 'Dismiss', { duration: 5000 });
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
   * Handles the form submission for editing the current admin's account.
   */
  async onSubmit(): Promise<void> {
    if (this.updateAdminForm.valid) {
      this.loadingService.show();

      try {
        const formValue = this.updateAdminForm.getRawValue();
        let profilePictureUri = this.previewUrl;

        if (this.selectedFile) {
          profilePictureUri = await this.photoStorageService.setUserPhoto(formValue.id, this.selectedFile);
        } else if (this.wasPhotoCleared) {
          await this.photoStorageService.deleteUserPhoto(formValue.id);
          profilePictureUri = '';
        }

        await this.authService.updateUser(
          this.currentUser!.id,
          formValue.email,
          formValue.password,
          formValue.firstName,
          formValue.lastName,
          formValue.phoneNumber,
          formValue.gender,
          profilePictureUri ?? '',
          formValue.role === 'patient',
          formValue.role === 'hospitalAdmin',
          formValue.role === 'systemAdmin'
        );

        this.snackBar.open('Account updated successfully', 'Dismiss', { duration: 5000 });
      } catch (error: any) {
        console.error('Error updating account', error);
        this.snackBar.open('Failed to update account', 'Dismiss', { duration: 5000 });
      } finally {
        this.loadingService.hide();
      }
    }
  }
}
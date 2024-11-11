import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Doctor } from '../../models/doctor.model';
import { Department } from '../../models/department.model';
import { Hospital } from '../../models/hospital.model';
import { PhotoStorageService } from '../../services/photo-storage.service';
import { DepartmentDataAccessService } from '../../services/department-data-access.service';
import { HospitalDataAccessService } from '../../services/hospital-data-access.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoadingService } from '../../services/loading.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-doctor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './edit-doctor-dialog.component.html',
  styleUrls: ['./edit-doctor-dialog.component.css']
})
export class EditDoctorDialogComponent implements OnInit {
  editDoctorForm: FormGroup;
  isNew: boolean = false;
  isSystemAdmin: boolean = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  wasPhotoCleared: boolean = false;
  departments: Department[] = [];
  hospitals: Hospital[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditDoctorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { doctor: Doctor | null },
    private authService: AuthService,
    private photoStorageService: PhotoStorageService,
    private departmentService: DepartmentDataAccessService,
    private hospitalService: HospitalDataAccessService,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.isNew = !data.doctor;
    this.editDoctorForm = this.fb.group({
      id: [{ value: data.doctor ? data.doctor.id : '', disabled: true }],
      name: [data.doctor ? data.doctor.name : '', Validators.required],
      degrees: [data.doctor ? data.doctor.degrees : '', Validators.required],
      phoneNumber: [data.doctor ? data.doctor.phoneNumber : '',
      [Validators.required, Validators.pattern(/^[+\d\-()\s]+$/)]],
      departmentId: [data.doctor ? data.doctor.departmentId : '', Validators.required],
      hospitalId: [data.doctor ? data.doctor.hospitalId : '', Validators.required]
    });

    if (!this.isNew && data.doctor?.profilePictureUri) {
      this.previewUrl = data.doctor.profilePictureUri;
    }
  }

  async ngOnInit(): Promise<void> {
    await this.loadDepartmentsAndHospitals();
    await this.checkIfSystemAdmin();
  }

  /**
   * Loads the list of departments and hospitals, sorts them alphabetically, and populates the dropdowns.
   */
  private async loadDepartmentsAndHospitals(): Promise<void> {
    try {
      const [departments, hospitals] = await Promise.all([
        firstValueFrom(this.departmentService.getAllDepartments()),
        firstValueFrom(this.hospitalService.getAllHospitals())
      ]);

      this.departments = (departments ?? []).sort((a, b) => a.name.localeCompare(b.name));
      this.hospitals = (hospitals ?? []).sort((a, b) => a.name.localeCompare(b.name));

      if (this.isNew) {
        this.editDoctorForm.patchValue({
          departmentId: this.departments[0]?.id,
          hospitalId: this.hospitals[0]?.id
        });
      }
    } catch (error) {
      console.error('Error loading departments and hospitals', error);
      this.snackBar.open('Failed to load departments and hospitals', 'Dismiss', { duration: 5000 });
    }
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
   * Handles the form submission for adding or editing a doctor.
   * If adding a new doctor, closes the dialog with the new doctor data.
   * If editing an existing doctor, closes the dialog with the updated doctor data.
   */
  async onSubmit(): Promise<void> {
    if (this.editDoctorForm.valid) {
      const formValue = this.editDoctorForm.value;

      let profilePictureUri = this.data.doctor ? this.data.doctor.profilePictureUri : '';

      if (!this.isNew) { // Only handle photo for existing doctors
        if (this.selectedFile) {
          try {
            this.loadingService.show();
            profilePictureUri = await this.photoStorageService.setDoctorPhoto(
              this.data.doctor!.id,
              this.selectedFile
            );
          } catch (error) {
            console.error('Error uploading photo', error);
            this.snackBar.open('Failed to upload photo', 'Dismiss', { duration: 5000 });
            return;
          } finally {
            this.loadingService.hide();
          }
        }

        if (this.wasPhotoCleared) {
          try {
            this.loadingService.show();
            await this.photoStorageService.deleteDoctorPhoto(this.data.doctor!.id);
            profilePictureUri = '';
          } catch (error) {
            console.error('Error deleting photo', error);
            this.snackBar.open('Failed to delete photo', 'Dismiss', { duration: 5000 });
            return;
          } finally {
            this.loadingService.hide();
          }
        }
      }

      const doctorData = {
        id: this.data.doctor?.id || '',
        name: formValue.name,
        degrees: formValue.degrees,
        phoneNumber: formValue.phoneNumber,
        profilePictureUri: profilePictureUri,
        departmentId: formValue.departmentId,
        hospitalId: formValue.hospitalId
      };

      this.dialogRef.close(doctorData);
    }
  }

  /**
   * Closes the dialog without saving any changes.
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Doctor } from '../../models/doctor.model';
import { DoctorDataAccessService } from '../../services/doctor-data-access.service';
import { DepartmentDataAccessService } from '../../services/department-data-access.service';
import { HospitalDataAccessService } from '../../services/hospital-data-access.service';
import { DeleteConfirmationDialogComponent, DeleteDialogData } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadingService } from '../../services/loading.service';
import { PhotoStorageService } from '../../services/photo-storage.service';
import { EditDoctorDialogComponent } from '../edit-doctor-dialog/edit-doctor-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

/**
 * Interface representing a doctor list item.
 */
export interface DoctorListItem {
  doctor: Doctor;
  departmentName: string;
  hospitalName: string;
  hospitalNeighborhood: string;
  hospitalCity: string;
}

/**
 * Component for managing doctors, including displaying the doctor list,
 * and providing functionalities to add, edit, or delete doctors.
 */
@Component({
  selector: 'app-manage-doctors',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatSnackBarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './manage-doctors.component.html',
  styleUrls: ['./manage-doctors.component.css']
})
export class ManageDoctorsComponent implements OnInit, OnDestroy {
  doctorListItems: DoctorListItem[] = [];
  filteredDoctors: DoctorListItem[] = [];
  searchTerm: string = '';
  private doctorsSubscription?: Subscription;

  constructor(
    private doctorService: DoctorDataAccessService,
    private departmentService: DepartmentDataAccessService,
    private hospitalService: HospitalDataAccessService,
    private photoStorageService: PhotoStorageService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.loadDoctors();
  }

  ngOnDestroy(): void {
    this.doctorsSubscription?.unsubscribe();
  }

  /**
   * Loads the list of doctors from the database and enriches the data with department and hospital information.
   */
  private loadDoctors(): void {
    this.loadingService.show();

    try {
      this.doctorsSubscription = this.doctorService.getAllDoctors().subscribe({
        next: async (doctors: Doctor[]) => {
          const enrichedDoctors = await Promise.all(doctors.map(async doctor => {
            const department = await this.departmentService.getDepartmentById(doctor.departmentId);
            const hospital = await this.hospitalService.getHospitalById(doctor.hospitalId);
            return {
              doctor,
              departmentName: department?.name || 'N/A',
              hospitalName: hospital?.name || 'N/A',
              hospitalNeighborhood: hospital?.neighborhood || 'N/A',
              hospitalCity: hospital?.city || 'N/A'
            } as DoctorListItem;
          }));
          this.doctorListItems = enrichedDoctors;
          this.filteredDoctors = this.doctorListItems;
          this.filteredDoctors.sort((a, b) => a.doctor.name.localeCompare(b.doctor.name));
          this.loadingService.hide();
        },
        error: (error: any) => {
          console.error('Error loading doctors', error);
          this.loadingService.hide();
          this.snackBar.open('Failed to load doctors', 'Dismiss', { duration: 5000 });
        }
      });
    } catch (error) {
      console.error('Error initializing doctor subscription', error);
      this.loadingService.hide();
      this.snackBar.open('Failed to load doctors', 'Dismiss', { duration: 5000 });
    }
  }

  /**
   * Filters the doctors based on the search term.
   */
  filterDoctors(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredDoctors = this.doctorListItems.filter(item => 
      item.doctor.id.toLowerCase().includes(term) ||
      item.doctor.name.toLowerCase().includes(term)
    );
  }

  /**
   * Adds a new doctor to the database.
   */
  addDoctor(): void {
    const dialogRef = this.dialog.open(EditDoctorDialogComponent, { data: {} });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.doctorService.addDoctor(result.name, result.degrees, result.phoneNumber,
          result.profilePictureUri, result.departmentId, result.hospitalId, result.officeHours)
          .then(() => {
            this.loadingService.hide();
            this.snackBar.open('Doctor added successfully', 'Dismiss', { duration: 5000 });
          }).catch(error => {
            console.error('Error adding doctor', error);
            this.loadingService.hide();
            this.snackBar.open('Failed to add doctor', 'Dismiss', { duration: 5000 });
          });
      }
    });
  }

  /**
   * Opens the dialog to edit an existing doctor.
   * 
   * @param doctor The doctor to edit.
   */
  editDoctor(doctor: Doctor): void {
    const dialogRef = this.dialog.open(EditDoctorDialogComponent, { data: { doctor } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.doctorService.setDoctorById(doctor.id, result.name, result.degrees, result.phoneNumber,
          result.profilePictureUri, result.departmentId, result.hospitalId, result.officeHours)
          .then(() => {
            this.loadingService.hide();
            this.snackBar.open('Doctor updated successfully', 'Dismiss', { duration: 5000 });
          })
          .catch(error => {
            console.error('Error updating doctor', error);
            this.loadingService.hide();
            this.snackBar.open('Failed to update doctor', 'Dismiss', { duration: 5000 });
          });
      }
    });
  }

  /**
   * Deletes a doctor from the database.
   * 
   * @param doctor The doctor to delete.
   */
  deleteDoctor(doctor: Doctor): void {
    const dialogData: DeleteDialogData = {
      title: 'Delete Doctor',
      message: `Are you sure you want to delete doctor "${doctor.name}"?`,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    };

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        this.loadingService.show();

        try {
          if (doctor.profilePictureUri) {
            await this.photoStorageService.deleteDoctorPhoto(doctor.id);
          }
        } catch (error) {
          console.error('Error deleting user', error);
          this.snackBar.open('Failed to delete user', 'Dismiss', { duration: 5000 });
        }

        this.doctorService.removeDoctorById(doctor.id).then(() => {
          this.snackBar.open('Doctor deleted successfully', 'Dismiss', { duration: 5000 });
        }).catch(error => {
          console.error('Error deleting doctor', error);
          this.snackBar.open('Failed to delete doctor', 'Dismiss', { duration: 5000 });
        });

        this.loadingService.hide();
      }
    });
  }
}
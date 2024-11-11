import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Hospital } from '../../models/hospital.model';
import { HospitalDataAccessService } from '../../services/hospital-data-access.service';
import { DeleteConfirmationDialogComponent, DeleteDialogData } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadingService } from '../../services/loading.service';
import { EditHospitalDialogComponent } from '../edit-hospital-dialog/edit-hospital-dialog.component';

@Component({
  selector: 'app-manage-hospitals',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './manage-hospitals.component.html',
  styleUrls: ['./manage-hospitals.component.css']
})
export class ManageHospitalsComponent implements OnInit, OnDestroy {
  hospitals: Hospital[] = [];
  private hospitalsSubscription?: Subscription;

  constructor(
    private hospitalService: HospitalDataAccessService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.loadHospitals();
  }

  ngOnDestroy(): void {
    this.hospitalsSubscription?.unsubscribe();
  }

  private loadHospitals(): void {
    this.loadingService.show();
    try {
      this.hospitalsSubscription = this.hospitalService.getAllHospitals().subscribe({
        next: (hospitals: Hospital[]) => {
          this.hospitals = hospitals;
          this.hospitals.sort((a, b) => a.name.localeCompare(b.name));
          this.loadingService.hide();
        },
        error: (error: any) => {
          console.error('Error loading hospitals', error);
          this.loadingService.hide();
          this.snackBar.open('Failed to load hospitals', 'Dismiss', { duration: 5000 });
        }
      });
    } catch (error) {
      console.error('Error initializing hospital subscription', error);
      this.loadingService.hide();
      this.snackBar.open('Failed to load hospitals', 'Dismiss', { duration: 5000 });
    }
  }

  addHospital(): void {
    const dialogRef = this.dialog.open(EditHospitalDialogComponent, { data: {} });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.hospitalService.addHospital(result.name, result.streetAddress, result.neighborhood, result.city, result.postalCode, result.country, result.appointmentLink)
          .then(() => {
            this.loadingService.hide();
            this.snackBar.open('Hospital added successfully', 'Dismiss', { duration: 5000 });
          }).catch(error => {
            console.error('Error adding hospital', error);
            this.loadingService.hide();
            this.snackBar.open('Failed to add hospital', 'Dismiss', { duration: 5000 });
          });
      }
    });
  }

  editHospital(hospital: Hospital): void {
    const dialogRef = this.dialog.open(EditHospitalDialogComponent, { data: { hospital } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.hospitalService.setHospitalById(hospital.id, result.name, result.streetAddress, result.neighborhood, result.city, result.postalCode, result.country, result.appointmentLink)
          .then(() => {
            this.loadingService.hide();
            this.snackBar.open('Hospital updated successfully', 'Dismiss', { duration: 5000 });
          })
          .catch(error => {
            console.error('Error updating hospital', error);
            this.loadingService.hide();
            this.snackBar.open('Failed to update hospital', 'Dismiss', { duration: 5000 });
          });
      }
    });
  }

  deleteHospital(hospital: Hospital): void {
    const dialogData: DeleteDialogData = {
      title: 'Delete Hospital',
      message: `Are you sure you want to delete hospital "${hospital.name}"?`,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    };

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        this.loadingService.show();
        this.hospitalService.removeHospitalById(hospital.id).then(() => {
          this.snackBar.open('Hospital deleted successfully', 'Dismiss', { duration: 5000 });
        }).catch(error => {
          console.error('Error deleting hospital', error);
          this.snackBar.open('Failed to delete hospital', 'Dismiss', { duration: 5000 });
        });
        this.loadingService.hide();
      }
    });
  }
}
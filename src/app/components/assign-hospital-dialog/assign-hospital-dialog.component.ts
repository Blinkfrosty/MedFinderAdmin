import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HospitalDataAccessService } from '../../services/hospital-data-access.service';
import { HospitalAdminAssignmentDataAccessService } from '../../services/hospital-admin-assignment-data-access.service';
import { Hospital } from '../../models/hospital.model';
import { HospitalAdminAssignment } from '../../models/hospital-admin-assignment.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../../services/loading.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-assign-hospital-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule
  ],
  templateUrl: './assign-hospital-dialog.component.html',
  styleUrls: ['./assign-hospital-dialog.component.css']
})
export class AssignHospitalDialogComponent implements OnInit {
  hospitals: Hospital[] = [];
  assignForm: FormGroup;
  user: User;

  constructor(
    public dialogRef: MatDialogRef<AssignHospitalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User },
    private hospitalService: HospitalDataAccessService,
    private assignmentService: HospitalAdminAssignmentDataAccessService,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.user = data.user;
    this.assignForm = this.fb.group({
      hospital: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadingService.show();
    // Fetch all hospitals
    this.hospitalService.getAllHospitals().subscribe({
      next: (hospitals) => {
        this.hospitals = hospitals;
        // After fetching hospitals, fetch the assigned hospital ID
        this.assignmentService.getAssignedHospitalId(this.user.id).then(hospitalId => {
          if (hospitalId) {
            const assignedHospital = this.hospitals.find(h => h.id === hospitalId);
            if (assignedHospital) {
              this.assignForm.patchValue({ hospital: assignedHospital });
            } else {
              console.warn(`Assigned hospital ID ${hospitalId} not found in hospitals list.`);
            }
          }
          this.loadingService.hide();
        }).catch(err => {
          console.error('Error fetching assigned hospital:', err);
          this.loadingService.hide();
          this.snackBar.open('Failed to load assigned hospital', 'Close', { duration: 5000 });
        });
      },
      error: (err) => {
        console.error('Error fetching hospitals:', err);
        this.loadingService.hide();
        this.snackBar.open('Failed to load hospitals', 'Close', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    if (this.assignForm.invalid) return;

    const selectedHospital: Hospital = this.assignForm.value.hospital;
    const assignment: HospitalAdminAssignment = {
      userId: this.user.id,
      hospitalId: selectedHospital.id
    };

    try {
      await this.assignmentService.setAssignment(assignment.userId, assignment.hospitalId);
      console.log('Hospital assigned:', assignment);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error assigning hospital:', error);
      this.snackBar.open('Failed to assign hospital', 'Close', { duration: 5000 });
    }
  }
}
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Department } from '../../models/department.model';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-edit-department-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './edit-department-dialog.component.html',
  styleUrls: ['./edit-department-dialog.component.css']
})
export class EditDepartmentDialogComponent implements OnInit {
  editDepartmentForm: FormGroup;
  isNew: boolean = false;
  isSystemAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditDepartmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { department: Department | null },
    private authService: AuthService
  ) {
    this.isNew = !data.department;
    this.editDepartmentForm = this.fb.group({
      id: [{ value: data.department ? data.department.id : '', disabled: true }],
      name: [data.department ? data.department.name : '', Validators.required],
      description: [data.department ? data.department.description : '', Validators.required]
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
   * Handles the form submission for adding or editing a department.
   * If adding a new department, closes the dialog with the new department data.
   * If editing an existing department, closes the dialog with the updated department data.
   */
  async onSubmit(): Promise<void> {
    if (this.editDepartmentForm.valid) {
      const formValue = this.editDepartmentForm.value;

      const departmentData = {
        id: this.data.department?.id || '',
        name: formValue.name,
        description: formValue.description
      };

      this.dialogRef.close(departmentData);
    }
  }

  /**
   * Closes the dialog without saving any changes.
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
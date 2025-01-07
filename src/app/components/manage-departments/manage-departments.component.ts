import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Department } from '../../models/department.model';
import { DepartmentDataAccessService } from '../../services/department-data-access.service';
import { DeleteConfirmationDialogComponent, DeleteDialogData } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadingService } from '../../services/loading.service';
import { EditDepartmentDialogComponent } from '../edit-department-dialog/edit-department-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-manage-departments',
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
  templateUrl: './manage-departments.component.html',
  styleUrls: ['./manage-departments.component.css']
})
export class ManageDepartmentsComponent implements OnInit, OnDestroy {
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  searchTerm: string = '';
  private departmentsSubscription?: Subscription;

  constructor(
    private departmentService: DepartmentDataAccessService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    this.departmentsSubscription?.unsubscribe();
  }

  private loadDepartments(): void {
    this.loadingService.show();
    try {
      this.departmentsSubscription = this.departmentService.getAllDepartments().subscribe({
        next: (departments: Department[]) => {
          this.departments = departments;
          this.filteredDepartments = departments;
          this.filteredDepartments.sort((a, b) => a.name.localeCompare(b.name));
          this.loadingService.hide();
        },
        error: (error: any) => {
          console.error('Error loading departments', error);
          this.loadingService.hide();
          this.snackBar.open('Failed to load departments', 'Dismiss', { duration: 5000 });
        }
      });
    } catch (error) {
      console.error('Error initializing department subscription', error);
      this.loadingService.hide();
      this.snackBar.open('Failed to load departments', 'Dismiss', { duration: 5000 });
    }
  }

  /**
   * Filters the departments based on the search term.
   */
  filterDepartments(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredDepartments = this.departments.filter(dept => 
      dept.id.toLowerCase().includes(term) ||
      dept.name.toLowerCase().includes(term)
    );
  }

  /**
   * Adds a new department to the database.
   */
  addDepartment(): void {
    const dialogRef = this.dialog.open(EditDepartmentDialogComponent, { data: {} });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.departmentService.addDepartment(result.name, result.description).then(() => {
          this.loadingService.hide();
          this.snackBar.open('Department added successfully', 'Dismiss', { duration: 5000 });
        }).catch(error => {
          console.error('Error adding department', error);
          this.loadingService.hide();
          this.snackBar.open('Failed to add department', 'Dismiss', { duration: 5000 });
        });
      }
    });
  }

  /**
   * Opens the dialog to edit an existing department.
   * 
   * @param department The department to edit.
   */
  editDepartment(department: Department): void {
    const dialogRef = this.dialog.open(EditDepartmentDialogComponent, { data: { department } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.departmentService.setDepartmentById(department.id, result.name, result.description)
          .then(() => {
            this.loadingService.hide();
            this.snackBar.open('Department updated successfully', 'Dismiss', { duration: 5000 });
          })
          .catch(error => {
            console.error('Error updating department', error);
            this.loadingService.hide();
            this.snackBar.open('Failed to update department', 'Dismiss', { duration: 5000 });
          });
      }
    });
  }

  /**
   * Deletes the specified department.
   * 
   * @param department The department to delete.
   */
  deleteDepartment(department: Department): void {
    const dialogData: DeleteDialogData = {
      title: 'Delete Department',
      message: `Are you sure you want to delete department "${department.name}"?`,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    };

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        this.loadingService.show();
        this.departmentService.removeDepartmentById(department.id).then(() => {
          this.snackBar.open('Department deleted successfully', 'Dismiss', { duration: 5000 });
        }).catch(error => {
          console.error('Error deleting department', error);
          this.snackBar.open('Failed to delete department', 'Dismiss', { duration: 5000 });
        });
        this.loadingService.hide();
      }
    });
  }
}
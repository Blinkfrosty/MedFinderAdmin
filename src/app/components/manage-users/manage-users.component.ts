import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { EditUserDialogComponent } from '../edit-user-dialog/edit-user-dialog.component';
import { DeleteConfirmationDialogComponent, DeleteDialogData } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { User } from '../../models/user.model';
import { UserDataAccessService } from '../../services/user-data-access.service';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';
import { Subscription } from 'rxjs';
import { PhotoStorageService } from '../../services/photo-storage.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AssignHospitalDialogComponent } from '../assign-hospital-dialog/assign-hospital-dialog.component';
import { HospitalAdminAssignmentDataAccessService } from '../../services/hospital-admin-assignment-data-access.service';

/**
 * Component responsible for managing users, including displaying the user list,
 * and providing functionalities to add, edit, or delete users.
 */
@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {

  /**
   * Array holding the list of users to be displayed.
   * @type {User[]}
   */
  users: User[] = [];
  filteredUsers: User[] = [];
  private usersSubscription?: Subscription;
  functionsDisabled: boolean;
  searchTerm: string = '';

  constructor(
    private dialog: MatDialog,
    private userDataAccessService: UserDataAccessService,
    private authService: AuthService,
    private loadingService: LoadingService,
    private photoStorageService: PhotoStorageService,
    private snackBar: MatSnackBar,
    private hospitalAdminAssignmentDataAccessService: HospitalAdminAssignmentDataAccessService,
    @Inject('DISABLE_FUNCTIONS') private disableFunctionsConfig: boolean
  ) {
    this.functionsDisabled = this.disableFunctionsConfig;
  }

  ngOnInit(): void {
    this.initializeUserSubscription();
  }

  ngOnDestroy(): void {
    // Clean up the subscription to prevent memory leaks
    this.usersSubscription?.unsubscribe();
  }

  /**
   * Initializes the subscription to the users Observable for real-time updates.
   * Retrieves the current authenticated user and subscribes to the users list,
   * excluding the current user's ID. Updates the local users array upon data changes.
   */
  private async initializeUserSubscription(): Promise<void> {
    this.loadingService.show();
    try {
      const currentUser = await this.authService.getCurrentUser();
      if (currentUser) {
        // Subscribe to the users Observable
        this.usersSubscription = this.userDataAccessService.getAllUsersObservableExcluding([currentUser.id])
          .subscribe({
            next: (users: User[]) => {
              this.users = users;
              this.filteredUsers = users;
              this.filteredUsers.sort((a, b) => a.firstName.localeCompare(b.firstName)
                || a.lastName.localeCompare(b.lastName));
              this.loadingService.hide();
            },
            error: (error: any) => {
              console.error('Error loading users', error);
              this.loadingService.hide();
              this.snackBar.open('Failed to load users', 'Dismiss',
                { duration: 5000 });
            }
          });
      } else {
        console.warn('No authenticated user found.');
        this.loadingService.hide();
        this.snackBar.open('Failed to load users', 'Dismiss', { duration: 5000 });
      }
    } catch (error) {
      console.error('Error initializing user subscription', error);
      this.loadingService.hide();
      this.snackBar.open('Failed to load users', 'Dismiss', { duration: 5000 });
    }
  }

  /**
   * Filters the users based on the search term.
   */
  filterUsers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.id.toLowerCase().includes(term) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }

  /**
   * Opens the dialog to add a new user.
   */
  async addUser(): Promise<void> {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      data: { user: null }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && result.isNew) {
        this.loadingService.show();
        try {
          await this.authService.createUser(
            result.email,
            result.password,
            result.firstName,
            result.lastName,
            result.phoneNumber,
            result.genderCode,
            result.profilePictureUri,
            result.isPatient,
            result.isHospitalAdmin,
            result.isSystemAdmin
          );
          this.snackBar.open('User added successfully', 'Dismiss', { duration: 5000 });
        } catch (error) {
          console.error('Error creating user', error);
          this.snackBar.open('Failed to add user', 'Dismiss', { duration: 5000 });
        } finally {
          this.loadingService.hide();
        }
      }
    });
  }

  /**
   * Opens the dialog to edit an existing user.
   *
   * @param user The user to be edited.
   */
  editUser(user: User): void {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      data: { user }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && !result.isNew) {
        this.loadingService.show();
        try {
          await this.authService.updateUser(
            result.id,
            result.email,
            result.password,
            result.firstName,
            result.lastName,
            result.phoneNumber,
            result.genderCode,
            result.profilePictureUri,
            result.isPatient,
            result.isHospitalAdmin,
            result.isSystemAdmin
          );

          // If the user is no longer a hospital admin, delete the assignment
          if (!result.isHospitalAdmin && user.isHospitalAdmin != result.isHospitalAdmin) {
            await this.hospitalAdminAssignmentDataAccessService.deleteAssignment(user.id);
          }

          this.snackBar.open('User updated successfully', 'Dismiss', { duration: 5000 });
        } catch (error) {
          console.error('Error updating user', error);
          this.snackBar.open('Failed to update user', 'Dismiss', { duration: 5000 });
        } finally {
          this.loadingService.hide();
        }
      }
    });
  }

  /**
   * Opens a confirmation dialog and deletes the user if confirmed.
   *
   * @param user The user to be deleted.
   */
  async deleteUser(user: User): Promise<void> {
    const dialogData: DeleteDialogData = {
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.email}"?`,
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
          if (user.profilePictureUri) {
            await this.photoStorageService.deleteUserPhoto(user.id);
          }

          // Delete the hospital assignment
          await this.hospitalAdminAssignmentDataAccessService.deleteAssignment(user.id);

          await this.authService.deleteUser(user.id);
          this.snackBar.open('User deleted successfully', 'Dismiss', { duration: 5000 });
        } catch (error) {
          console.error('Error deleting user', error);
          this.snackBar.open('Failed to delete user', 'Dismiss', { duration: 5000 });
        } finally {
          this.loadingService.hide();
        }
      }
    });
  }

  /**
     * Assigns a hospital to the specified hospital admin user.
     * 
     * @param user The user to assign a hospital to.
     */
  assignHospital(user: User): void {
    const dialogRef = this.dialog.open(AssignHospitalDialogComponent, {
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Hospital assignment updated.', 'Close', { duration: 5000 });
      }
    });
  }
}
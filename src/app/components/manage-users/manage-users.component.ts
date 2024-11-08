import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
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

/**
 * Component responsible for managing users, including displaying the user list,
 * and providing functionalities to add, edit, or delete users.
 */
@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {

  /**
   * Array holding the list of users to be displayed.
   * @type {User[]}
   */
  users: User[] = [];
  private usersSubscription?: Subscription;

  constructor(
    private dialog: MatDialog,
    private userDataAccessService: UserDataAccessService,
    private authService: AuthService,
    private loadingService: LoadingService,
    private photoStorageService: PhotoStorageService,
    private snackBar: MatSnackBar
  ) { }

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
   * Opens the dialog to add a new user.
   * After the dialog is closed, if a new user is created, it triggers the user subscription
   * to update the users list automatically.
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
   * After the dialog is closed, if the user is updated, it triggers the user subscription
   * to update the users list automatically.
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
   * After deletion, the user subscription updates the users list automatically.
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
}
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoutConfirmationDialogComponent } from '../logout-confirmation-dialog/logout-confirmation-dialog.component';

/**
 * Component responsible for displaying the system admin dashboard.
 * This dashboard is intended to be used by system admins only, providing access to administrative functionalities.
 */
@Component({
  selector: 'app-system-admin-dashboard',
  standalone: true,
  imports: [MatSidenavModule, MatListModule, MatDialogModule, RouterModule],
  templateUrl: './system-admin-dashboard.component.html',
  styleUrls: ['./system-admin-dashboard.component.css']
})
export class SystemAdminDashboardComponent {
  constructor(private authService: AuthService, private dialog: MatDialog) { }

  /**
   * Initiates the logout process by opening a confirmation dialog.
   * If the user confirms, it calls the AuthService to log out the user.
   * Ensures that only confirmed logout actions proceed.
   */
  confirmLogout(): void {
    const dialogRef = this.dialog.open(LogoutConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.logout();
      }
    });
  }
}
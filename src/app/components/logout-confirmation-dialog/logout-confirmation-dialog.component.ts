import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component responsible for displaying a confirmation dialog when a user attempts to log out.
 */
@Component({
  selector: 'app-logout-confirmation-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './logout-confirmation-dialog.component.html',
  styleUrls: ['./logout-confirmation-dialog.component.css']
})
export class LogoutConfirmationDialogComponent {
  constructor(private dialogRef: MatDialogRef<LogoutConfirmationDialogComponent>) { }

  /**
   * Handles the confirmation action.
   * Closes the dialog and returns `true` to indicate that the user has confirmed the logout.
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Handles the cancellation action.
   * Closes the dialog and returns `false` to indicate that the user has canceled the logout.
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
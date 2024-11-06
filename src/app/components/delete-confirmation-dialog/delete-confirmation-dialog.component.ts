import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

/**
 * Interface representing the data passed to the DeleteConfirmationDialogComponent.
 */
export interface DeleteDialogData {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

/**
 * Component for displaying a delete confirmation dialog.
 */
@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrls: ['./delete-confirmation-dialog.component.css']
})
export class DeleteConfirmationDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteDialogData
  ) { }

  /**
   * Handles the confirmation action.
   * Closes the dialog and passes a value indicating confirmation.
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Handles the cancellation action.
   * Closes the dialog and passes a value indicating cancellation.
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}

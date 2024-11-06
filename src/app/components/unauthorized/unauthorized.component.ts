import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component responsible for displaying an unauthorized access message.
 * This component informs users that they do not have permission to view the requested page
 * and provides a button to navigate back to the login page.
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <div class="unauthorized-container">
      <h1>Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
      <button mat-raised-button color="primary" routerLink="/login">Go to Login</button>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      text-align: center;
      margin-top: 50px;
    }
  `]
})
export class UnauthorizedComponent { }

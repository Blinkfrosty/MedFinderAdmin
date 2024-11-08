import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

/**
 * Component responsible for handling user login functionality.
 * It provides a form for users to enter their credentials and manages the authentication process.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading: boolean = false;
  isPasswordVisible: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // Subscribe to loading state
    this.authService.loading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  /**
   * Handles the form submission for user login.
   * Validates the form, attempts to authenticate the user, and manages error messages.
   *
   * @returns {Promise<void>} A promise that resolves when the login process is complete.
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        await this.authService.login(email, password);
      } catch (error) {
        console.error('Login failed', error);

        if ((error as Error).message === 'User is not an admin') {
          this.snackBar.open('Login failed. Please log in with an admin account.', 'Dismiss', {
            duration: 5000
          });
        } else {
          this.snackBar.open('Login failed. Please check your email and password and try again.', 'Dismiss', {
            duration: 5000
          });
        }
      }
    }
  }
}
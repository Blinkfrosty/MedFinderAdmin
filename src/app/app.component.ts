import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLoading$: Observable<boolean>;

  constructor(private authService: AuthService, private router: Router) {
    this.isLoading$ = this.authService.loading$;
  }

  ngOnInit(): void {
    this.authService.initializeAuth().then(() => {
      this.authService.currentUser$.subscribe((user) => {
        if (user) {
          if (user.isSystemAdmin) {
            this.router.navigate(['/system-admin-dashboard']);
          } else if (user.isHospitalAdmin) {
            // Navigate to hospital admin dashboard when implemented
            // this.router.navigate(['/hospital-admin-dashboard']);
            console.warn('Hospital admin navigation not implemented yet.');
          } else {
            // If user has no recognized role, navigate to login or unauthorized page
            this.router.navigate(['/login']);
          }
        } else {
          // User is not authenticated, navigate to login
          this.router.navigate(['/login']);
        }
      });
    });
  }
}
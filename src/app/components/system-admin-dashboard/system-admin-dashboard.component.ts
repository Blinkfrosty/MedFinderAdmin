import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-system-admin-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './system-admin-dashboard.component.html',
  styleUrls: ['./system-admin-dashboard.component.css']
})
export class SystemAdminDashboardComponent {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SystemAdminDashboardComponent } from './components/system-admin-dashboard/system-admin-dashboard.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'system-admin-dashboard', component: SystemAdminDashboardComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
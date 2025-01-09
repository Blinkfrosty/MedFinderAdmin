import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SystemAdminDashboardComponent } from './components/system-admin-dashboard/system-admin-dashboard.component';
import { ManageUsersComponent } from './components/manage-users/manage-users.component';
import { ManageDepartmentsComponent } from './components/manage-departments/manage-departments.component';
import { ManageDoctorsComponent } from './components/manage-doctors/manage-doctors.component';
import { ManageHospitalsComponent } from './components/manage-hospitals/manage-hospitals.component';
import { ManageUpcomingAppointmentsComponent } from './components/manage-upcoming-appointments/manage-upcoming-appointments.component';
import { ManagePastAppointmentsComponent } from './components/manage-past-appointments/manage-past-appointments.component';
import { UpdateAdminAccountComponent } from './components/update-admin-account/update-admin-account.component';
import { AuthGuard } from './guards/auth.guard';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'system-admin-dashboard',
    component: SystemAdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { requiredRole: 'systemAdmin' }, // Specify required role
    children: [
      { path: '', redirectTo: 'manage-users', pathMatch: 'full' },
      { path: 'manage-users', component: ManageUsersComponent },
      { path: 'manage-departments', component: ManageDepartmentsComponent },
      { path: 'manage-doctors', component: ManageDoctorsComponent },
      { path: 'manage-hospitals', component: ManageHospitalsComponent },
      { path: 'manage-upcoming-appointments', component: ManageUpcomingAppointmentsComponent },
      { path: 'manage-past-appointments', component: ManagePastAppointmentsComponent },
      { path: 'update-admin-account', component: UpdateAdminAccountComponent }
    ]
  },
  // Future route for Hospital Admin
  // {
  //   path: 'hospital-admin-dashboard',
  //   component: HospitalAdminDashboardComponent,
  //   canActivate: [AuthGuard],
  //   data: { requiredRole: 'hospitalAdmin' },
  //   children: [
  //     // Define child routes here
  //   ]
  // },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
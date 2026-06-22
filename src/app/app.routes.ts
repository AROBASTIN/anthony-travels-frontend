import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard';
import { DriverDashboardComponent } from './components/driver-dashboard/driver-dashboard';
import { CabOwnerDashboardComponent } from './components/cab-owner-dashboard/cab-owner-dashboard';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';

import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard/customer', 
    component: CustomerDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['customer'] }
  },
  { 
    path: 'dashboard/driver', 
    component: DriverDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['driver'] }
  },
  { 
    path: 'dashboard/cab-owner', 
    component: CabOwnerDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['cab_owner'] }
  },
  { 
    path: 'dashboard/admin', 
    component: AdminDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  }
];

import { Routes } from '@angular/router';
import { authGuard, staffGuard } from './core/auth.guards';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { NewClaimComponent } from './pages/new-claim.component';
import { ClaimDetailComponent } from './pages/claim-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'claims/new', component: NewClaimComponent, canActivate: [authGuard] },
  { path: 'claims/:id', component: ClaimDetailComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(c => c.Login),
  },
  {
    path: 'admin',
    // canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-layout/admin-layout').then(c => c.AdminLayout),
  },
  {
    path: 'student',
    // canActivate: [authGuard],
    loadComponent: () => import('./components/student-layout/student-layout').then(c => c.StudentLayout),
  }

  // { path: '**', redirectTo: 'login' }
];

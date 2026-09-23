import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
    title: 'Iniciar sesión | Sistema de Egresados ICCI',
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
    title: 'Crear cuenta | Sistema de Egresados ICCI',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/inicio/inicio.component').then(
            (m) => m.InicioComponent,
          ),
        title: 'Panel principal | Sistema de Egresados ICCI',
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

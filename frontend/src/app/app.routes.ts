import { Routes } from '@angular/router';
import { adminGuard, rolGuard } from './core/guards/rol.guard';

const layout = () =>
  import('./features/layout/panel-layout.component').then(
    (m) => m.PanelLayoutComponent,
  );

const ajustes = (area: string) => ({
  path: 'ajustes',
  loadComponent: () =>
    import('./features/ajustes/ajustes.component').then((m) => m.AjustesComponent),
  title: `Ajustes | ${area} ICCI`,
});

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
    title: 'Activar cuenta | Sistema de Egresados ICCI',
  },

  // ---- Secretaría (admin) ----
  {
    path: 'secretaria',
    canActivate: [rolGuard(['secretaria'])],
    loadComponent: layout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/secretaria/inicio/secretaria-inicio.component').then(
            (m) => m.SecretariaInicioComponent,
          ),
        title: 'Inicio | Secretaría ICCI',
      },
      {
        path: 'registrar',
        loadComponent: () =>
          import('./features/secretaria/registrar/registrar-egresado.component').then(
            (m) => m.RegistrarEgresadoComponent,
          ),
        title: 'Registrar egresado | Secretaría ICCI',
      },
      {
        path: 'comunicaciones',
        loadComponent: () =>
          import('./features/secretaria/comunicaciones/comunicaciones.component').then(
            (m) => m.ComunicacionesComponent,
          ),
        title: 'Comunicaciones | Secretaría ICCI',
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/secretaria/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
        title: 'Usuarios | Secretaría ICCI',
      },
      ajustes('Secretaría'),
      { path: '**', redirectTo: '' },
    ],
  },

  // ---- Jefatura de carrera (admin) ----
  {
    path: 'jefatura',
    canActivate: [rolGuard(['jefe_carrera'])],
    loadComponent: layout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/jefatura/inicio/jefatura-inicio.component').then(
            (m) => m.JefaturaInicioComponent,
          ),
        title: 'Panel de métricas | Jefatura ICCI',
      },
      ajustes('Jefatura'),
      { path: '**', redirectTo: '' },
    ],
  },

  // ---- Egresado (usuario común) ----
  {
    path: 'egresado',
    canActivate: [rolGuard(['egresado'])],
    loadComponent: layout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/egresado/inicio/egresado-inicio.component').then(
            (m) => m.EgresadoInicioComponent,
          ),
        title: 'Inicio | Egresado ICCI',
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/dashboard/perfil/perfil.component').then(
            (m) => m.PerfilComponent,
          ),
        title: 'Mi perfil | Egresado ICCI',
      },
      ajustes('Egresado'),
      { path: '**', redirectTo: '' },
    ],
  },

  // El dashboard anterior queda reemplazado por la zona del egresado.
  { path: 'dashboard', redirectTo: 'egresado' },
  { path: '**', redirectTo: 'login' },
];

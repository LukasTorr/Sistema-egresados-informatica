import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ComunicacionesModule } from './comunicaciones/comunicaciones.module';
import { EgresadosModule } from './egresados/egresados.module';
import { EspecialidadesModule } from './especialidades/especialidades.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    EspecialidadesModule,
    EgresadosModule,
    ComunicacionesModule,
  ],
  providers: [
    // Todas las rutas exigen token salvo las marcadas con @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Y luego se revisa el rol si la ruta tiene @Roles(...)
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

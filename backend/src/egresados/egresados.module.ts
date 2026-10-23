import { Module } from '@nestjs/common';
import { CargaMasivaController } from './carga-masiva.controller';
import { CargaMasivaService } from './carga-masiva.service';
import { EgresadosController } from './egresados.controller';
import { EgresadosService } from './egresados.service';

@Module({
  // Antes que /egresados/:id
  controllers: [CargaMasivaController, EgresadosController],
  providers: [EgresadosService, CargaMasivaService],
  exports: [EgresadosService],
})
export class EgresadosModule {}

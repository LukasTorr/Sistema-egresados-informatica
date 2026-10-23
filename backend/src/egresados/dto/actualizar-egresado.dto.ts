import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { EstadoPerfil } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { DatosPersonalesDto } from './crear-egresado.dto';

export class ActualizarEgresadoDto extends PartialType(DatosPersonalesDto) {
  @ApiPropertyOptional({ enum: EstadoPerfil })
  @IsOptional()
  @IsEnum(EstadoPerfil)
  estado_perfil?: EstadoPerfil;
}

export class ActualizarMiPerfilDto extends PartialType(
  PickType(DatosPersonalesDto, ['ciudad_residencia', 'apellido_materno'] as const),
) {}

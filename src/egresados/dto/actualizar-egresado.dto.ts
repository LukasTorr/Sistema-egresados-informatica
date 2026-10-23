import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { EstadoPerfil } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { DatosPersonalesDto } from './crear-egresado.dto';

/** HU-02: el administrador puede modificar cualquier dato personal. */
export class ActualizarEgresadoDto extends PartialType(DatosPersonalesDto) {
  @ApiPropertyOptional({ enum: EstadoPerfil })
  @IsOptional()
  @IsEnum(EstadoPerfil)
  estado_perfil?: EstadoPerfil;
}

/** Lo que el propio egresado puede cambiar de su perfil. */
export class ActualizarMiPerfilDto extends PartialType(
  PickType(DatosPersonalesDto, ['ciudad_residencia', 'apellido_materno'] as const),
) {}

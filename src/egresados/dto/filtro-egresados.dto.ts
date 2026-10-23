import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoLaboral, EstadoPerfil } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginacionDto } from '../../common/utils/paginacion.dto';

export class FiltroEgresadosDto extends PaginacionDto {
  @ApiPropertyOptional({ description: 'Busca por RUT, nombres o apellidos' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_especialidad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio_egreso?: number;

  @ApiPropertyOptional({ enum: EstadoLaboral, description: 'Según la situación laboral actual' })
  @IsOptional()
  @IsEnum(EstadoLaboral)
  estado_laboral?: EstadoLaboral;

  @ApiPropertyOptional({ enum: EstadoPerfil })
  @IsOptional()
  @IsEnum(EstadoPerfil)
  estado_perfil?: EstadoPerfil;
}

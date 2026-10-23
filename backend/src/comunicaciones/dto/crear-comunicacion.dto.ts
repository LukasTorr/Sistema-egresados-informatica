import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CanalComunicacion } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const recortar = ({ value }) => (typeof value === 'string' ? value.trim() : value);
const sinFiltro = ({ value }) => (value === 0 || value === '0' || value === '' || value === null ? undefined : value);

export class CrearComunicacionDto {
  @ApiProperty({ example: 'Encuentro de egresados 2026' })
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo: string;

  @ApiProperty({ example: 'Los invitamos al encuentro anual el 15 de noviembre en el auditorio...' })
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  contenido: string;

  @ApiPropertyOptional({
    enum: CanalComunicacion,
    default: CanalComunicacion.PORTAL,
    description: 'Por ahora solo se publica en el portal; el envío por correo queda para un sprint siguiente.',
  })
  @IsOptional()
  @IsEnum(CanalComunicacion)
  canal?: CanalComunicacion;

  @ApiPropertyOptional({ example: 1, description: 'Solo para egresados de esta especialidad (vacío o 0 = todas)' })
  @Transform(sinFiltro)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_especialidad?: number;

  @ApiPropertyOptional({ example: 2024, description: 'Solo para egresados de este año de egreso (vacío o 0 = todos)' })
  @Transform(sinFiltro)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  anio_egreso?: number;
}

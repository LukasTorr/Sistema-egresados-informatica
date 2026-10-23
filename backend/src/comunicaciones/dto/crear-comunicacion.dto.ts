import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CanalComunicacion } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const recortar = ({ value }) => (typeof value === 'string' ? value.trim() : value);

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

  @ApiPropertyOptional({ description: 'Solo para egresados de esta especialidad (vacío = todas)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_especialidad?: number;

  @ApiPropertyOptional({ description: 'Solo para egresados de este año de egreso (vacío = todos)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio_egreso?: number;
}

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EstadoLaboral, RangoSueldo } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const recortar = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export class SituacionLaboralDto {
  @ApiProperty({ enum: EstadoLaboral, example: EstadoLaboral.EMPLEADO })
  @IsEnum(EstadoLaboral, {
    message: `estado_laboral debe ser uno de: ${Object.values(EstadoLaboral).join(', ')}`,
  })
  estado_laboral: EstadoLaboral;

  @ApiPropertyOptional({ example: 'Empresa SpA' })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(150)
  empresa?: string;

  @ApiPropertyOptional({ example: 'Desarrollador Backend' })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120)
  cargo?: string;

  @ApiPropertyOptional({ enum: RangoSueldo })
  @IsOptional()
  @IsEnum(RangoSueldo, {
    message: `rango_sueldo debe ser uno de: ${Object.values(RangoSueldo).join(', ')}`,
  })
  rango_sueldo?: RangoSueldo;

  @ApiPropertyOptional({ example: '2025-03-01', description: 'Formato AAAA-MM-DD' })
  @IsOptional()
  @IsDateString({}, { message: 'fecha_inicio debe tener formato AAAA-MM-DD' })
  fecha_inicio?: string;

  @ApiPropertyOptional({ example: '2026-02-28', description: 'Formato AAAA-MM-DD' })
  @IsOptional()
  @IsDateString({}, { message: 'fecha_termino debe tener formato AAAA-MM-DD' })
  fecha_termino?: string;
}

export class ActualizarSituacionLaboralDto extends PartialType(SituacionLaboralDto) {}

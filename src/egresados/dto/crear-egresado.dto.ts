import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsRut, normalizarRut } from '../../common/validators/rut.validator';
import { CorreoDto, TelefonoDto } from './contacto.dto';
import { SituacionLaboralDto } from './situacion-laboral.dto';

const recortar = ({ value }) => (typeof value === 'string' ? value.trim() : value);
const ANIO_MAX = new Date().getFullYear() + 1;

export class DatosPersonalesDto {
  @ApiProperty({ example: '12.345.678-5', description: 'Se guarda como 12345678-5' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizarRut(value) : value))
  @IsRut()
  rut: string;

  @ApiProperty({ example: 'Juan Andrés' })
  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'nombres es obligatorio' })
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'apellido_paterno es obligatorio' })
  @MaxLength(60)
  apellido_paterno: string;

  @ApiPropertyOptional({ example: 'González' })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(60)
  apellido_materno?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_especialidad?: number;

  @ApiPropertyOptional({ example: 'Concepción' })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(100)
  ciudad_residencia?: string;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(ANIO_MAX)
  anio_ingreso?: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(ANIO_MAX)
  anio_egreso?: number;
}

export class CrearEgresadoDto extends DatosPersonalesDto {
  @ApiPropertyOptional({
    type: [CorreoDto],
    description: 'Se exige al menos un correo o un teléfono',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CorreoDto)
  correos?: CorreoDto[];

  @ApiPropertyOptional({ type: [TelefonoDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => TelefonoDto)
  telefonos?: TelefonoDto[];

  @ApiProperty({ type: SituacionLaboralDto, description: 'Situación laboral actual (obligatoria)' })
  @ValidateNested()
  @Type(() => SituacionLaboralDto)
  situacion_laboral: SituacionLaboralDto;

  @ApiPropertyOptional({
    minLength: 8,
    description:
      'Si se envía, se crea también la cuenta del egresado (rol EGRESADO) usando su correo principal, ' +
      'para que pueda iniciar sesión.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  contrasena_inicial?: string;
}

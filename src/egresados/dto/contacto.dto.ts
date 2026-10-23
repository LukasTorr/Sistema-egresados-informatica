import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TipoCorreo, TipoTelefono } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, Matches, MaxLength } from 'class-validator';

const recortar = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export class CorreoDto {
  @ApiProperty({ example: 'juan.perez@gmail.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'correo debe ser un correo válido' })
  @MaxLength(150)
  correo: string;

  @ApiPropertyOptional({ enum: TipoCorreo, default: TipoCorreo.PERSONAL })
  @IsOptional()
  @IsEnum(TipoCorreo)
  tipo?: TipoCorreo;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}

export class TelefonoDto {
  @ApiProperty({ example: '+56912345678' })
  @Transform(recortar)
  @Matches(/^\+?[0-9 ]{8,15}$/, {
    message: 'telefono debe tener entre 8 y 15 dígitos (puede empezar con +)',
  })
  telefono: string;

  @ApiPropertyOptional({ enum: TipoTelefono, default: TipoTelefono.MOVIL })
  @IsOptional()
  @IsEnum(TipoTelefono)
  tipo?: TipoTelefono;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}

export class ActualizarCorreoDto extends PartialType(CorreoDto) {}
export class ActualizarTelefonoDto extends PartialType(TelefonoDto) {}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsRut, normalizarRut } from '../../common/validators/rut.validator';

export class ActivarCuentaDto {
  @ApiProperty({ example: '12.345.678-5', description: 'RUT con el que la Secretaría registró al egresado' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizarRut(value) : value))
  @IsRut()
  rut: string;

  @ApiProperty({ example: 'camila.rojas@gmail.com', description: 'Uno de los correos que la Secretaría registró' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'correo debe ser un correo válido' })
  correo: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  contrasena: string;
}

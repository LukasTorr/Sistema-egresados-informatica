import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@icci.cl' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'correo debe ser un correo válido' })
  correo: string;

  @ApiProperty({ example: 'Admin1234' })
  @IsString()
  @MinLength(6)
  contrasena: string;
}

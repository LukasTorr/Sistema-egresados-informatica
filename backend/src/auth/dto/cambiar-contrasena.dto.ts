import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CambiarContrasenaDto {
  @ApiProperty()
  @IsString()
  contrasena_actual: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  contrasena_nueva: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EspecialidadDto {
  @ApiProperty({ example: 'Ingeniería Civil en Computación e Informática' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;
}

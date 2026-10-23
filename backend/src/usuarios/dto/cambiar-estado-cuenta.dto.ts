import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoCuentaDto {
  @ApiProperty({ description: 'false impide iniciar sesión con esta cuenta' })
  @IsBoolean()
  activo: boolean;
}

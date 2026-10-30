import { ApiProperty } from '@nestjs/swagger';
import { RolCuenta } from '@prisma/client';

class UsuarioLoginDto {
  @ApiProperty() id_cuenta: number;
  @ApiProperty() correo: string;
  @ApiProperty({ enum: RolCuenta }) rol: RolCuenta;
  @ApiProperty({ required: false }) id_egresado?: number;
  @ApiProperty({ required: false }) id_funcionario?: number;
  @ApiProperty({ description: 'true si debe cambiar la contraseña inicial antes de usar el sistema' })
  debe_cambiar_contrasena: boolean;
}

export class LoginRespuestaDto {
  @ApiProperty({ description: 'Token JWT para el header Authorization: Bearer <token>' })
  access_token: string;

  @ApiProperty({ type: UsuarioLoginDto })
  usuario: UsuarioLoginDto;
}

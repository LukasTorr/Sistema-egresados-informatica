import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { UsuarioActual, UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { AuthService } from './auth.service';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { LoginDto } from './dto/login.dto';
import { LoginRespuestaDto } from './dto/login-respuesta.dto';

@ApiTags('HU-13 · Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida correo y contraseña y devuelve un token JWT con el rol del usuario ' +
      '(ADMINISTRADOR, FUNCIONARIO o EGRESADO). Las credenciales incorrectas responden 401.',
  })
  @ApiOkResponse({ type: LoginRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas o cuenta desactivada' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Get('perfil')
  @ApiOperation({ summary: 'Datos de la cuenta con la sesión iniciada' })
  perfil(@UsuarioActual() usuario: UsuarioToken) {
    return this.authService.perfil(usuario);
  }

  @ApiBearerAuth()
  @Patch('contrasena')
  @ApiOperation({ summary: 'Cambiar la contraseña propia' })
  cambiarContrasena(
    @UsuarioActual() usuario: UsuarioToken,
    @Body() dto: CambiarContrasenaDto,
  ) {
    return this.authService.cambiarContrasena(usuario, dto);
  }
}

import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolCuenta } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual, UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { CambiarEstadoCuentaDto } from './dto/cambiar-estado-cuenta.dto';
import { CrearFuncionarioDto } from './dto/crear-funcionario.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('HU-13 · Usuarios y roles')
@ApiBearerAuth()
@Roles(RolCuenta.ADMINISTRADOR)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('funcionarios')
  @ApiOperation({ summary: 'Crear cuenta de administrador o funcionario (solo ADMINISTRADOR)',
    description: 'La contraseña es inicial: el funcionario debe cambiarla la primera vez que inicia sesión.',
  })
  crearFuncionario(@Body() dto: CrearFuncionarioDto) {
    return this.usuariosService.crearFuncionario(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las cuentas (solo ADMINISTRADOR)' })
  listar() {
    return this.usuariosService.listar();
  }

  @Patch(':id_cuenta/estado')
  @ApiOperation({ summary: 'Activar o desactivar una cuenta (solo ADMINISTRADOR)' })
  cambiarEstado(
    @Param('id_cuenta', ParseIntPipe) id_cuenta: number,
    @Body() dto: CambiarEstadoCuentaDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.usuariosService.cambiarEstado(id_cuenta, dto.activo, usuario.sub);
  }
}

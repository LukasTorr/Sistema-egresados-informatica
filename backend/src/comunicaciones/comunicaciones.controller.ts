import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolCuenta } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual, UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { PaginacionDto } from '../common/utils/paginacion.dto';
import { ComunicacionesService } from './comunicaciones.service';
import { CrearComunicacionDto } from './dto/crear-comunicacion.dto';

@ApiTags('HU-04 · Comunicaciones a egresados')
@ApiBearerAuth()
@Controller('comunicaciones')
export class ComunicacionesController {
  constructor(private readonly comunicacionesService: ComunicacionesService) {}

  @Post()
  @Roles(RolCuenta.ADMINISTRADOR, RolCuenta.FUNCIONARIO)
  @ApiOperation({
    summary: 'Publicar una comunicación del departamento',
    description:
      'Queda disponible de inmediato para los egresados destinatarios. Se registra la fecha de publicación, ' +
      'quién la publicó y cuántos egresados la reciben.',
  })
  publicar(@Body() dto: CrearComunicacionDto, @UsuarioActual() usuario: UsuarioToken) {
    return this.comunicacionesService.publicar(dto, usuario);
  }

  @Get()
  @Roles(RolCuenta.ADMINISTRADOR, RolCuenta.FUNCIONARIO)
  @ApiOperation({ summary: 'Registro de todas las comunicaciones publicadas' })
  listar(@Query() paginacion: PaginacionDto) {
    return this.comunicacionesService.listar(paginacion);
  }

  @Get('mis-comunicaciones')
  @Roles(RolCuenta.EGRESADO)
  @ApiOperation({ summary: 'El egresado ve las comunicaciones dirigidas a él' })
  misComunicaciones(@UsuarioActual() usuario: UsuarioToken, @Query() paginacion: PaginacionDto) {
    return this.comunicacionesService.misComunicaciones(usuario, paginacion);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una comunicación' })
  obtener(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: UsuarioToken) {
    return this.comunicacionesService.obtener(id, usuario);
  }
}

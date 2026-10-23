import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolCuenta } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual, UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { ActualizarEgresadoDto, ActualizarMiPerfilDto } from './dto/actualizar-egresado.dto';
import {
  ActualizarCorreoDto,
  ActualizarTelefonoDto,
  CorreoDto,
  TelefonoDto,
} from './dto/contacto.dto';
import { CrearEgresadoDto } from './dto/crear-egresado.dto';
import { FiltroEgresadosDto } from './dto/filtro-egresados.dto';
import {
  ActualizarSituacionLaboralDto,
  SituacionLaboralDto,
} from './dto/situacion-laboral.dto';
import { EgresadosService } from './egresados.service';

const GESTION = [RolCuenta.ADMINISTRADOR, RolCuenta.FUNCIONARIO];

@ApiBearerAuth()
@Controller('egresados')
export class EgresadosController {
  constructor(private readonly egresadosService: EgresadosService) {}

  // ----- Perfil propio (rol EGRESADO). Va antes de ':id' para que no choque. -----

  @Get('me')
  @Roles(RolCuenta.EGRESADO)
  @ApiTags('HU-02 · Consultar y actualizar egresados')
  @ApiOperation({ summary: 'El egresado consulta su propio perfil' })
  miPerfil(@UsuarioActual() usuario: UsuarioToken) {
    return this.egresadosService.obtener(this.egresadosService.idPropio(usuario));
  }

  @Patch('me')
  @Roles(RolCuenta.EGRESADO)
  @ApiTags('HU-02 · Consultar y actualizar egresados')
  @ApiOperation({
    summary: 'El egresado actualiza su ciudad o apellido materno',
    description:
      'Para correos, teléfonos y situación laboral usa los endpoints /egresados/{id}/... con tu propio id.',
  })
  actualizarMiPerfil(@UsuarioActual() usuario: UsuarioToken, @Body() dto: ActualizarMiPerfilDto) {
    return this.egresadosService.actualizar(this.egresadosService.idPropio(usuario), dto, usuario);
  }

  // ----- HU-01 -----

  @Post()
  @Roles(...GESTION)
  @ApiTags('HU-01 · Registrar egresado')
  @ApiOperation({
    summary: 'Registrar egresado con datos personales, de contacto y situación laboral',
    description:
      'Obligatorios: rut, nombres, apellido_paterno, al menos un correo o teléfono, y situacion_laboral.estado_laboral. ' +
      'Si se envía contrasena_inicial se crea la cuenta del egresado para que pueda iniciar sesión.',
  })
  @ApiBadRequestResponse({ description: 'Datos obligatorios faltantes o con formato inválido' })
  crear(@Body() dto: CrearEgresadoDto, @UsuarioActual() usuario: UsuarioToken) {
    return this.egresadosService.crear(dto, usuario);
  }

  // ----- HU-02 -----

  @Get()
  @Roles(...GESTION)
  @ApiTags('HU-02 · Consultar y actualizar egresados')
  @ApiOperation({ summary: 'Listar y buscar egresados (paginado)' })
  listar(@Query() filtro: FiltroEgresadosDto) {
    return this.egresadosService.listar(filtro);
  }

  @Get(':id')
  @ApiTags('HU-02 · Consultar y actualizar egresados')
  @ApiOperation({ summary: 'Ver el detalle completo de un egresado' })
  obtener(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: UsuarioToken) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.obtener(id);
  }

  @Patch(':id')
  @Roles(...GESTION)
  @ApiTags('HU-02 · Consultar y actualizar egresados')
  @ApiOperation({
    summary: 'Modificar datos personales de un egresado',
    description: 'Solo se guardan los campos enviados. Cada cambio queda en el historial (movimiento_perfil).',
  })
  @ApiConflictResponse({ description: 'El RUT nuevo ya pertenece a otro egresado' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEgresadoDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.egresadosService.actualizar(id, dto, usuario);
  }

  @Get(':id/historial')
  @Roles(...GESTION)
  @ApiTags('HU-02 · Consultar y actualizar egresados')
  @ApiOperation({ summary: 'Historial de cambios del perfil (quién cambió qué y cuándo)' })
  historial(@Param('id', ParseIntPipe) id: number) {
    return this.egresadosService.historial(id);
  }

  // ----- Correos -----

  @Post(':id/correos')
  @ApiTags('Egresados · Contacto')
  @ApiOperation({ summary: 'Agregar correo' })
  agregarCorreo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorreoDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.agregarCorreo(id, dto, usuario);
  }

  @Patch(':id/correos/:id_correo')
  @ApiTags('Egresados · Contacto')
  @ApiOperation({ summary: 'Modificar correo o marcarlo como principal' })
  actualizarCorreo(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_correo', ParseIntPipe) id_correo: number,
    @Body() dto: ActualizarCorreoDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.actualizarCorreo(id, id_correo, dto, usuario);
  }

  @Delete(':id/correos/:id_correo')
  @ApiTags('Egresados · Contacto')
  @ApiOperation({ summary: 'Eliminar correo (debe quedar al menos un contacto)' })
  eliminarCorreo(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_correo', ParseIntPipe) id_correo: number,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.eliminarCorreo(id, id_correo, usuario);
  }

  // ----- Teléfonos -----

  @Post(':id/telefonos')
  @ApiTags('Egresados · Contacto')
  @ApiOperation({ summary: 'Agregar teléfono' })
  agregarTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TelefonoDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.agregarTelefono(id, dto, usuario);
  }

  @Patch(':id/telefonos/:id_telefono')
  @ApiTags('Egresados · Contacto')
  @ApiOperation({ summary: 'Modificar teléfono o marcarlo como principal' })
  actualizarTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_telefono', ParseIntPipe) id_telefono: number,
    @Body() dto: ActualizarTelefonoDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.actualizarTelefono(id, id_telefono, dto, usuario);
  }

  @Delete(':id/telefonos/:id_telefono')
  @ApiTags('Egresados · Contacto')
  @ApiOperation({ summary: 'Eliminar teléfono (debe quedar al menos un contacto)' })
  eliminarTelefono(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_telefono', ParseIntPipe) id_telefono: number,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.eliminarTelefono(id, id_telefono, usuario);
  }

  // ----- Situación laboral -----

  @Get(':id/situaciones-laborales')
  @ApiTags('Egresados · Situación laboral')
  @ApiOperation({ summary: 'Historial de situaciones laborales (la actual primero)' })
  listarSituaciones(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: UsuarioToken) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.listarSituaciones(id);
  }

  @Post(':id/situaciones-laborales')
  @ApiTags('Egresados · Situación laboral')
  @ApiOperation({
    summary: 'Registrar nueva situación laboral actual',
    description: 'La situación actual anterior pasa al historial (es_actual = false).',
  })
  agregarSituacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SituacionLaboralDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.agregarSituacion(id, dto, usuario);
  }

  @Patch(':id/situaciones-laborales/:id_situacion')
  @ApiTags('Egresados · Situación laboral')
  @ApiOperation({ summary: 'Corregir una situación laboral existente' })
  actualizarSituacion(
    @Param('id', ParseIntPipe) id: number,
    @Param('id_situacion', ParseIntPipe) id_situacion: number,
    @Body() dto: ActualizarSituacionLaboralDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    this.egresadosService.verificarAcceso(usuario, id);
    return this.egresadosService.actualizarSituacion(id, id_situacion, dto, usuario);
  }
}

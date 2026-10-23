import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolCuenta } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { EspecialidadDto } from './dto/especialidad.dto';
import { EspecialidadesService } from './especialidades.service';

@ApiTags('Especialidades')
@ApiBearerAuth()
@Controller('especialidades')
export class EspecialidadesController {
  constructor(private readonly especialidadesService: EspecialidadesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar especialidades (cualquier usuario con sesión)' })
  listar() {
    return this.especialidadesService.listar();
  }

  @Post()
  @Roles(RolCuenta.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear especialidad (solo ADMINISTRADOR)' })
  crear(@Body() dto: EspecialidadDto) {
    return this.especialidadesService.crear(dto);
  }

  @Patch(':id_especialidad')
  @Roles(RolCuenta.ADMINISTRADOR)
  @ApiOperation({ summary: 'Renombrar especialidad (solo ADMINISTRADOR)' })
  actualizar(
    @Param('id_especialidad', ParseIntPipe) id_especialidad: number,
    @Body() dto: EspecialidadDto,
  ) {
    return this.especialidadesService.actualizar(id_especialidad, dto);
  }
}

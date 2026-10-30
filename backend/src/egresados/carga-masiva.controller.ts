import {
  Controller,
  Get,
  Header,
  ParseBoolPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RolCuenta } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual, UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { CargaMasivaService, COLUMNAS_CSV } from './carga-masiva.service';
import { ResultadoCargaDto } from './dto/resultado-carga.dto';

@ApiTags('HU-03 · Carga masiva de egresados')
@ApiBearerAuth()
@Roles(RolCuenta.ADMINISTRADOR, RolCuenta.FUNCIONARIO)
@Controller('egresados/carga-masiva')
export class CargaMasivaController {
  constructor(private readonly cargaMasivaService: CargaMasivaService) {}

  @Get('plantilla')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="plantilla_egresados.csv"')
  @ApiProduces('text/csv')
  @ApiOperation({
    summary: 'Descargar la plantilla CSV con el formato definido',
    description: `Columnas (separadas por ";" o ","): ${COLUMNAS_CSV.join(', ')}`,
  })
  plantilla() {
    return this.cargaMasivaService.plantilla();
  }

  @Post()
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo'],
      properties: { archivo: { type: 'string', format: 'binary', description: 'Archivo .csv (máx. 5 MB)' } },
    },
  })
  @ApiQuery({
    name: 'simulacion',
    required: false,
    type: Boolean,
    description: 'true = solo valida y reporta errores, sin guardar nada',
  })
  @ApiOperation({
    summary: 'Cargar egresados desde un CSV',
    description:
      'Las filas válidas se guardan; las filas con errores se devuelven en "errores" con su número de fila ' +
      'y el detalle, para que el administrador las corrija y vuelva a subirlas.',
  })
  @ApiOkResponse({ type: ResultadoCargaDto })
  cargar(
    @UploadedFile() archivo: Express.Multer.File,
    @UsuarioActual() usuario: UsuarioToken,
    @Query('simulacion', new ParseBoolPipe({ optional: true })) simulacion = false,
  ) {
    return this.cargaMasivaService.procesar(archivo, usuario, simulacion);
  }
}

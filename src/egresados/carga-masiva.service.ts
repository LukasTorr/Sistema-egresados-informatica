import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { parse } from 'csv-parse/sync';
import { UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { normalizarRut } from '../common/validators/rut.validator';
import { PrismaService } from '../prisma/prisma.service';
import { CrearEgresadoDto } from './dto/crear-egresado.dto';
import { ErrorFilaDto, ResultadoCargaDto } from './dto/resultado-carga.dto';
import { EgresadosService } from './egresados.service';

/** Columnas del archivo CSV (formato definido para la carga inicial). */
export const COLUMNAS_CSV = [
  'rut',
  'nombres',
  'apellido_paterno',
  'apellido_materno',
  'especialidad',
  'anio_ingreso',
  'anio_egreso',
  'ciudad_residencia',
  'correo',
  'telefono',
  'estado_laboral',
  'empresa',
  'cargo',
  'rango_sueldo',
] as const;

const COLUMNAS_OBLIGATORIAS = ['rut', 'nombres', 'apellido_paterno', 'estado_laboral'];

type FilaCsv = Partial<Record<(typeof COLUMNAS_CSV)[number], string>>;

@Injectable()
export class CargaMasivaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly egresadosService: EgresadosService,
  ) {}

  plantilla(): string {
    const ejemplo = [
      '12.345.678-5',
      'Juan Andrés',
      'Pérez',
      'González',
      'Ingeniería Civil en Computación e Informática',
      '2018',
      '2024',
      'Concepción',
      'juan.perez@gmail.com',
      '+56912345678',
      'EMPLEADO',
      'Empresa SpA',
      'Desarrollador Backend',
      'ENTRE_1M_1_5M',
    ];
    // BOM para que Excel abra bien los acentos
    return '﻿' + [COLUMNAS_CSV.join(';'), ejemplo.join(';')].join('\r\n') + '\r\n';
  }

  async procesar(
    archivo: Express.Multer.File | undefined,
    autor: UsuarioToken,
    simulacion: boolean,
  ): Promise<ResultadoCargaDto> {
    if (!archivo) throw new BadRequestException('Debe adjuntar un archivo CSV en el campo "archivo"');
    if (!/\.csv$/i.test(archivo.originalname)) {
      throw new BadRequestException('El archivo debe tener extensión .csv');
    }

    const filas = this.leerCsv(archivo.buffer);
    const especialidades = await this.prisma.especialidad.findMany();
    const especialidadPorNombre = new Map(
      especialidades.map((e) => [this.normalizarTexto(e.nombre), e.id_especialidad]),
    );

    const errores: ErrorFilaDto[] = [];
    const rutsEnArchivo = new Map<string, number>();
    const correosEnArchivo = new Map<string, number>();
    let insertados = 0;

    for (const [i, fila] of filas.entries()) {
      const numeroFila = i + 2; // +1 por el encabezado, +1 porque Excel parte en 1
      const rut = fila.rut ? normalizarRut(fila.rut) : null;
      const erroresFila: string[] = [];

      // 1) Formato: se reutilizan las mismas validaciones del registro manual (HU-01)
      const { dto, errores: erroresMapeo } = this.filaADto(fila, especialidadPorNombre);
      erroresFila.push(...erroresMapeo);
      const instancia = plainToInstance(CrearEgresadoDto, dto);
      erroresFila.push(...this.aplanarErrores(await validate(instancia)));

      // 2) Duplicados dentro del mismo archivo
      if (rut && rutsEnArchivo.has(rut)) {
        erroresFila.push(`RUT repetido en el archivo (ya aparece en la fila ${rutsEnArchivo.get(rut)})`);
      }
      const correo = instancia.correos?.[0]?.correo;
      if (correo && correosEnArchivo.has(correo)) {
        erroresFila.push(`Correo repetido en el archivo (fila ${correosEnArchivo.get(correo)})`);
      }

      // 3) Reglas de negocio contra la base de datos (RUT ya registrado, etc.)
      if (!erroresFila.length) {
        erroresFila.push(...(await this.egresadosService.validarRegistro(instancia)));
      }

      if (rut && !rutsEnArchivo.has(rut)) rutsEnArchivo.set(rut, numeroFila);
      if (correo && !correosEnArchivo.has(correo)) correosEnArchivo.set(correo, numeroFila);

      if (erroresFila.length) {
        errores.push({ fila: numeroFila, rut, errores: erroresFila });
        continue;
      }

      if (!simulacion) {
        try {
          await this.prisma.$transaction((tx) =>
            this.egresadosService.crearEnTransaccion(tx, instancia, autor),
          );
        } catch (e) {
          errores.push({
            fila: numeroFila,
            rut,
            errores: [`No se pudo guardar: ${(e as Error).message.split('\n').pop()}`],
          });
          continue;
        }
      }
      insertados++;
    }

    return {
      simulacion,
      total_filas: filas.length,
      insertados,
      con_errores: errores.length,
      errores,
    };
  }

  private leerCsv(buffer: Buffer): FilaCsv[] {
    const texto = buffer.toString('utf8').replace(/^﻿/, '');
    const primeraLinea = texto.split(/\r?\n/, 1)[0] ?? '';
    // Excel en español guarda los CSV con ";" en vez de ","
    const delimitador = primeraLinea.split(';').length > primeraLinea.split(',').length ? ';' : ',';

    let filas: FilaCsv[];
    try {
      filas = parse(texto, {
        delimiter: delimitador,
        columns: (encabezados: string[]) =>
          encabezados.map((h) => this.normalizarTexto(h).replace(/\s+/g, '_')),
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (e) {
      throw new BadRequestException(`No se pudo leer el CSV: ${(e as Error).message}`);
    }

    if (!filas.length) throw new BadRequestException('El archivo no contiene filas de datos');
    const faltantes = COLUMNAS_OBLIGATORIAS.filter((c) => !(c in filas[0]));
    if (faltantes.length) {
      throw new BadRequestException(
        `Faltan columnas obligatorias: ${faltantes.join(', ')}. ` +
          `Descarga la plantilla en GET /api/egresados/carga-masiva/plantilla`,
      );
    }
    if (!('correo' in filas[0]) && !('telefono' in filas[0])) {
      throw new BadRequestException('El archivo debe tener la columna correo o telefono');
    }
    return filas;
  }

  private filaADto(fila: FilaCsv, especialidades: Map<string, number>) {
    const errores: string[] = [];
    const valor = (campo: keyof FilaCsv) => fila[campo]?.trim() || undefined;
    const numero = (campo: keyof FilaCsv) => {
      const v = valor(campo);
      if (v === undefined) return undefined;
      if (!/^\d+$/.test(v)) {
        errores.push(`${campo} debe ser un número entero`);
        return undefined;
      }
      return Number(v);
    };

    let id_especialidad: number | undefined;
    const especialidad = valor('especialidad');
    if (especialidad) {
      id_especialidad = /^\d+$/.test(especialidad)
        ? Number(especialidad)
        : especialidades.get(this.normalizarTexto(especialidad));
      if (id_especialidad === undefined) {
        errores.push(`La especialidad "${especialidad}" no existe`);
      }
    }

    const correo = valor('correo');
    const telefono = valor('telefono');
    const dto = {
      rut: valor('rut'),
      nombres: valor('nombres'),
      apellido_paterno: valor('apellido_paterno'),
      apellido_materno: valor('apellido_materno'),
      id_especialidad,
      anio_ingreso: numero('anio_ingreso'),
      anio_egreso: numero('anio_egreso'),
      ciudad_residencia: valor('ciudad_residencia'),
      correos: correo ? [{ correo, es_principal: true }] : [],
      telefonos: telefono ? [{ telefono, es_principal: true }] : [],
      situacion_laboral: {
        estado_laboral: valor('estado_laboral')?.toUpperCase(),
        empresa: valor('empresa'),
        cargo: valor('cargo'),
        rango_sueldo: valor('rango_sueldo')?.toUpperCase(),
      },
    };
    return { dto, errores };
  }

  private aplanarErrores(errores: ValidationError[], prefijo = ''): string[] {
    return errores.flatMap((e) => {
      const ruta = prefijo ? `${prefijo}.${e.property}` : e.property;
      const propios = Object.values(e.constraints ?? {});
      return [...propios, ...this.aplanarErrores(e.children ?? [], ruta)];
    });
  }

  private normalizarTexto(texto: string) {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase();
  }
}

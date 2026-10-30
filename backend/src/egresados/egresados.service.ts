import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoPerfil, Prisma, RolCuenta } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarCorreoDto,
  ActualizarTelefonoDto,
  CorreoDto,
  TelefonoDto,
} from './dto/contacto.dto';
import { ActualizarEgresadoDto, ActualizarMiPerfilDto } from './dto/actualizar-egresado.dto';
import { CrearEgresadoDto } from './dto/crear-egresado.dto';
import { FiltroEgresadosDto } from './dto/filtro-egresados.dto';
import {
  ActualizarSituacionLaboralDto,
  SituacionLaboralDto,
} from './dto/situacion-laboral.dto';

const INCLUDE_DETALLE = {
  especialidad: true,
  correos: { orderBy: [{ es_principal: 'desc' }, { id_correo: 'asc' }] },
  telefonos: { orderBy: [{ es_principal: 'desc' }, { id_telefono: 'asc' }] },
  situaciones: { orderBy: [{ es_actual: 'desc' }, { fecha_inicio: 'desc' }] },
  cuenta: { select: { id_cuenta: true, correo: true, activo: true } },
} satisfies Prisma.egresadoInclude;

const CAMPOS_AUDITADOS = [
  'rut',
  'nombres',
  'apellido_paterno',
  'apellido_materno',
  'id_especialidad',
  'ciudad_residencia',
  'anio_ingreso',
  'anio_egreso',
  'estado_perfil',
] as const;

type Tx = Prisma.TransactionClient;

@Injectable()
export class EgresadosService {
  constructor(private readonly prisma: PrismaService) {}

  // HU-01: registrar
  async validarRegistro(dto: CrearEgresadoDto, tx: Tx = this.prisma): Promise<string[]> {
    const errores: string[] = [];
    if (!dto.correos?.length && !dto.telefonos?.length) {
      errores.push('Debe indicar al menos un correo o un teléfono de contacto');
    }
    if (dto.anio_ingreso && dto.anio_egreso && dto.anio_egreso < dto.anio_ingreso) {
      errores.push('anio_egreso no puede ser anterior a anio_ingreso');
    }
    if (dto.contrasena_inicial && !dto.correos?.length) {
      errores.push('Para crear la cuenta del egresado se necesita al menos un correo');
    }
    if (await tx.egresado.findUnique({ where: { rut: dto.rut } })) {
      errores.push(`Ya existe un egresado con RUT ${dto.rut}`);
    }
    if (
      dto.id_especialidad &&
      !(await tx.especialidad.findUnique({ where: { id_especialidad: dto.id_especialidad } }))
    ) {
      errores.push(`La especialidad ${dto.id_especialidad} no existe`);
    }
    if (dto.contrasena_inicial && dto.correos?.length) {
      const correoCuenta = this.correoPrincipal(dto.correos);
      if (await tx.cuenta.findUnique({ where: { correo: correoCuenta } })) {
        errores.push(`Ya existe una cuenta con el correo ${correoCuenta}`);
      }
    }
    return errores;
  }

  async crear(dto: CrearEgresadoDto, autor?: UsuarioToken) {
    const errores = await this.validarRegistro(dto);
    if (errores.length) throw new BadRequestException(errores);

    return this.prisma.$transaction((tx) => this.crearEnTransaccion(tx, dto, autor));
  }

  async crearEnTransaccion(tx: Tx, dto: CrearEgresadoDto, autor?: UsuarioToken) {
    const { correos = [], telefonos = [], situacion_laboral, contrasena_inicial, ...datos } = dto;

    let id_cuenta: number | undefined;
    if (contrasena_inicial) {
      const cuenta = await tx.cuenta.create({
        data: {
          correo: this.correoPrincipal(correos),
          contrasena_hash: await AuthService.hashContrasena(contrasena_inicial),
          rol: RolCuenta.EGRESADO,
          debe_cambiar_contrasena: true,
        },
      });
      id_cuenta = cuenta.id_cuenta;
    }

    const egresado = await tx.egresado.create({
      data: {
        ...datos,
        id_cuenta,
        estado_perfil: this.calcularEstadoPerfil(datos),
        correos: { create: this.marcarPrincipal(correos) },
        telefonos: { create: this.marcarPrincipal(telefonos) },
        situaciones: { create: { ...this.situacionAPrisma(situacion_laboral), es_actual: true } },
      },
      include: INCLUDE_DETALLE,
    });

    await tx.movimiento_perfil.create({
      data: {
        id_egresado: egresado.id_egresado,
        id_cuenta_autor: autor?.sub,
        campo: 'registro',
        valor_nuevo: 'Egresado registrado',
      },
    });
    return egresado;
  }

  // HU-02: consultar
  async listar(filtro: FiltroEgresadosDto) {
    const where: Prisma.egresadoWhereInput = {
      id_especialidad: filtro.id_especialidad,
      anio_egreso: filtro.anio_egreso,
      estado_perfil: filtro.estado_perfil,
    };
    if (filtro.estado_laboral) {
      where.situaciones = { some: { es_actual: true, estado_laboral: filtro.estado_laboral } };
    }
    if (filtro.busqueda?.trim()) {
      const texto = filtro.busqueda.trim();
      where.OR = [
        { rut: { contains: texto.replace(/\./g, '') } },
        { nombres: { contains: texto } },
        { apellido_paterno: { contains: texto } },
        { apellido_materno: { contains: texto } },
      ];
    }

    const [total, datos] = await this.prisma.$transaction([
      this.prisma.egresado.count({ where }),
      this.prisma.egresado.findMany({
        where,
        include: {
          especialidad: true,
          correos: { where: { es_principal: true } },
          telefonos: { where: { es_principal: true } },
          situaciones: { where: { es_actual: true } },
        },
        orderBy: [{ apellido_paterno: 'asc' }, { nombres: 'asc' }],
        skip: (filtro.pagina - 1) * filtro.por_pagina,
        take: filtro.por_pagina,
      }),
    ]);

    return {
      total,
      pagina: filtro.pagina,
      por_pagina: filtro.por_pagina,
      total_paginas: Math.ceil(total / filtro.por_pagina),
      datos,
    };
  }

  async obtener(id_egresado: number) {
    const egresado = await this.prisma.egresado.findUnique({
      where: { id_egresado },
      include: INCLUDE_DETALLE,
    });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    return egresado;
  }

  async historial(id_egresado: number) {
    await this.existeOFalla(id_egresado);
    return this.prisma.movimiento_perfil.findMany({
      where: { id_egresado },
      include: { autor: { select: { id_cuenta: true, correo: true, rol: true } } },
      orderBy: { fecha: 'desc' },
    });
  }

  // HU-02: actualizar
  async actualizar(
    id_egresado: number,
    dto: ActualizarEgresadoDto | ActualizarMiPerfilDto,
    autor: UsuarioToken,
  ) {
    const actual = await this.existeOFalla(id_egresado);
    const datos = dto as ActualizarEgresadoDto;

    if (datos.rut && datos.rut !== actual.rut) {
      if (await this.prisma.egresado.findUnique({ where: { rut: datos.rut } })) {
        throw new ConflictException(`Ya existe un egresado con RUT ${datos.rut}`);
      }
    }
    if (
      datos.id_especialidad &&
      !(await this.prisma.especialidad.findUnique({
        where: { id_especialidad: datos.id_especialidad },
      }))
    ) {
      throw new BadRequestException(`La especialidad ${datos.id_especialidad} no existe`);
    }
    const ingreso = datos.anio_ingreso ?? actual.anio_ingreso;
    const egreso = datos.anio_egreso ?? actual.anio_egreso;
    if (ingreso && egreso && egreso < ingreso) {
      throw new BadRequestException('anio_egreso no puede ser anterior a anio_ingreso');
    }

    const cambios = CAMPOS_AUDITADOS.filter(
      (campo) => datos[campo] !== undefined && datos[campo] !== actual[campo],
    );
    if (!cambios.length) return this.obtener(id_egresado);

    return this.prisma.$transaction(async (tx) => {
      await tx.movimiento_perfil.createMany({
        data: cambios.map((campo) => ({
          id_egresado,
          id_cuenta_autor: autor.sub,
          campo,
          valor_anterior: actual[campo]?.toString() ?? null,
          valor_nuevo: datos[campo]?.toString() ?? null,
        })),
      });
      return tx.egresado.update({
        where: { id_egresado },
        data: Object.fromEntries(cambios.map((campo) => [campo, datos[campo]])),
        include: INCLUDE_DETALLE,
      });
    });
  }

  async agregarCorreo(id_egresado: number, dto: CorreoDto, autor: UsuarioToken) {
    await this.existeOFalla(id_egresado);
    const repetido = await this.prisma.egresado_correo.findUnique({
      where: { id_egresado_correo: { id_egresado, correo: dto.correo } },
    });
    if (repetido) throw new ConflictException('El egresado ya tiene registrado ese correo');

    const cantidad = await this.prisma.egresado_correo.count({ where: { id_egresado } });
    return this.prisma.$transaction(async (tx) => {
      const es_principal = dto.es_principal || cantidad === 0;
      if (es_principal) {
        await tx.egresado_correo.updateMany({ where: { id_egresado }, data: { es_principal: false } });
      }
      await this.registrarMovimiento(tx, id_egresado, autor, 'correo', null, dto.correo);
      return tx.egresado_correo.create({ data: { ...dto, id_egresado, es_principal } });
    });
  }

  async actualizarCorreo(
    id_egresado: number,
    id_correo: number,
    dto: ActualizarCorreoDto,
    autor: UsuarioToken,
  ) {
    const actual = await this.prisma.egresado_correo.findFirst({ where: { id_correo, id_egresado } });
    if (!actual) throw new NotFoundException('Correo no encontrado para este egresado');
    if (dto.es_principal === false && actual.es_principal) {
      throw new BadRequestException('Marca otro correo como principal en lugar de desmarcar este');
    }
    if (dto.correo && dto.correo !== actual.correo) {
      const repetido = await this.prisma.egresado_correo.findUnique({
        where: { id_egresado_correo: { id_egresado, correo: dto.correo } },
      });
      if (repetido) throw new ConflictException('El egresado ya tiene registrado ese correo');
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.es_principal) {
        await tx.egresado_correo.updateMany({ where: { id_egresado }, data: { es_principal: false } });
      }
      if (dto.correo && dto.correo !== actual.correo) {
        await this.registrarMovimiento(tx, id_egresado, autor, 'correo', actual.correo, dto.correo);
      }
      return tx.egresado_correo.update({ where: { id_correo }, data: dto });
    });
  }

  async eliminarCorreo(id_egresado: number, id_correo: number, autor: UsuarioToken) {
    const actual = await this.prisma.egresado_correo.findFirst({ where: { id_correo, id_egresado } });
    if (!actual) throw new NotFoundException('Correo no encontrado para este egresado');
    await this.verificarQuedaContacto(id_egresado);

    return this.prisma.$transaction(async (tx) => {
      await tx.egresado_correo.delete({ where: { id_correo } });
      if (actual.es_principal) {
        const siguiente = await tx.egresado_correo.findFirst({ where: { id_egresado } });
        if (siguiente) {
          await tx.egresado_correo.update({
            where: { id_correo: siguiente.id_correo },
            data: { es_principal: true },
          });
        }
      }
      await this.registrarMovimiento(tx, id_egresado, autor, 'correo', actual.correo, null);
      return { mensaje: 'Correo eliminado' };
    });
  }

  async agregarTelefono(id_egresado: number, dto: TelefonoDto, autor: UsuarioToken) {
    await this.existeOFalla(id_egresado);
    const repetido = await this.prisma.egresado_telefono.findUnique({
      where: { id_egresado_telefono: { id_egresado, telefono: dto.telefono } },
    });
    if (repetido) throw new ConflictException('El egresado ya tiene registrado ese teléfono');

    const cantidad = await this.prisma.egresado_telefono.count({ where: { id_egresado } });
    return this.prisma.$transaction(async (tx) => {
      const es_principal = dto.es_principal || cantidad === 0;
      if (es_principal) {
        await tx.egresado_telefono.updateMany({ where: { id_egresado }, data: { es_principal: false } });
      }
      await this.registrarMovimiento(tx, id_egresado, autor, 'telefono', null, dto.telefono);
      return tx.egresado_telefono.create({ data: { ...dto, id_egresado, es_principal } });
    });
  }

  async actualizarTelefono(
    id_egresado: number,
    id_telefono: number,
    dto: ActualizarTelefonoDto,
    autor: UsuarioToken,
  ) {
    const actual = await this.prisma.egresado_telefono.findFirst({
      where: { id_telefono, id_egresado },
    });
    if (!actual) throw new NotFoundException('Teléfono no encontrado para este egresado');
    if (dto.es_principal === false && actual.es_principal) {
      throw new BadRequestException('Marca otro teléfono como principal en lugar de desmarcar este');
    }
    if (dto.telefono && dto.telefono !== actual.telefono) {
      const repetido = await this.prisma.egresado_telefono.findUnique({
        where: { id_egresado_telefono: { id_egresado, telefono: dto.telefono } },
      });
      if (repetido) throw new ConflictException('El egresado ya tiene registrado ese teléfono');
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.es_principal) {
        await tx.egresado_telefono.updateMany({ where: { id_egresado }, data: { es_principal: false } });
      }
      if (dto.telefono && dto.telefono !== actual.telefono) {
        await this.registrarMovimiento(tx, id_egresado, autor, 'telefono', actual.telefono, dto.telefono);
      }
      return tx.egresado_telefono.update({ where: { id_telefono }, data: dto });
    });
  }

  async eliminarTelefono(id_egresado: number, id_telefono: number, autor: UsuarioToken) {
    const actual = await this.prisma.egresado_telefono.findFirst({
      where: { id_telefono, id_egresado },
    });
    if (!actual) throw new NotFoundException('Teléfono no encontrado para este egresado');
    await this.verificarQuedaContacto(id_egresado);

    return this.prisma.$transaction(async (tx) => {
      await tx.egresado_telefono.delete({ where: { id_telefono } });
      if (actual.es_principal) {
        const siguiente = await tx.egresado_telefono.findFirst({ where: { id_egresado } });
        if (siguiente) {
          await tx.egresado_telefono.update({
            where: { id_telefono: siguiente.id_telefono },
            data: { es_principal: true },
          });
        }
      }
      await this.registrarMovimiento(tx, id_egresado, autor, 'telefono', actual.telefono, null);
      return { mensaje: 'Teléfono eliminado' };
    });
  }

  async listarSituaciones(id_egresado: number) {
    await this.existeOFalla(id_egresado);
    return this.prisma.situacion_laboral.findMany({
      where: { id_egresado },
      orderBy: [{ es_actual: 'desc' }, { fecha_inicio: 'desc' }],
    });
  }

  async agregarSituacion(id_egresado: number, dto: SituacionLaboralDto, autor: UsuarioToken) {
    await this.existeOFalla(id_egresado);
    this.validarFechas(dto.fecha_inicio, dto.fecha_termino);

    return this.prisma.$transaction(async (tx) => {
      const anterior = await tx.situacion_laboral.findFirst({
        where: { id_egresado, es_actual: true },
      });
      if (anterior) {
        await tx.situacion_laboral.update({
          where: { id_situacion: anterior.id_situacion },
          data: {
            es_actual: false,
            fecha_termino: anterior.fecha_termino ?? new Date(),
          },
        });
      }
      await this.registrarMovimiento(
        tx,
        id_egresado,
        autor,
        'situacion_laboral',
        anterior ? `${anterior.estado_laboral} ${anterior.empresa ?? ''}`.trim() : null,
        `${dto.estado_laboral} ${dto.empresa ?? ''}`.trim(),
      );
      return tx.situacion_laboral.create({
        data: { ...this.situacionAPrisma(dto), id_egresado, es_actual: true },
      });
    });
  }

  async actualizarSituacion(
    id_egresado: number,
    id_situacion: number,
    dto: ActualizarSituacionLaboralDto,
    autor: UsuarioToken,
  ) {
    const actual = await this.prisma.situacion_laboral.findFirst({
      where: { id_situacion, id_egresado },
    });
    if (!actual) throw new NotFoundException('Situación laboral no encontrada para este egresado');
    this.validarFechas(
      dto.fecha_inicio ?? actual.fecha_inicio?.toISOString(),
      dto.fecha_termino ?? actual.fecha_termino?.toISOString(),
    );

    return this.prisma.$transaction(async (tx) => {
      await this.registrarMovimiento(
        tx,
        id_egresado,
        autor,
        'situacion_laboral',
        JSON.stringify({ estado_laboral: actual.estado_laboral, empresa: actual.empresa, cargo: actual.cargo }),
        JSON.stringify(dto),
      );
      return tx.situacion_laboral.update({
        where: { id_situacion },
        data: this.situacionAPrisma(dto),
      });
    });
  }

  verificarAcceso(usuario: UsuarioToken, id_egresado: number) {
    if (usuario.rol === RolCuenta.EGRESADO && usuario.id_egresado !== id_egresado) {
      throw new ForbiddenException('Solo puedes acceder a tus propios datos');
    }
  }

  idPropio(usuario: UsuarioToken): number {
    if (!usuario.id_egresado) {
      throw new NotFoundException('Tu cuenta no está asociada a un egresado');
    }
    return usuario.id_egresado;
  }

  private async existeOFalla(id_egresado: number) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id_egresado } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    return egresado;
  }

  private async verificarQuedaContacto(id_egresado: number) {
    const [correos, telefonos] = await Promise.all([
      this.prisma.egresado_correo.count({ where: { id_egresado } }),
      this.prisma.egresado_telefono.count({ where: { id_egresado } }),
    ]);
    if (correos + telefonos <= 1) {
      throw new BadRequestException('El egresado debe conservar al menos un medio de contacto');
    }
  }

  private registrarMovimiento(
    tx: Tx,
    id_egresado: number,
    autor: UsuarioToken | undefined,
    campo: string,
    valor_anterior: string | null,
    valor_nuevo: string | null,
  ) {
    return tx.movimiento_perfil.create({
      data: {
        id_egresado,
        id_cuenta_autor: autor?.sub,
        campo,
        valor_anterior: valor_anterior?.slice(0, 500),
        valor_nuevo: valor_nuevo?.slice(0, 500),
      },
    });
  }

  private marcarPrincipal<T extends { es_principal?: boolean }>(items: T[]): T[] {
    const indice = Math.max(0, items.findIndex((i) => i.es_principal));
    return items.map((item, i) => ({ ...item, es_principal: i === indice }));
  }

  private correoPrincipal(correos: CorreoDto[]): string {
    return (correos.find((c) => c.es_principal) ?? correos[0]).correo;
  }

  private calcularEstadoPerfil(datos: { id_especialidad?: number; anio_egreso?: number }) {
    return datos.id_especialidad && datos.anio_egreso
      ? EstadoPerfil.ACTIVO
      : EstadoPerfil.INCOMPLETO;
  }

  private validarFechas(inicio?: string, termino?: string) {
    if (inicio && termino && new Date(termino) < new Date(inicio)) {
      throw new BadRequestException('fecha_termino no puede ser anterior a fecha_inicio');
    }
  }

  private situacionAPrisma<T extends Partial<SituacionLaboralDto>>(dto: T) {
    return {
      ...dto,
      fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
      fecha_termino: dto.fecha_termino ? new Date(dto.fecha_termino) : undefined,
    };
  }
}

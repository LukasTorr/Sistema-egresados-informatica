import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoPerfil, Prisma, RolCuenta } from '@prisma/client';
import { UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { PaginacionDto } from '../common/utils/paginacion.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CrearComunicacionDto } from './dto/crear-comunicacion.dto';

const INCLUDE_COMUNICACION = {
  especialidad: true,
  autor: { select: { id_cuenta: true, correo: true } },
  funcionario: { select: { nombres: true, apellido_paterno: true, cargo: true } },
} satisfies Prisma.comunicacionInclude;

@Injectable()
export class ComunicacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async publicar(dto: CrearComunicacionDto, autor: UsuarioToken) {
    if (
      dto.id_especialidad &&
      !(await this.prisma.especialidad.findUnique({ where: { id_especialidad: dto.id_especialidad } }))
    ) {
      throw new BadRequestException(`La especialidad ${dto.id_especialidad} no existe`);
    }

    // Registro del envío: cuántos egresados quedan como destinatarios al momento de publicar
    const total_destinatarios = await this.prisma.egresado.count({
      where: {
        estado_perfil: { not: EstadoPerfil.INACTIVO },
        id_especialidad: dto.id_especialidad,
        anio_egreso: dto.anio_egreso,
      },
    });

    return this.prisma.comunicacion.create({
      data: {
        ...dto,
        id_cuenta_autor: autor.sub,
        id_funcionario: autor.id_funcionario,
        total_destinatarios,
      },
      include: INCLUDE_COMUNICACION,
    });
  }

  async listar(paginacion: PaginacionDto) {
    const [total, datos] = await this.prisma.$transaction([
      this.prisma.comunicacion.count(),
      this.prisma.comunicacion.findMany({
        include: INCLUDE_COMUNICACION,
        orderBy: { fecha_publicacion: 'desc' },
        skip: (paginacion.pagina - 1) * paginacion.por_pagina,
        take: paginacion.por_pagina,
      }),
    ]);
    return { total, pagina: paginacion.pagina, por_pagina: paginacion.por_pagina, datos };
  }

  /** Comunicaciones dirigidas al egresado con la sesión iniciada. */
  async misComunicaciones(usuario: UsuarioToken, paginacion: PaginacionDto) {
    const where = await this.filtroDestinatario(usuario);
    const [total, datos] = await this.prisma.$transaction([
      this.prisma.comunicacion.count({ where }),
      this.prisma.comunicacion.findMany({
        where,
        include: INCLUDE_COMUNICACION,
        orderBy: { fecha_publicacion: 'desc' },
        skip: (paginacion.pagina - 1) * paginacion.por_pagina,
        take: paginacion.por_pagina,
      }),
    ]);
    return { total, pagina: paginacion.pagina, por_pagina: paginacion.por_pagina, datos };
  }

  async obtener(id_comunicacion: number, usuario: UsuarioToken) {
    const where: Prisma.comunicacionWhereInput = { id_comunicacion };
    if (usuario.rol === RolCuenta.EGRESADO) {
      where.AND = [await this.filtroDestinatario(usuario)];
    }
    const comunicacion = await this.prisma.comunicacion.findFirst({
      where,
      include: INCLUDE_COMUNICACION,
    });
    if (!comunicacion) throw new NotFoundException('Comunicación no encontrada');
    return comunicacion;
  }

  private async filtroDestinatario(usuario: UsuarioToken): Promise<Prisma.comunicacionWhereInput> {
    if (!usuario.id_egresado) {
      throw new ForbiddenException('Tu cuenta no está asociada a un egresado');
    }
    const egresado = await this.prisma.egresado.findUniqueOrThrow({
      where: { id_egresado: usuario.id_egresado },
    });
    return {
      AND: [
        { OR: [{ id_especialidad: null }, { id_especialidad: egresado.id_especialidad ?? -1 }] },
        { OR: [{ anio_egreso: null }, { anio_egreso: egresado.anio_egreso ?? -1 }] },
      ],
    };
  }
}

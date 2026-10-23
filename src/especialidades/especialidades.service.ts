import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EspecialidadDto } from './dto/especialidad.dto';

@Injectable()
export class EspecialidadesService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.especialidad.findMany({ orderBy: { nombre: 'asc' } });
  }

  async crear(dto: EspecialidadDto) {
    await this.verificarNombreLibre(dto.nombre);
    return this.prisma.especialidad.create({ data: { nombre: dto.nombre.trim() } });
  }

  async actualizar(id_especialidad: number, dto: EspecialidadDto) {
    const actual = await this.prisma.especialidad.findUnique({ where: { id_especialidad } });
    if (!actual) throw new NotFoundException('Especialidad no encontrada');
    await this.verificarNombreLibre(dto.nombre, id_especialidad);
    return this.prisma.especialidad.update({
      where: { id_especialidad },
      data: { nombre: dto.nombre.trim() },
    });
  }

  private async verificarNombreLibre(nombre: string, excluirId?: number) {
    const existe = await this.prisma.especialidad.findUnique({ where: { nombre: nombre.trim() } });
    if (existe && existe.id_especialidad !== excluirId) {
      throw new ConflictException('Ya existe una especialidad con ese nombre');
    }
  }
}

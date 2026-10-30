import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrearFuncionarioDto } from './dto/crear-funcionario.dto';

const SELECT_CUENTA = {
  id_cuenta: true,
  correo: true,
  rol: true,
  activo: true,
  debe_cambiar_contrasena: true,
  fecha_verificacion: true,
  fecha_creacion: true,
  funcionario: true,
  egresado: { select: { id_egresado: true, rut: true, nombres: true, apellido_paterno: true } },
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async crearFuncionario(dto: CrearFuncionarioDto) {
    const existe = await this.prisma.cuenta.findUnique({ where: { correo: dto.correo } });
    if (existe) throw new ConflictException('Ya existe una cuenta con ese correo');

    const { correo, contrasena, rol, ...datosFuncionario } = dto;
    return this.prisma.cuenta.create({
      data: {
        correo,
        rol,
        contrasena_hash: await AuthService.hashContrasena(contrasena),
        debe_cambiar_contrasena: true,
        funcionario: { create: datosFuncionario },
      },
      select: SELECT_CUENTA,
    });
  }

  listar() {
    return this.prisma.cuenta.findMany({
      select: SELECT_CUENTA,
      orderBy: { id_cuenta: 'asc' },
    });
  }

  async cambiarEstado(id_cuenta: number, activo: boolean, id_cuenta_admin: number) {
    if (id_cuenta === id_cuenta_admin && !activo) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }
    const cuenta = await this.prisma.cuenta.findUnique({ where: { id_cuenta } });
    if (!cuenta) throw new NotFoundException('Cuenta no encontrada');
    return this.prisma.cuenta.update({
      where: { id_cuenta },
      data: { activo },
      select: SELECT_CUENTA,
    });
  }
}

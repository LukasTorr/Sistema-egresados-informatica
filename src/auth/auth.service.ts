import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { LoginDto } from './dto/login.dto';
import { LoginRespuestaDto } from './dto/login-respuesta.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  static hashContrasena(contrasena: string) {
    return bcrypt.hash(contrasena, 10);
  }

  async login(dto: LoginDto): Promise<LoginRespuestaDto> {
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { correo: dto.correo },
      include: {
        egresado: { select: { id_egresado: true } },
        funcionario: { select: { id_funcionario: true } },
      },
    });

    // Mismo mensaje si el correo no existe o la contraseña es incorrecta,
    // para no revelar qué correos están registrados.
    const valida =
      cuenta && (await bcrypt.compare(dto.contrasena, cuenta.contrasena_hash));
    if (!cuenta || !valida) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    if (!cuenta.activo) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    const payload: UsuarioToken = {
      sub: cuenta.id_cuenta,
      correo: cuenta.correo,
      rol: cuenta.rol,
      id_egresado: cuenta.egresado?.id_egresado,
      id_funcionario: cuenta.funcionario?.id_funcionario,
    };

    return {
      access_token: await this.jwt.signAsync(payload),
      usuario: {
        id_cuenta: cuenta.id_cuenta,
        correo: cuenta.correo,
        rol: cuenta.rol,
        id_egresado: payload.id_egresado,
        id_funcionario: payload.id_funcionario,
      },
    };
  }

  async perfil(usuario: UsuarioToken) {
    return this.prisma.cuenta.findUniqueOrThrow({
      where: { id_cuenta: usuario.sub },
      select: {
        id_cuenta: true,
        correo: true,
        rol: true,
        fecha_verificacion: true,
        funcionario: true,
        egresado: {
          select: { id_egresado: true, rut: true, nombres: true, apellido_paterno: true },
        },
      },
    });
  }

  async cambiarContrasena(usuario: UsuarioToken, dto: CambiarContrasenaDto) {
    const cuenta = await this.prisma.cuenta.findUniqueOrThrow({
      where: { id_cuenta: usuario.sub },
    });
    if (!(await bcrypt.compare(dto.contrasena_actual, cuenta.contrasena_hash))) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }
    await this.prisma.cuenta.update({
      where: { id_cuenta: usuario.sub },
      data: { contrasena_hash: await AuthService.hashContrasena(dto.contrasena_nueva) },
    });
    return { mensaje: 'Contraseña actualizada' };
  }
}

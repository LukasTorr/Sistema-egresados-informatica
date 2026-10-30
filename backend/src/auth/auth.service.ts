import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RolCuenta } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ActivarCuentaDto } from './dto/activar-cuenta.dto';
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
        debe_cambiar_contrasena: cuenta.debe_cambiar_contrasena,
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
        debe_cambiar_contrasena: true,
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
    if (dto.contrasena_nueva === dto.contrasena_actual) {
      throw new BadRequestException('La nueva contraseña debe ser distinta de la actual');
    }
    await this.prisma.cuenta.update({
      where: { id_cuenta: usuario.sub },
      data: {
        contrasena_hash: await AuthService.hashContrasena(dto.contrasena_nueva),
        debe_cambiar_contrasena: false,
      },
    });
    return { mensaje: 'Contraseña actualizada' };
  }

  // El egresado activa la cuenta que le corresponde: el RUT y el correo deben coincidir con lo que registró la Secretaría.
  async activarCuenta(dto: ActivarCuentaDto) {
    const egresado = await this.prisma.egresado.findUnique({
      where: { rut: dto.rut },
      include: { correos: true },
    });
    const correoCoincide = egresado?.correos.some((c) => c.correo.toLowerCase() === dto.correo);
    if (!egresado || !correoCoincide) {
      throw new BadRequestException(
        'No encontramos un egresado con ese RUT y correo. Revisa los datos o contacta a la Secretaría.',
      );
    }
    if (egresado.id_cuenta) {
      throw new ConflictException('Ya existe una cuenta para este egresado. Inicia sesión con tu correo.');
    }
    if (await this.prisma.cuenta.findUnique({ where: { correo: dto.correo } })) {
      throw new ConflictException('Ese correo ya está en uso por otra cuenta.');
    }

    await this.prisma.$transaction(async (tx) => {
      const cuenta = await tx.cuenta.create({
        data: {
          correo: dto.correo,
          contrasena_hash: await AuthService.hashContrasena(dto.contrasena),
          rol: RolCuenta.EGRESADO,
          fecha_verificacion: new Date(),
        },
      });
      await tx.egresado.update({
        where: { id_egresado: egresado.id_egresado },
        data: { id_cuenta: cuenta.id_cuenta },
      });
    });
    return { mensaje: 'Cuenta activada. Ya puedes iniciar sesión.' };
  }
}

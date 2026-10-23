import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CargoFuncionario, RolCuenta, RolFuncionario } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CrearFuncionarioDto {
  @ApiProperty({ example: 'secretaria@icci.cl' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  correo: string;

  @ApiProperty({ minLength: 8, example: 'Secreta2026' })
  @IsString()
  @MinLength(8)
  contrasena: string;

  @ApiProperty({
    enum: [RolCuenta.ADMINISTRADOR, RolCuenta.FUNCIONARIO],
    description: 'Rol de la cuenta para el inicio de sesión',
  })
  @IsIn([RolCuenta.ADMINISTRADOR, RolCuenta.FUNCIONARIO])
  rol: RolCuenta;

  @ApiProperty({ example: 'María José' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  apellido_paterno: string;

  @ApiPropertyOptional({ example: 'Soto' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  apellido_materno?: string;

  @ApiProperty({ enum: CargoFuncionario })
  @IsEnum(CargoFuncionario)
  cargo: CargoFuncionario;

  @ApiProperty({ enum: RolFuncionario })
  @IsEnum(RolFuncionario)
  rol_funcionario: RolFuncionario;
}

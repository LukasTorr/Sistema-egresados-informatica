/**
 * Datos iniciales: especialidades y una cuenta ADMINISTRADOR.
 * Ejecutar con:  npm run prisma:seed
 */
import 'dotenv/config';
import { PrismaClient, RolCuenta, CargoFuncionario, RolFuncionario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ESPECIALIDADES = [
  'Ingeniería Civil en Computación e Informática',
  'Ingeniería de Ejecución en Computación e Informática',
];

async function main() {
  for (const nombre of ESPECIALIDADES) {
    await prisma.especialidad.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  const correo = (process.env.ADMIN_CORREO ?? 'admin@icci.cl').toLowerCase();
  const contrasena = process.env.ADMIN_CONTRASENA ?? 'Admin1234';
  await prisma.cuenta.upsert({
    where: { correo },
    update: {},
    create: {
      correo,
      contrasena_hash: await bcrypt.hash(contrasena, 10),
      rol: RolCuenta.ADMINISTRADOR,
      fecha_verificacion: new Date(),
      funcionario: {
        create: {
          nombres: 'Administrador',
          apellido_paterno: 'Sistema',
          cargo: CargoFuncionario.JEFE_CARRERA,
          rol_funcionario: RolFuncionario.ADMINISTRADOR,
        },
      },
    },
  });

  console.log(`Seed listo. Admin: ${correo} / ${contrasena}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

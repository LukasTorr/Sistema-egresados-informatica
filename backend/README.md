# Sistema de Seguimiento de Egresados ICCI · Backend

API REST hecha con **NestJS 11** + **Prisma 6** sobre **MySQL**, con documentación **Swagger**.
Cubre las historias del Sprint 1:

| HU | Qué hace | Endpoints principales |
|----|----------|----------------------|
| HU-13 | Iniciar sesión según rol | `POST /api/auth/login`, `GET /api/auth/perfil`, `POST /api/usuarios/funcionarios` |
| HU-01 | Registrar egresado (personal, contacto, laboral) | `POST /api/egresados` |
| HU-02 | Consultar y actualizar egresado | `GET /api/egresados`, `GET/PATCH /api/egresados/{id}`, correos, teléfonos, situaciones laborales, historial |
| HU-03 | Carga masiva desde CSV | `GET /api/egresados/carga-masiva/plantilla`, `POST /api/egresados/carga-masiva` |
| HU-04 | Comunicaciones a egresados | `POST /api/comunicaciones`, `GET /api/comunicaciones/mis-comunicaciones` |

La lista completa, con ejemplos y el botón para probar cada endpoint, está en Swagger: **http://localhost:3000/docs**

---

## ¿Qué es Prisma?

Prisma es un **ORM**: la herramienta que conecta el código TypeScript con la base de datos.
En vez de escribir SQL a mano:

1. Las tablas se describen en un solo archivo: `prisma/schema.prisma` (está basado en el diagrama ER).
2. Prisma **genera las tablas en MySQL** a partir de ese archivo usando *migraciones*
   (archivos `.sql` versionados dentro de `prisma/migrations/`).
3. Prisma **genera un cliente tipado** (`@prisma/client`) para consultar desde el código, por ejemplo:
   ```ts
   const egresado = await prisma.egresado.findUnique({ where: { rut: '12345678-5' } });
   ```
   Si un campo no existe o tiene el tipo equivocado, el editor marca el error antes de ejecutar.

**Flujo de trabajo cuando cambien el modelo:**
editar `schema.prisma` → `npx prisma migrate dev --name descripcion_del_cambio` → se crea una
migración nueva, se aplica en tu MySQL y se regenera el cliente. Esa carpeta de migración se sube al
repositorio para que el resto del equipo la aplique con el mismo comando.

---

## Requisitos

- **Node.js 20 o superior** (`node -v`)
- **MySQL 8** corriendo (MySQL Server, XAMPP, Laragon o Docker sirven)

## Puesta en marcha (paso a paso)

Abre una terminal en `D:\Sistema de egresados` y ejecuta:

### 1. Instalar dependencias
```bash
npm install
```
(Al terminar ejecuta `prisma generate` automáticamente.)

### 2. Crear la base de datos vacía en MySQL
Desde MySQL Workbench, phpMyAdmin o la consola:
```sql
CREATE DATABASE sistema_egresados CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar el archivo `.env`
Copia `.env.example` como `.env`:
```bash
copy .env.example .env
```
y ajusta `DATABASE_URL` con tu usuario y contraseña de MySQL:
```
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/sistema_egresados"
```
Cambia también `JWT_SECRET` por un texto largo y aleatorio.
> Si tu contraseña tiene caracteres especiales (`@`, `#`, `/`…), escríbelos codificados (ej: `@` → `%40`).

### 4. Crear las tablas (migración)
```bash
npx prisma migrate dev
```
Esto aplica la migración `prisma/migrations/..._init` y crea todas las tablas del diagrama.
También ejecuta el *seed* (datos iniciales). Si no lo hizo, córrelo a mano:
```bash
npm run prisma:seed
```
El seed crea las especialidades y la cuenta administradora definida en `.env`
(`admin@icci.cl` / `Admin1234` por defecto).

> El usuario de MySQL necesita permiso para crear bases de datos, porque `migrate dev` usa una
> base temporal ("shadow database"). Con `root` no hay problema.

### 5. Levantar el servidor
```bash
npm run start:dev
```
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs

### 6. Probar en Swagger
1. Abre `POST /api/auth/login` → *Try it out* → envía `{"correo":"admin@icci.cl","contrasena":"Admin1234"}`.
2. Copia el `access_token` de la respuesta.
3. Pulsa **Authorize** (arriba a la derecha), pega el token y acepta.
4. Ya puedes probar el resto de endpoints.

### Comandos útiles
| Comando | Para qué |
|---------|----------|
| `npx prisma studio` | Abre una interfaz web para ver y editar los datos de las tablas |
| `npx prisma migrate dev --name xxx` | Crea y aplica una migración después de cambiar el schema |
| `npx prisma migrate reset` | Borra la BD, reaplica todas las migraciones y el seed (**solo en desarrollo**) |
| `npm run build` / `npm run start:prod` | Compilar y correr en producción |

---

## Roles y permisos

| Rol | Puede |
|-----|-------|
| `ADMINISTRADOR` (Secretaría/Jefatura) | Todo: crear cuentas, registrar/editar egresados, carga masiva, publicar comunicaciones |
| `FUNCIONARIO` | Registrar, consultar y editar egresados; publicar comunicaciones |
| `EGRESADO` | Ver y editar **solo su perfil** (`/egresados/me` y sus correos, teléfonos y situación laboral), leer sus comunicaciones |

Todas las rutas exigen token salvo `POST /api/auth/login`. Credenciales incorrectas → `401`; rol sin permiso → `403`.

Para que un egresado pueda iniciar sesión, al registrarlo (HU-01) se envía `contrasena_inicial`;
se crea su cuenta con su correo principal.

---

## Carga masiva (HU-03)

1. Descarga la plantilla: `GET /api/egresados/carga-masiva/plantilla` (se abre en Excel).
2. Llénala. Columnas:

   `rut; nombres; apellido_paterno; apellido_materno; especialidad; anio_ingreso; anio_egreso; ciudad_residencia; correo; telefono; estado_laboral; empresa; cargo; rango_sueldo`

   - Obligatorias: `rut`, `nombres`, `apellido_paterno`, `estado_laboral` y al menos `correo` o `telefono`.
   - `especialidad`: el nombre (sin importar tildes/mayúsculas) o su id.
   - `estado_laboral`: `EMPLEADO`, `INDEPENDIENTE`, `DESEMPLEADO`, `ESTUDIANDO`, `OTRO`.
   - `rango_sueldo`: `MENOS_500K`, `ENTRE_500K_1M`, `ENTRE_1M_1_5M`, `ENTRE_1_5M_2M`, `ENTRE_2M_3M`, `MAS_3M`, `NO_INFORMA`.
3. Guárdala como **CSV UTF-8** (Excel: *Guardar como → CSV UTF-8 (delimitado por comas)*). Acepta `;` o `,`.
4. Súbela en `POST /api/egresados/carga-masiva` (campo `archivo`).
   - Con `?simulacion=true` solo valida y muestra los errores, sin guardar.
   - Las filas válidas se guardan; las inválidas vuelven en `errores` con su número de fila y el motivo
     (RUT inválido o repetido, correo mal escrito, especialidad inexistente, etc.).

---

## Estructura

```
prisma/
  schema.prisma        ← modelo de datos (tablas del diagrama)
  migrations/          ← migraciones SQL generadas por Prisma
  seed.ts              ← datos iniciales (admin + especialidades)
src/
  main.ts              ← arranque, ValidationPipe y Swagger
  app.module.ts        ← módulos y guards globales (JWT + roles)
  prisma/              ← PrismaService (cliente compartido)
  common/              ← decoradores @Public, @Roles, @UsuarioActual, validador de RUT
  auth/                ← HU-13 login y guards
  usuarios/            ← HU-13 cuentas de administradores/funcionarios
  especialidades/
  egresados/           ← HU-01, HU-02 y HU-03 (carga-masiva.*)
  comunicaciones/      ← HU-04
```

---

## Decisiones sobre el diagrama

Campos marcados con `??` en el diagrama y cómo se resolvieron (se pueden cambiar en `schema.prisma`):

| Tabla.campo | Decisión |
|-------------|----------|
| `cuenta.fecha_verificacion??` | `DateTime` opcional: `null` mientras el correo no esté verificado. |
| `egresado_correo.tipo???` | enum `PERSONAL`, `INSTITUCIONAL`, `LABORAL`. |
| `egresado_telefono.tipo???` | enum `MOVIL`, `FIJO`, `LABORAL`. |
| `oferta_laboral.tipo??` | enum `EMPLEO`, `PRACTICA`, `PART_TIME`, `FREELANCE`. |
| `oferta_laboral.origen???` | enum `INTERNA` (la publica el departamento), `EMPRESA` (la envía una empresa), `EXTERNA` (portal externo). |

Otros enums que el diagrama dejaba abiertos: `cargo` (`JEFE_CARRERA`, `SECRETARIA`, `COORDINADOR`, `DOCENTE`, `OTRO`),
`rol_funcionario` (`ADMINISTRADOR`, `GESTOR`, `LECTOR`), `estado_perfil` (`INCOMPLETO`, `ACTIVO`, `INACTIVO`),
`estado_laboral` y `rango_sueldo`.

Cambios y agregados respecto al diagrama:

- **Tabla nueva `comunicacion`** (HU-04): el diagrama no tenía dónde guardar las comunicaciones.
  Guarda título, contenido, canal, autor, filtros opcionales de destinatarios (especialidad, año de egreso),
  `total_destinatarios` y `fecha_publicacion`, que es el "registro del envío" que pide el criterio de aceptación.
- `cuenta`: se agregaron `activo` (para bloquear el acceso) y `fecha_creacion`.
- `egresado`: se agregaron `fecha_creacion` y `fecha_actualizacion`.
- `apellido_materno`, `ciudad_residencia`, años, `empresa`, `cargo` y similares quedaron **opcionales**
  para que la carga masiva no falle con datos históricos incompletos.
- Se agregaron restricciones únicas para evitar duplicados: RUT, correo por egresado y teléfono por egresado.
- `movimiento_perfil` se usa como bitácora: cada cambio hecho en HU-02 queda registrado con el valor anterior,
  el nuevo y quién lo hizo (`GET /api/egresados/{id}/historial`).
- De lo que viene después solo está creada la tabla `oferta_laboral`, sin endpoints todavía. Actividades,
  sesiones, inscripciones, encuestas, reportes e informes de cierre se agregarán en su sprint.

## Pendiente para próximos sprints

- Envío real por **correo** de las comunicaciones (hoy se publican en el portal; el campo `canal` ya existe).
- Verificación de correo y recuperación de contraseña.
- Endpoints de ofertas laborales.
- Tablas y endpoints de actividades, sesiones, inscripciones, encuestas, reportes e informes de cierre.

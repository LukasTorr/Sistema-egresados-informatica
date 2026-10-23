-- CreateTable
CREATE TABLE `cuenta` (
    `id_cuenta` INTEGER NOT NULL AUTO_INCREMENT,
    `correo` VARCHAR(150) NOT NULL,
    `contrasena_hash` VARCHAR(255) NOT NULL,
    `rol` ENUM('ADMINISTRADOR', 'FUNCIONARIO', 'EGRESADO') NOT NULL,
    `fecha_verificacion` DATETIME(3) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cuenta_correo_key`(`correo`),
    PRIMARY KEY (`id_cuenta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funcionario` (
    `id_funcionario` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cuenta` INTEGER NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellido_paterno` VARCHAR(60) NOT NULL,
    `apellido_materno` VARCHAR(60) NULL,
    `cargo` ENUM('JEFE_CARRERA', 'SECRETARIA', 'COORDINADOR', 'DOCENTE', 'OTRO') NOT NULL,
    `rol_funcionario` ENUM('ADMINISTRADOR', 'GESTOR', 'LECTOR') NOT NULL,

    UNIQUE INDEX `funcionario_id_cuenta_key`(`id_cuenta`),
    PRIMARY KEY (`id_funcionario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `especialidad` (
    `id_especialidad` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `especialidad_nombre_key`(`nombre`),
    PRIMARY KEY (`id_especialidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `egresado` (
    `id_egresado` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cuenta` INTEGER NULL,
    `id_especialidad` INTEGER NULL,
    `rut` VARCHAR(12) NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellido_paterno` VARCHAR(60) NOT NULL,
    `apellido_materno` VARCHAR(60) NULL,
    `ciudad_residencia` VARCHAR(100) NULL,
    `anio_ingreso` INTEGER NULL,
    `anio_egreso` INTEGER NULL,
    `estado_perfil` ENUM('INCOMPLETO', 'ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'INCOMPLETO',
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_actualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `egresado_id_cuenta_key`(`id_cuenta`),
    UNIQUE INDEX `egresado_rut_key`(`rut`),
    INDEX `egresado_apellido_paterno_idx`(`apellido_paterno`),
    INDEX `egresado_anio_egreso_idx`(`anio_egreso`),
    PRIMARY KEY (`id_egresado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `egresado_correo` (
    `id_correo` INTEGER NOT NULL AUTO_INCREMENT,
    `id_egresado` INTEGER NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `tipo` ENUM('PERSONAL', 'INSTITUCIONAL', 'LABORAL') NOT NULL DEFAULT 'PERSONAL',
    `es_principal` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `egresado_correo_id_egresado_correo_key`(`id_egresado`, `correo`),
    PRIMARY KEY (`id_correo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `egresado_telefono` (
    `id_telefono` INTEGER NOT NULL AUTO_INCREMENT,
    `id_egresado` INTEGER NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `tipo` ENUM('MOVIL', 'FIJO', 'LABORAL') NOT NULL DEFAULT 'MOVIL',
    `es_principal` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `egresado_telefono_id_egresado_telefono_key`(`id_egresado`, `telefono`),
    PRIMARY KEY (`id_telefono`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `situacion_laboral` (
    `id_situacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_egresado` INTEGER NOT NULL,
    `estado_laboral` ENUM('EMPLEADO', 'INDEPENDIENTE', 'DESEMPLEADO', 'ESTUDIANDO', 'OTRO') NOT NULL,
    `empresa` VARCHAR(150) NULL,
    `cargo` VARCHAR(120) NULL,
    `rango_sueldo` ENUM('MENOS_500K', 'ENTRE_500K_1M', 'ENTRE_1M_1_5M', 'ENTRE_1_5M_2M', 'ENTRE_2M_3M', 'MAS_3M', 'NO_INFORMA') NULL,
    `fecha_inicio` DATE NULL,
    `fecha_termino` DATE NULL,
    `es_actual` BOOLEAN NOT NULL DEFAULT true,

    INDEX `situacion_laboral_id_egresado_es_actual_idx`(`id_egresado`, `es_actual`),
    PRIMARY KEY (`id_situacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimiento_perfil` (
    `id_movimiento` INTEGER NOT NULL AUTO_INCREMENT,
    `id_egresado` INTEGER NOT NULL,
    `id_cuenta_autor` INTEGER NULL,
    `campo` VARCHAR(80) NOT NULL,
    `valor_anterior` VARCHAR(500) NULL,
    `valor_nuevo` VARCHAR(500) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_movimiento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oferta_laboral` (
    `id_oferta` INTEGER NOT NULL AUTO_INCREMENT,
    `id_funcionario` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `empresa` VARCHAR(150) NOT NULL,
    `requisitos` TEXT NULL,
    `tipo` ENUM('EMPLEO', 'PRACTICA', 'PART_TIME', 'FREELANCE') NOT NULL,
    `origen` ENUM('INTERNA', 'EMPRESA', 'EXTERNA') NOT NULL,
    `url_postulacion` VARCHAR(255) NULL,
    `correo_contacto` VARCHAR(150) NULL,
    `fecha_publicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_cierre` DATE NULL,

    PRIMARY KEY (`id_oferta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividad` (
    `id_actividad` INTEGER NOT NULL AUTO_INCREMENT,
    `id_funcionario` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `tipo` ENUM('CHARLA', 'TALLER', 'SEMINARIO', 'FERIA_LABORAL', 'REUNION', 'OTRO') NOT NULL,
    `lugar` VARCHAR(150) NULL,

    PRIMARY KEY (`id_actividad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesion` (
    `id_sesion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_actividad` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `hora_inicio` TIME(0) NOT NULL,
    `hora_fin` TIME(0) NOT NULL,

    PRIMARY KEY (`id_sesion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inscripcion` (
    `id_inscripcion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_sesion` INTEGER NOT NULL,
    `id_egresado` INTEGER NOT NULL,
    `fecha_inscripcion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `asistio` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `inscripcion_id_sesion_id_egresado_key`(`id_sesion`, `id_egresado`),
    PRIMARY KEY (`id_inscripcion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporte` (
    `id_reporte` INTEGER NOT NULL AUTO_INCREMENT,
    `id_funcionario` INTEGER NOT NULL,
    `id_actividad` INTEGER NULL,

    PRIMARY KEY (`id_reporte`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `informe_cierre` (
    `id_informe` INTEGER NOT NULL AUTO_INCREMENT,
    `id_actividad` INTEGER NOT NULL,
    `id_funcionario` INTEGER NOT NULL,
    `fecha_generacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `total_inscritos` INTEGER NOT NULL DEFAULT 0,
    `asistentes_completos` INTEGER NOT NULL DEFAULT 0,
    `asistentes_parciales` INTEGER NOT NULL DEFAULT 0,
    `porcentaje_asistencia` DECIMAL(5, 2) NOT NULL,
    `observaciones` TEXT NULL,

    UNIQUE INDEX `informe_cierre_id_actividad_key`(`id_actividad`),
    PRIMARY KEY (`id_informe`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `encuesta` (
    `id_encuesta` INTEGER NOT NULL AUTO_INCREMENT,
    `id_actividad` INTEGER NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `tipo` ENUM('SEGUIMIENTO', 'SATISFACCION', 'EMPLEABILIDAD') NOT NULL,
    `fecha_cierre` DATE NULL,

    PRIMARY KEY (`id_encuesta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pregunta` (
    `id_pregunta` INTEGER NOT NULL AUTO_INCREMENT,
    `id_encuesta` INTEGER NOT NULL,
    `enunciado` VARCHAR(500) NOT NULL,
    `tipo` ENUM('TEXTO', 'NUMERO', 'SI_NO', 'ESCALA', 'OPCION_MULTIPLE') NOT NULL,

    PRIMARY KEY (`id_pregunta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `respuesta` (
    `id_respuesta` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pregunta` INTEGER NOT NULL,
    `id_egresado` INTEGER NOT NULL,
    `valor` TEXT NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `respuesta_id_pregunta_id_egresado_key`(`id_pregunta`, `id_egresado`),
    PRIMARY KEY (`id_respuesta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comunicacion` (
    `id_comunicacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_funcionario` INTEGER NULL,
    `id_cuenta_autor` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `contenido` TEXT NOT NULL,
    `canal` ENUM('PORTAL', 'CORREO', 'PORTAL_Y_CORREO') NOT NULL DEFAULT 'PORTAL',
    `id_especialidad` INTEGER NULL,
    `anio_egreso` INTEGER NULL,
    `total_destinatarios` INTEGER NOT NULL DEFAULT 0,
    `fecha_publicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comunicacion_fecha_publicacion_idx`(`fecha_publicacion`),
    PRIMARY KEY (`id_comunicacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `funcionario` ADD CONSTRAINT `funcionario_id_cuenta_fkey` FOREIGN KEY (`id_cuenta`) REFERENCES `cuenta`(`id_cuenta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresado` ADD CONSTRAINT `egresado_id_cuenta_fkey` FOREIGN KEY (`id_cuenta`) REFERENCES `cuenta`(`id_cuenta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresado` ADD CONSTRAINT `egresado_id_especialidad_fkey` FOREIGN KEY (`id_especialidad`) REFERENCES `especialidad`(`id_especialidad`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresado_correo` ADD CONSTRAINT `egresado_correo_id_egresado_fkey` FOREIGN KEY (`id_egresado`) REFERENCES `egresado`(`id_egresado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresado_telefono` ADD CONSTRAINT `egresado_telefono_id_egresado_fkey` FOREIGN KEY (`id_egresado`) REFERENCES `egresado`(`id_egresado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `situacion_laboral` ADD CONSTRAINT `situacion_laboral_id_egresado_fkey` FOREIGN KEY (`id_egresado`) REFERENCES `egresado`(`id_egresado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimiento_perfil` ADD CONSTRAINT `movimiento_perfil_id_egresado_fkey` FOREIGN KEY (`id_egresado`) REFERENCES `egresado`(`id_egresado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimiento_perfil` ADD CONSTRAINT `movimiento_perfil_id_cuenta_autor_fkey` FOREIGN KEY (`id_cuenta_autor`) REFERENCES `cuenta`(`id_cuenta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oferta_laboral` ADD CONSTRAINT `oferta_laboral_id_funcionario_fkey` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario`(`id_funcionario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividad` ADD CONSTRAINT `actividad_id_funcionario_fkey` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario`(`id_funcionario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sesion` ADD CONSTRAINT `sesion_id_actividad_fkey` FOREIGN KEY (`id_actividad`) REFERENCES `actividad`(`id_actividad`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscripcion` ADD CONSTRAINT `inscripcion_id_sesion_fkey` FOREIGN KEY (`id_sesion`) REFERENCES `sesion`(`id_sesion`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscripcion` ADD CONSTRAINT `inscripcion_id_egresado_fkey` FOREIGN KEY (`id_egresado`) REFERENCES `egresado`(`id_egresado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte` ADD CONSTRAINT `reporte_id_funcionario_fkey` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario`(`id_funcionario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporte` ADD CONSTRAINT `reporte_id_actividad_fkey` FOREIGN KEY (`id_actividad`) REFERENCES `actividad`(`id_actividad`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `informe_cierre` ADD CONSTRAINT `informe_cierre_id_actividad_fkey` FOREIGN KEY (`id_actividad`) REFERENCES `actividad`(`id_actividad`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `informe_cierre` ADD CONSTRAINT `informe_cierre_id_funcionario_fkey` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario`(`id_funcionario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encuesta` ADD CONSTRAINT `encuesta_id_actividad_fkey` FOREIGN KEY (`id_actividad`) REFERENCES `actividad`(`id_actividad`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pregunta` ADD CONSTRAINT `pregunta_id_encuesta_fkey` FOREIGN KEY (`id_encuesta`) REFERENCES `encuesta`(`id_encuesta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuesta` ADD CONSTRAINT `respuesta_id_pregunta_fkey` FOREIGN KEY (`id_pregunta`) REFERENCES `pregunta`(`id_pregunta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuesta` ADD CONSTRAINT `respuesta_id_egresado_fkey` FOREIGN KEY (`id_egresado`) REFERENCES `egresado`(`id_egresado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comunicacion` ADD CONSTRAINT `comunicacion_id_funcionario_fkey` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario`(`id_funcionario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comunicacion` ADD CONSTRAINT `comunicacion_id_cuenta_autor_fkey` FOREIGN KEY (`id_cuenta_autor`) REFERENCES `cuenta`(`id_cuenta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comunicacion` ADD CONSTRAINT `comunicacion_id_especialidad_fkey` FOREIGN KEY (`id_especialidad`) REFERENCES `especialidad`(`id_especialidad`) ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE `actividad` DROP FOREIGN KEY `actividad_id_funcionario_fkey`;

-- DropForeignKey
ALTER TABLE `encuesta` DROP FOREIGN KEY `encuesta_id_actividad_fkey`;

-- DropForeignKey
ALTER TABLE `informe_cierre` DROP FOREIGN KEY `informe_cierre_id_actividad_fkey`;

-- DropForeignKey
ALTER TABLE `informe_cierre` DROP FOREIGN KEY `informe_cierre_id_funcionario_fkey`;

-- DropForeignKey
ALTER TABLE `inscripcion` DROP FOREIGN KEY `inscripcion_id_egresado_fkey`;

-- DropForeignKey
ALTER TABLE `inscripcion` DROP FOREIGN KEY `inscripcion_id_sesion_fkey`;

-- DropForeignKey
ALTER TABLE `pregunta` DROP FOREIGN KEY `pregunta_id_encuesta_fkey`;

-- DropForeignKey
ALTER TABLE `reporte` DROP FOREIGN KEY `reporte_id_actividad_fkey`;

-- DropForeignKey
ALTER TABLE `reporte` DROP FOREIGN KEY `reporte_id_funcionario_fkey`;

-- DropForeignKey
ALTER TABLE `respuesta` DROP FOREIGN KEY `respuesta_id_egresado_fkey`;

-- DropForeignKey
ALTER TABLE `respuesta` DROP FOREIGN KEY `respuesta_id_pregunta_fkey`;

-- DropForeignKey
ALTER TABLE `sesion` DROP FOREIGN KEY `sesion_id_actividad_fkey`;

-- DropTable
DROP TABLE `actividad`;

-- DropTable
DROP TABLE `encuesta`;

-- DropTable
DROP TABLE `informe_cierre`;

-- DropTable
DROP TABLE `inscripcion`;

-- DropTable
DROP TABLE `pregunta`;

-- DropTable
DROP TABLE `reporte`;

-- DropTable
DROP TABLE `respuesta`;

-- DropTable
DROP TABLE `sesion`;


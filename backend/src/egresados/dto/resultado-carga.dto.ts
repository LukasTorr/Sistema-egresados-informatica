import { ApiProperty } from '@nestjs/swagger';

export class ErrorFilaDto {
  @ApiProperty({ description: 'Número de fila en el archivo (la fila 1 es el encabezado)' })
  fila: number;

  @ApiProperty({ nullable: true })
  rut: string | null;

  @ApiProperty({ type: [String] })
  errores: string[];
}

export class ResultadoCargaDto {
  @ApiProperty({ description: 'true si fue una simulación y no se guardó nada' })
  simulacion: boolean;

  @ApiProperty() total_filas: number;
  @ApiProperty() insertados: number;
  @ApiProperty() con_errores: number;

  @ApiProperty({ type: [ErrorFilaDto] })
  errores: ErrorFilaDto[];
}

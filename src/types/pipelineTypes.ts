export interface PipelineStage {
  id: string;         // Eindeutige ID der Stage (z.B. generiert oder niedriger Name)
  name: string;       // Anzeigename der Stage
  probability?: number; // Gewinnwahrscheinlichkeit in Prozent (0-100)
  color?: string;      // Hex-Farbcode für die Stage (z.B. '#FF0000')
  order: number;      // Reihenfolge der Stage
} 
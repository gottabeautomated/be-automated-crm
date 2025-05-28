import { Timestamp } from 'firebase/firestore';
import { PipelineStage as GlobalPipelineStage } from '@/types/pipelineTypes'; // Importiere den globalen Typ

// export const PIPELINE_STAGES = [ // Entfernt
//   'Lead',
//   'Qualifiziert',
//   'Angebot',
//   'Verhandlung',
//   'Abgeschlossen',
//   'Verloren',
// ] as const;

// export type PipelineStage = typeof PIPELINE_STAGES[number]; // Entfernt

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number; // In Prozent, z.B. 75 für 75%
  stageId: string; // Geändert von stage: PipelineStage zu stageId: string, um die ID der globalen Stage zu speichern
  contactId?: string; // Optional, um einen Deal mit einem Kontakt zu verknüpfen
  assignedUserId?: string; // Für spätere Filterung nach zugewiesenem Benutzer
  userId: string; // ID des Benutzers, dem dieser Deal gehört
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  expectedCloseDate?: Timestamp;
  customFields?: Record<string, any>; // Für mögliche benutzerdefinierte Felder
  description?: string;
  tags?: string[];
}

export interface DealFormData {
  title: string;
  companyName: string;
  value: string;
  probability: string;
  stageId: string; // Geändert von stage: PipelineStage zu stageId: string
  expectedCloseDate?: string;
  description?: string;
  contactId?: string;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
} 
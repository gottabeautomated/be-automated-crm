import { Timestamp } from 'firebase/firestore';

export const PIPELINE_STAGES = [
  'Lead',
  'Qualifiziert',
  'Angebot',
  'Verhandlung',
  'Abgeschlossen',
  'Verloren',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number; // In Prozent, z.B. 75 für 75%
  stage: PipelineStage;
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
  stage: PipelineStage;
  expectedCloseDate?: string;
  description?: string;
  contactId?: string;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
} 
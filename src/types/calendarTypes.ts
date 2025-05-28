import { Timestamp } from 'firebase/firestore';

export const EVENT_TYPES = {
  MEETING: 'Meeting',
  CALL: 'Call',
  EMAIL: 'Email',
  TASK: 'Task',
  NOTE: 'Note',
  ONSITE_APPOINTMENT: 'Vor-Ort Termin',
  FOLLOW_UP: 'Follow-up',
  DEADLINE: 'Deadline',
} as const;

export type EventTypeName = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

export interface EventTypeDetail {
  name: EventTypeName;
  color: string; // Hex color for the event type
  defaultDurationMinutes?: number; // Optional default duration in minutes
}

export const EVENT_TYPE_DETAILS: Record<EventTypeName, EventTypeDetail> = {
  [EVENT_TYPES.MEETING]: { name: EVENT_TYPES.MEETING, color: '#8B5CF6', defaultDurationMinutes: 30 }, // Lila - Dauer 30 Min
  [EVENT_TYPES.CALL]: { name: EVENT_TYPES.CALL, color: '#10B981', defaultDurationMinutes: 15 },    // Grün - Dauer 15 Min
  [EVENT_TYPES.EMAIL]: { name: EVENT_TYPES.EMAIL, color: '#3B82F6', defaultDurationMinutes: 15 },   // Blau - Dauer 15 Min
  [EVENT_TYPES.TASK]: { name: EVENT_TYPES.TASK, color: '#6B7280'}, // Grau - Keine spezifische Dauer vorerst
  [EVENT_TYPES.NOTE]: { name: EVENT_TYPES.NOTE, color: '#78716C'}, // Braun/Grau - Keine spezifische Dauer vorerst
  [EVENT_TYPES.ONSITE_APPOINTMENT]: { name: EVENT_TYPES.ONSITE_APPOINTMENT, color: '#EC4899', defaultDurationMinutes: 60 }, // Pink - Dauer 60 Min
  [EVENT_TYPES.FOLLOW_UP]: { name: EVENT_TYPES.FOLLOW_UP, color: '#F59E0B', defaultDurationMinutes: 30 }, // Orange - Dauer 30 Min
  [EVENT_TYPES.DEADLINE]: { name: EVENT_TYPES.DEADLINE, color: '#EF4444' }, // Rot - Keine Dauer, ist ein Zeitpunkt
};

// Dieses Interface wird für die Darstellung in react-big-calendar benötigt.
// Die Felder `start` und `end` müssen Date-Objekte sein.
// `allDay` ist optional.
export interface CalendarDisplayEvent {
  id?: string; // Firestore document ID
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any; // Kann für zusätzliche Daten wie den Event-Typ oder verknüpfte IDs verwendet werden
}

// Dieses Interface repräsentiert ein Event, wie es in Firestore gespeichert wird.
// Zeitstempel werden als Firestore Timestamps gespeichert.
export interface FirestoreEvent {
  id?: string; // Wird von Firestore automatisch generiert, aber nützlich im Client
  userId: string;
  title: string;
  type: EventTypeName;
  start: Timestamp;
  end: Timestamp;
  allDay?: boolean;
  durationMinutes?: number; // Dauer in Minuten, nützlich für nicht-ganztägige Events
  location?: string;
  attendees?: string[]; // Array von E-Mail-Adressen oder Kontakt-IDs
  notes?: string;
  contactId?: string | null;
  dealId?: string | null;
  isRecurring?: boolean;
  rruleString?: string | null; // Speichert die Wiederholungsregel als RRULE String
  recurrenceEndDate?: Timestamp | null; // Optionales Enddatum der Serie
  excludedDates?: Timestamp[]; // Daten einzelner Vorkommen, die gelöscht/geändert wurden
  reminderOffsetMinutes?: number | null; // Minuten vor dem Start, null oder nicht vorhanden = keine Erinnerung
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Für Formulare zum Erstellen/Bearbeiten von Events
export interface EventFormData {
  title: string;
  type: EventTypeName;
  startDate: Date;       // Startdatum des ERSTEN Vorkommens bei Serien
  startTime: string;     // z.B. "10:30"
  endDate: Date;         // Enddatum des ERSTEN Vorkommens (relevant für Dauer)
  endTime: string;       // z.B. "11:00"
  allDay: boolean;
  location?: string;
  attendees?: string;     // Komma-separierte Liste für einfache Eingabe
  notes?: string;
  contactId?: string | null;
  dealId?: string | null;
  reminderOffsetMinutes: string; // 'none', '0', '15', etc. Wird beim Speichern konvertiert
  
  // Felder für Serientermine
  isRecurring: boolean;
  recurrenceFrequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'; // 'none' für nicht wiederholend
  recurrenceInterval?: number;      // z.B. alle X Tage/Wochen/Monate/Jahre
  recurrenceByDay?: string[];       // z.B. ['MO', 'TU', 'WE'] für wöchentlich; für monatlich ggf. spezifischer Tag
  recurrenceEndType?: 'never' | 'onDate' | 'afterOccurrences';
  recurrenceEndDateForm?: Date | null; // Enddatum der Serie (wenn recurrenceEndType === 'onDate')
  recurrenceOccurrences?: number;   // Anzahl der Vorkommen (wenn recurrenceEndType === 'afterOccurrences')
} 
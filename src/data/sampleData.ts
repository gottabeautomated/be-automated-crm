export interface Contact {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  status: 'Kunde' | 'Interessent' | 'Lead'; // More specific type
  lastContact: string; // Could be Date type if preferred
  dealStage: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low'; // More specific type
  notes: string;
}

export interface Activity {
  id: number;
  type: 'call' | 'email' | 'meeting' | 'assessment'; // More specific type
  contact: string;
  time: string;
  description: string;
}

export interface Deal {
  id: number;
  title: string;
  value: number;
  stage: string;
  probability: number;
  company: string;
}

export const sampleContacts: Contact[] = [
  {
    id: 1,
    name: 'Green Vision Group',
    company: 'Michael Walentin GmbH',
    email: 'office@greenvision.at',
    phone: '+43 676 733 06 81',
    value: 60000,
    status: 'Kunde',
    lastContact: '2025-05-20',
    dealStage: 'Abgeschlossen',
    tags: ['Enterprise', 'CRM', 'DISG Integration'],
    priority: 'high',
    notes: 'Erfolgreiche Implementierung des €60k CRM-Systems mit DISG-Integration. Sehr zufriedener Kunde.'
  },
  {
    id: 2,
    name: 'TechStart Solutions',
    company: 'TechStart GmbH',
    email: 'ceo@techstart.de',
    phone: '+49 89 123456',
    value: 25000,
    status: 'Interessent',
    lastContact: '2025-05-24',
    dealStage: 'Verhandlung',
    tags: ['Automation', 'KI-Assessment'],
    priority: 'medium',
    notes: 'Interessiert an KI-Readiness Assessment. Follow-up nächste Woche geplant.'
  },
  {
    id: 3,
    name: 'Handwerk Digital',
    company: 'Handwerk Digital AG',
    email: 'info@handwerk-digital.ch',
    phone: '+41 44 987654',
    value: 15000,
    status: 'Lead',
    lastContact: '2025-05-22',
    dealStage: 'Qualifizierung',
    tags: ['Digitalisierung', 'Assessment'],
    priority: 'low',
    notes: 'Hat Digital Assessment durchgeführt. Score: 45/100. Braucht Basis-Digitalisierung.'
  }
];

export const sampleRecentActivities: Activity[] = [
  { id: 1, type: 'call', contact: 'Green Vision Group', time: '2 Std.', description: 'Abschluss-Call für CRM-Projekt' },
  { id: 2, type: 'email', contact: 'TechStart Solutions', time: '1 Tag', description: 'KI-Assessment Ergebnisse gesendet' },
  { id: 3, type: 'meeting', contact: 'Handwerk Digital', time: '2 Tage', description: 'Erstberatung Digitalisierung' },
  { id: 4, type: 'assessment', contact: 'Neue Firma XYZ', time: '3 Tage', description: 'Digital Assessment abgeschlossen' }
];

export const sampleDeals: Deal[] = [
  { id: 1, title: 'Green Vision CRM Implementation', value: 60000, stage: 'Abgeschlossen', probability: 100, company: 'Green Vision Group' },
  { id: 2, title: 'TechStart KI-Transformation', value: 45000, stage: 'Verhandlung', probability: 75, company: 'TechStart Solutions' },
  { id: 3, title: 'Handwerk Digitalisierung', value: 18000, stage: 'Qualifizierung', probability: 40, company: 'Handwerk Digital' },
  { id: 4, title: 'Enterprise Assessment Suite', value: 35000, stage: 'Angebot', probability: 60, company: 'Manufacturing Pro' }
]; 
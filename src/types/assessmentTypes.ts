import { Timestamp } from 'firebase/firestore';

export const ASSESSMENT_TOOLS = {
  DIGITAL_ASSESSMENT: 'Digital Assessment',
  KI_READINESS: 'KI-Readiness Check',
  CRM_BUILDER: 'CRM Strategie Builder',
} as const;

export type AssessmentToolName = typeof ASSESSMENT_TOOLS[keyof typeof ASSESSMENT_TOOLS];

export interface AssessmentToolDetail {
  name: AssessmentToolName;
  icon: string; // lucide-react icon name
  colorScheme: { // Tailwind CSS color classes
    bg: string; // e.g., 'bg-blue-100'
    text: string; // e.g., 'text-blue-700'
    border: string; // e.g., 'border-blue-500'
    iconBg: string; // e.g., 'bg-blue-500'
    iconText: string; // e.g., 'text-white'
  };
  description: string;
  link?: string; // Placeholder for actual tool link or modal trigger
}

export const ASSESSMENT_TOOL_DETAILS: Record<AssessmentToolName, AssessmentToolDetail> = {
  [ASSESSMENT_TOOLS.DIGITAL_ASSESSMENT]: {
    name: ASSESSMENT_TOOLS.DIGITAL_ASSESSMENT,
    icon: 'BarChart3',
    colorScheme: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-500',
      iconBg: 'bg-sky-500',
      iconText: 'text-white',
    },
    description: 'Bewerten Sie die digitale Reife Ihres Unternehmens und erhalten Sie Handlungsempfehlungen.',
  },
  [ASSESSMENT_TOOLS.KI_READINESS]: {
    name: ASSESSMENT_TOOLS.KI_READINESS,
    icon: 'Zap',
    colorScheme: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-500',
      iconBg: 'bg-purple-500',
      iconText: 'text-white',
    },
    description: 'Finden Sie heraus, wie gut Ihr Unternehmen auf den Einsatz von Künstlicher Intelligenz vorbereitet ist.',
  },
  [ASSESSMENT_TOOLS.CRM_BUILDER]: {
    name: ASSESSMENT_TOOLS.CRM_BUILDER,
    icon: 'Users',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-500',
      iconBg: 'bg-emerald-500',
      iconText: 'text-white',
    },
    description: 'Entwickeln Sie eine maßgeschneiderte CRM-Strategie für Ihr Unternehmen.',
  },
};

export interface AssessmentRecommendation {
  id: string; // or simply use array index if not needing specific IDs
  text: string;
  // category?: string;
}

export interface AssessmentResult {
  id: string; // Firestore document ID
  userId: string; // ID of the user who owns/created this result (can be the CRM user)
  assessedEmail?: string; // Email of the person who took the assessment (for contact linking)
  contactId?: string | null; // Linked contact ID in Firestore
  type: AssessmentToolName;
  score: number; // Could be a percentage or a raw score
  // scoreDetails?: Record<string, any>; // For more complex scoring breakdowns
  recommendations: AssessmentRecommendation[];
  completedAt: Timestamp; // Firestore server timestamp
  // additionalNotes?: string;
}

// For creating new assessment results, some fields are generated or optional
export interface AssessmentResultFormData {
  contactEmail: string;
  toolName: AssessmentToolName;
  score: number;
  recommendations: string;
  assessmentDate?: Date; // Optional, da es beim Erstellen automatisch gesetzt wird
}

export interface SendEmailData {
  to: string;
  subject: string;
  html: string;
  assessmentId: string;
  contactId: string;
} 
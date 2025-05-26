import { Timestamp } from 'firebase/firestore';

export const ACTIVITY_TYPES = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  NOTE: 'Note',
  TASK: 'Task',
  ASSESSMENT: 'Assessment'
} as const;

export type ActivityTypeName = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

export interface ActivityTypeDetail {
  name: ActivityTypeName;
  icon: string; // lucide-react icon name
  color: string; // Tailwind CSS color class (e.g., 'text-green-500', 'bg-blue-100')
}

export const ACTIVITY_TYPE_DETAILS: Record<ActivityTypeName, ActivityTypeDetail> = {
  [ACTIVITY_TYPES.CALL]: { name: ACTIVITY_TYPES.CALL, icon: 'Phone', color: 'text-emerald-600 bg-emerald-50' },
  [ACTIVITY_TYPES.EMAIL]: { name: ACTIVITY_TYPES.EMAIL, icon: 'Mail', color: 'text-sky-600 bg-sky-50' },
  [ACTIVITY_TYPES.MEETING]: { name: ACTIVITY_TYPES.MEETING, icon: 'Users', color: 'text-purple-600 bg-purple-50' },
  [ACTIVITY_TYPES.NOTE]: { name: ACTIVITY_TYPES.NOTE, icon: 'FileText', color: 'text-slate-600 bg-slate-50' },
  [ACTIVITY_TYPES.TASK]: { name: ACTIVITY_TYPES.TASK, icon: 'CheckCircle', color: 'text-amber-600 bg-amber-50' },
  [ACTIVITY_TYPES.ASSESSMENT]: { name: ACTIVITY_TYPES.ASSESSMENT, icon: 'ClipboardList', color: 'text-teal-600 bg-teal-50' },
};

export interface Activity {
  id: string;
  type: ActivityTypeName;
  title: string;
  description?: string;
  notes?: string; // Alternative or addition to description, for internal logging
  createdAt: Timestamp; // Firestore server timestamp
  updatedAt: Timestamp; // Firestore server timestamp
  activityDate: Timestamp; // Date the activity actually occurred or is scheduled for
  userId: string; // ID of the user who created/is responsible for the activity
  userName?: string; // Name of the user, for display
  contactId?: string; 
  contactName?: string; // For display
  dealId?: string;
  dealTitle?: string; // For display
  isCompleted?: boolean; // For tasks
  completedAt?: Timestamp; // For tasks
  // Potential future fields
  // duration?: number; // For calls/meetings, in minutes
  // outcome?: string; // e.g., 'positive', 'negative', 'neutral'
  // relatedTo?: { type: 'contact' | 'deal', id: string, name: string }; // More generic relation
}

// For creating/updating activities, some fields are optional or handled by the backend
export interface ActivityFormData {
  type: ActivityTypeName;
  title: string;
  description?: string;
  notes?: string;
  activityDate: string; // Input as string, converted to Timestamp
  contactId?: string;
  dealId?: string;
  isCompleted?: boolean; // For tasks
  assignedToUserId?: string; // If a task can be assigned to someone else
} 
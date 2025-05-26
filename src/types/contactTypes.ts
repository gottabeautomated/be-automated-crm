import { Timestamp } from 'firebase/firestore';

export interface FirestoreContact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  dealValue: number;
  status: 'Kunde' | 'Interessent' | 'Lead';
  lastContact: string | Timestamp;
  dealStage?: string;
  priority?: 'high' | 'medium' | 'low';
  tags: string[];
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId?: string;
  leadSource?: 'Website' | 'Referral' | 'Advertisement' | 'Cold Call' | 'Other';
}

export interface ContactFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  dealValue: string;
  status: 'Kunde' | 'Interessent' | 'Lead';
  lastContact: string;
  dealStage: string;
  priority: 'high' | 'medium' | 'low';
  tags: string;
  notes: string;
  leadSource: 'Website' | 'Referral' | 'Advertisement' | 'Cold Call' | 'Other';
}

export interface EditContactFormData extends ContactFormData {} 
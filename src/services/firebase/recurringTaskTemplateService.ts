import { db } from './firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
  DocumentData
} from 'firebase/firestore';

export interface RecurringTaskTemplate {
  id: string;
  title: string;
  description?: string;
  interval: 'täglich' | 'wöchentlich' | 'monatlich';
  userId: string;
}

const COLLECTION = 'recurringTaskTemplates';

export function subscribeToRecurringTaskTemplates(
  userId: string,
  onUpdate: (templates: RecurringTaskTemplate[]) => void,
  onError: (err: any) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const data: RecurringTaskTemplate[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<RecurringTaskTemplate, 'id'>),
    }));
    onUpdate(data);
  }, onError);
}

export async function addRecurringTaskTemplate(userId: string, template: Omit<RecurringTaskTemplate, 'id' | 'userId'>) {
  await addDoc(collection(db, COLLECTION), {
    ...template,
    userId,
  });
}

export async function deleteRecurringTaskTemplate(userId: string, id: string) {
  // Optional: userId-Check, falls gewünscht
  await deleteDoc(doc(db, COLLECTION, id));
} 
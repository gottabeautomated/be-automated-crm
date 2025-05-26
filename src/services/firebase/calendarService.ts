import { db } from './firebase.config';
import {
  collection,
  addDoc,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
  QueryConstraint,
} from 'firebase/firestore';
import { FirestoreEvent, EventFormData, CalendarDisplayEvent, EVENT_TYPE_DETAILS } from '@/types/calendarTypes';
import { getAuth } from 'firebase/auth';

const getEventsCollectionRef = (userId: string) => {
  if (!userId) throw new Error('User ID cannot be empty when getting events collection ref.');
  return collection(db, `users/${userId}/events`);
};

// Hilfsfunktion zum Kombinieren von Datum und Zeit zu einem Timestamp
const combineDateAndTime = (date: Date, time: string): Timestamp => {
  const [hours, minutes] = time.split(':').map(Number);
  const combinedDate = new Date(date);
  combinedDate.setHours(hours, minutes, 0, 0);
  return Timestamp.fromDate(combinedDate);
};

export const addCalendarEventService = async (userId: string, formData: EventFormData): Promise<string> => {
  const eventCollectionRef = getEventsCollectionRef(userId);

  const startTimestamp = formData.allDay 
    ? Timestamp.fromDate(new Date(formData.startDate.setHours(0,0,0,0))) 
    : combineDateAndTime(formData.startDate, formData.startTime);
  
  const endTimestamp = formData.allDay
    ? Timestamp.fromDate(new Date(formData.endDate.setHours(23,59,59,999))) // Ganztägige Events enden am Ende des Tages
    : combineDateAndTime(formData.endDate, formData.endTime);

  let durationMinutes = 0;
  if (!formData.allDay) {
    const diffMillis = endTimestamp.toMillis() - startTimestamp.toMillis();
    durationMinutes = Math.round(diffMillis / (1000 * 60));
  }

  const newEvent: Omit<FirestoreEvent, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    title: formData.title,
    type: formData.type,
    start: startTimestamp,
    end: endTimestamp,
    allDay: formData.allDay,
    durationMinutes: formData.allDay ? undefined : durationMinutes,
    location: formData.location || '',
    attendees: formData.attendees?.split(',').map(a => a.trim()).filter(a => a) || [],
    notes: formData.notes || '',
    contactId: formData.contactId || null,
    dealId: formData.dealId || null,
    isRecurring: false, // Vorerst keine Wiederholungen
    // recurringPattern: {}, // Vorerst keine Wiederholungen
  };

  const docRef = await addDoc(eventCollectionRef, {
    ...newEvent,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const subscribeToCalendarEvents = (
  userId: string,
  // Filter könnten hier später hinzugefügt werden, z.B. Datumsbereich
  callback: (events: CalendarDisplayEvent[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const eventCollectionRef = getEventsCollectionRef(userId);
    // TODO: Filter für den aktuell sichtbaren Datumsbereich im Kalender hinzufügen
    // Fürs Erste laden wir alle Events, sortiert nach Startdatum
    const q = query(eventCollectionRef, orderBy('start', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const events: CalendarDisplayEvent[] = querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as FirestoreEvent;
        const eventTypeDetail = EVENT_TYPE_DETAILS[data.type];
        return {
          id: docSnapshot.id,
          title: data.title,
          start: data.start.toDate(),
          end: data.end.toDate(),
          allDay: data.allDay,
          resource: {
            type: data.type,
            color: eventTypeDetail?.color || '#3174ad', // Standardfarbe, falls Typ nicht gefunden
            contactId: data.contactId,
            dealId: data.dealId,
            // ... weitere Originaldaten bei Bedarf
            firestoreEvent: data, // Das gesamte Firestore-Event für Details
          },
        };
      });
      callback(events);
    }, (error) => {
      console.error('Error subscribing to calendar events: ', error);
      onError(error);
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up calendar events subscription: ', error);
    onError(error as Error);
    return () => {}; // No-op unsubscribe function on error
  }
};

export const updateCalendarEventService = async (
  userId: string,
  eventId: string,
  formData: EventFormData
): Promise<void> => {
  const eventDocRef = doc(db, `users/${userId}/events`, eventId);

  const startTimestamp = formData.allDay
    ? Timestamp.fromDate(new Date(formData.startDate.setHours(0, 0, 0, 0)))
    : combineDateAndTime(formData.startDate, formData.startTime);

  const endTimestamp = formData.allDay
    ? Timestamp.fromDate(new Date(formData.endDate.setHours(23, 59, 59, 999)))
    : combineDateAndTime(formData.endDate, formData.endTime);

  let durationMinutes = 0;
  if (!formData.allDay) {
    const diffMillis = endTimestamp.toMillis() - startTimestamp.toMillis();
    durationMinutes = Math.round(diffMillis / (1000 * 60));
  }

  const updatedEventData: Partial<FirestoreEvent> = {
    title: formData.title,
    type: formData.type,
    start: startTimestamp,
    end: endTimestamp,
    allDay: formData.allDay,
    durationMinutes: formData.allDay ? undefined : durationMinutes,
    location: formData.location || '',
    attendees: formData.attendees?.split(',').map(a => a.trim()).filter(a => a) || [],
    notes: formData.notes || '',
    contactId: formData.contactId || null,
    dealId: formData.dealId || null,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(eventDocRef, updatedEventData);
};

export const deleteCalendarEventService = async (userId: string, eventId: string): Promise<void> => {
  if (!userId || !eventId) {
    throw new Error('User ID and Event ID are required for deletion.');
  }
  const eventDocRef = doc(db, `users/${userId}/events`, eventId);
  await deleteDoc(eventDocRef);
};

export const updateCalendarEventTimeService = async (
  userId: string,
  eventId: string,
  newStart: Date,
  newEnd: Date,
  isAllDay: boolean
): Promise<void> => {
  if (!userId || !eventId) {
    throw new Error('User ID and Event ID are required to update event time.');
  }
  const eventDocRef = doc(db, `users/${userId}/events`, eventId);

  const startTimestamp = Timestamp.fromDate(newStart);
  const endTimestamp = Timestamp.fromDate(newEnd);

  let durationMinutes = 0;
  if (!isAllDay) {
    const diffMillis = endTimestamp.toMillis() - startTimestamp.toMillis();
    durationMinutes = Math.round(diffMillis / (1000 * 60));
    if (durationMinutes < 0) durationMinutes = 0; // Dauer kann nicht negativ sein
  }

  const timeUpdateData: Partial<FirestoreEvent> = {
    start: startTimestamp,
    end: endTimestamp,
    allDay: isAllDay,
    durationMinutes: isAllDay ? undefined : durationMinutes,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(eventDocRef, timeUpdateData);
  console.log(`Event ${eventId} time updated for user ${userId}. New start: ${newStart}, new end: ${newEnd}, allDay: ${isAllDay}`);
}; 
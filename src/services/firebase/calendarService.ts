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
  getDocs,
  limit as fbLimit,
} from 'firebase/firestore';
import { FirestoreEvent, EventFormData, CalendarDisplayEvent, EVENT_TYPE_DETAILS } from '@/types/calendarTypes';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';

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

// Typ für die Daten, die vom Modal kommen und bereits Timestamps etc. enthalten könnten
type CalendarEventPayload = Omit<FirestoreEvent, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;

export const addCalendarEventService = async (userId: string, eventData: CalendarEventPayload): Promise<string> => {
  const eventCollectionRef = getEventsCollectionRef(userId);

  // Die Daten kommen jetzt bereits im korrekten Format (mit Timestamps etc.) aus dem Modal
  const newEventForFirestore: Omit<FirestoreEvent, 'id'> = {
    userId,
    ...eventData,
    // contactId und dealId sollten bereits korrekt (string oder null) im eventData sein
    // isRecurring und recurringPattern werden hier vorerst nicht gesetzt, Default ist false/undefined
    isRecurring: eventData.isRecurring || false, 
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(eventCollectionRef, newEventForFirestore);
  return docRef.id;
};

export const subscribeToCalendarEvents = (
  userId: string,
  callback: (events: FirestoreEvent[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const eventCollectionRef = getEventsCollectionRef(userId);
    const q = query(eventCollectionRef, orderBy('start', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const firestoreEvents: FirestoreEvent[] = querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as Omit<FirestoreEvent, 'id'>;
        return {
          id: docSnapshot.id,
          ...data,
        } as FirestoreEvent;
      });
      callback(firestoreEvents);
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
  eventData: Partial<CalendarEventPayload> // Erlaube partielle Updates, aber erwarte Timestamps etc. direkt
): Promise<void> => {
  const eventDocRef = doc(db, `users/${userId}/events`, eventId);

  // Das eventData enthält bereits die Felder im korrekten Format (inkl. Timestamps für start/end)
  // Wir fügen nur updatedAt hinzu und stellen sicher, dass keine ungültigen Felder übergeben werden.
  const updatePayload: Partial<FirestoreEvent> = {
    ...eventData,
    updatedAt: Timestamp.now(),
  };

  // Entferne Felder, die nicht direkt Teil von FirestoreEvent sind oder nicht geändert werden sollen
  // (obwohl der Typ CalendarEventPayload das meiste schon abdeckt)
  // delete updatePayload.userId; // Sollte nicht im Payload sein
  // delete updatePayload.id; // Sollte nicht im Payload sein
  // delete updatePayload.createdAt; // Sollte nicht aktualisiert werden

  await updateDoc(eventDocRef, updatePayload);
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

// Neue Funktion, um Tage mit Events für einen bestimmten Monat abzurufen
export const getDaysWithEventsForMonthService = async (
  userId: string,
  year: number,
  month: number // 0-basiert (Januar = 0, Dezember = 11)
): Promise<Date[]> => {
  if (!userId) {
    throw new Error('User ID cannot be empty when fetching days with events.');
  }
  const eventCollectionRef = getEventsCollectionRef(userId);

  // Ersten und letzten Tag des Monats als Timestamp erstellen
  const startDate = new Date(year, month, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // 0ter Tag des nächsten Monats = letzter Tag des aktuellen Monats

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  const q = query(
    eventCollectionRef,
    where('start', '>=', startTimestamp),
    where('start', '<=', endTimestamp)
    // Wir brauchen nicht das ganze Event, nur die Startdaten, aber Firestore erlaubt keine reine Projektion auf das Startdatum
    // wenn wir es in ein Date umwandeln wollen und Duplikate entfernen.
    // Daher holen wir die Events und extrahieren die Tage.
  );

  const querySnapshot = await getDocs(q); // getDocs importieren
  const daysWithEvents: Set<string> = new Set(); // Set, um doppelte Tage zu vermeiden (YYYY-MM-DD)

  querySnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data() as FirestoreEvent;
    const eventStartDate = data.start.toDate();
    // Normalisiere das Datum auf den Tagesanfang (ohne Zeit), um Duplikate zu vermeiden
    const dayString = `${eventStartDate.getFullYear()}-${String(eventStartDate.getMonth() + 1).padStart(2, '0')}-${String(eventStartDate.getDate()).padStart(2, '0')}`;
    daysWithEvents.add(dayString);

    // Wenn ein Event über mehrere Tage geht und allDay ist, auch diese Tage hinzufügen.
    // Für nicht-ganztägige Events, die über Mitternacht gehen, wird nur der Starttag markiert.
    if (data.allDay && data.start.toDate().getTime() !== data.end.toDate().getTime()) {
      let currentDate = new Date(eventStartDate);
      const eventEndDate = data.end.toDate();
      currentDate.setDate(currentDate.getDate() + 1); // Beginne mit dem Tag nach dem Starttag
      
      while (currentDate.getTime() <= eventEndDate.getTime()) {
        if (currentDate.getMonth() === month) { // Nur Tage im abgefragten Monat hinzufügen
            const multiDayString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            daysWithEvents.add(multiDayString);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  });

  return Array.from(daysWithEvents).map(dayStr => {
    const [y, m, d] = dayStr.split('-').map(Number);
    return new Date(y, m - 1, d); // Monat wieder 0-basiert für Date-Konstruktor
  });
};

// Interface für die zurückgegebenen Event-Details
export interface MiniCalendarEventDetail {
  title: string;
  start: Date;
  type: FirestoreEvent['type']; // Bezieht sich auf EventTypeName
  color?: string; // Farbe basierend auf EVENT_TYPE_DETAILS
}

// Neue Funktion, um Event-Details (Titel, Startzeit, Typ) für einen bestimmten Tag abzurufen
export const getEventDetailsForDateService = async (
  userId: string,
  date: Date
): Promise<MiniCalendarEventDetail[]> => {
  if (!userId) {
    throw new Error('User ID cannot be empty when fetching event details.');
  }
  const eventCollectionRef = getEventsCollectionRef(userId);

  // Start und Ende des angefragten Tages als Timestamp
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const startTimestamp = Timestamp.fromDate(dayStart);
  const endTimestamp = Timestamp.fromDate(dayEnd);

  // Query für Events, die an diesem Tag beginnen ODER enden ODER ihn überspannen
  // Einfachere Query: Events, deren Startzeitpunkt innerhalb des Tages liegt.
  // Für ganztägige Events, die den Tag überspannen, müssen wir anders filtern.

  const q = query(
    eventCollectionRef,
    // Bedingung 1: Event startet an diesem Tag
    where('start', '>=', startTimestamp),
    where('start', '<=', endTimestamp)
    // orderBy('start', 'asc') // Sortieren nach Startzeit
    // Diese Query ist nicht perfekt für Events, die den Tag überspannen, aber nicht an ihm starten.
    // Eine komplexere Query wäre nötig, um Events zu finden, die (start <= dayEnd && end >= dayStart).
    // Firestore erlaubt keine OR-Queries auf verschiedenen Feldern direkt.
    // Für den Mini-Kalender-Tooltip ist die Vereinfachung (Events, die an diesem Tag starten) oft ausreichend.
    // Oder wir holen alle Events des Tages und filtern clientseitig genauer.
  );
  
  // Alternative (umfassendere) Abfrage-Strategie:
  // 1. Events, die an diesem Tag beginnen.
  // 2. Ganztägige Events, die vor diesem Tag beginnen und an oder nach diesem Tag enden.
  // Dies erfordert zwei separate Queries und clientseitiges Zusammenführen/Filtern.
  // Fürs Erste belassen wir es bei der einfacheren Query.

  const querySnapshot = await getDocs(q);
  const eventDetails: MiniCalendarEventDetail[] = [];

  querySnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data() as FirestoreEvent;
    const eventTypeDetail = EVENT_TYPE_DETAILS[data.type];
    eventDetails.push({
      title: data.title,
      start: data.start.toDate(),
      type: data.type,
      color: eventTypeDetail?.color
    });
  });
  
  // Sortiere die Events nach ihrer Startzeit
  eventDetails.sort((a, b) => a.start.getTime() - b.start.getTime());

  return eventDetails;
};

/**
 * Ruft eine limitierte Anzahl von bevorstehenden Terminen für einen Benutzer ab.
 * @param userId Die ID des Benutzers.
 * @param limitNum Die maximale Anzahl der abzurufenden Termine.
 * @returns Ein Promise, das ein Array von CalendarDisplayEvent auflöst.
 */
export const getUpcomingEventsService = async (
  userId: string,
  limitNum: number = 5 // Parameter umbenannt, um Klarheit zu schaffen, obwohl fbLimit das Problem löst
): Promise<CalendarDisplayEvent[]> => {
  if (!userId) {
    console.error("User ID is required to get upcoming events.");
    return [];
  }
  try {
    const eventCollectionRef = getEventsCollectionRef(userId);
    const now = Timestamp.now();

    const q = query(
      eventCollectionRef,
      where('start', '>=', now),
      orderBy('start', 'asc'),
      fbLimit(limitNum) // korrigierte Nutzung der Firestore limit-Funktion
    );

    const querySnapshot = await getDocs(q);
    const upcomingEvents: CalendarDisplayEvent[] = querySnapshot.docs.map((docSnapshot) => {
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
          color: eventTypeDetail?.color || '#3174ad',
          contactId: data.contactId,
          dealId: data.dealId,
          location: data.location,
          attendees: data.attendees,
          notes: data.notes,
          reminderOffsetMinutes: data.reminderOffsetMinutes,
          firestoreEvent: { ...data, id: docSnapshot.id }, // Vollständiges Event für Flexibilität
        },
      };
    });
    return upcomingEvents;
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    toast.error("Fehler beim Laden der bevorstehenden Termine.");
    return []; // Im Fehlerfall leeres Array zurückgeben
  }
}; 
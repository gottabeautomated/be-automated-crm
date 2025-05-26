import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as BigCalendarOriginal,
  dateFnsLocalizer,
  Views,
  SlotInfo,
  Event as BigCalendarEvent
} from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { de } from 'date-fns/locale/de';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/services/firebase/AuthProvider';
import { CalendarDisplayEvent, FirestoreEvent } from '@/types/calendarTypes';
import { subscribeToCalendarEvents, deleteCalendarEventService, updateCalendarEventTimeService } from '@/services/firebase/calendarService';
import { AddEditEventModal } from '@/components/calendar/AddEditEventModal';
import { EventDetailPopover } from '@/components/calendar/EventDetailPopover';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { toast } from 'sonner';

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CalendarPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarDisplayEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States für das Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInitialStartTimeForModal, setSelectedInitialStartTimeForModal] = useState<Date | undefined>(undefined);
  const [selectedInitialEndTimeForModal, setSelectedInitialEndTimeForModal] = useState<Date | undefined>(undefined);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<FirestoreEvent | null>(null);

  // States für das Event Detail Popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedEventForPopover, setSelectedEventForPopover] = useState<CalendarDisplayEvent | null>(null);
  const [popoverAnchorElement, setPopoverAnchorElement] = useState<HTMLElement | null>(null);

  // --- Optimistisches Update States ---
  // Optional, aber gut für die UX: Temporäre Events während des Ladens/Fehlers
  const [optimisticEvents, setOptimisticEvents] = useState<CalendarDisplayEvent[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      console.warn("User not logged in, calendar will not load events.");
      setEvents([]);
      setCalendarLoading(false);
      setError("Bitte anmelden, um den Kalender zu nutzen.");
      return;
    }

    setCalendarLoading(true);
    const unsubscribe = subscribeToCalendarEvents(
      user.uid,
      (loadedEvents) => {
        setEvents(loadedEvents);
        setCalendarLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching calendar events:', err);
        setError('Fehler beim Laden der Kalenderereignisse.');
        setCalendarLoading(false);
        setOptimisticEvents([]); // Optimistische Events bei Fehler zurücksetzen
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, navigate]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    console.log('[CalendarPage] handleSelectSlot triggered:', slotInfo);
    if (slotInfo.action === 'select') { 
        setSelectedInitialStartTimeForModal(slotInfo.start);
        setSelectedInitialEndTimeForModal(slotInfo.end); 
    } else if (slotInfo.action === 'click') { // Nutzer hat auf einen einzelnen Slot/Zeitpunkt geklickt
        setSelectedInitialStartTimeForModal(slotInfo.start);
        // Für einen reinen Klick soll die Dauer-Logik im Modal greifen.
        // Daher wird initialEndTime gleich initialStartTime gesetzt, damit hasExplicitEndTime im Modal false wird.
        setSelectedInitialEndTimeForModal(slotInfo.start); 
    } else {
        return; // Andere Aktionen (z.B. 'doubleClick') ignorieren wir vorerst
    }
    setSelectedEventToEdit(null); 
    setIsModalOpen(true);
    setIsPopoverOpen(false); 
  }, []);

  const handleSelectEvent = useCallback((event: BigCalendarEvent, e: React.SyntheticEvent<HTMLElement>) => {
    setSelectedEventForPopover(event as CalendarDisplayEvent);
    setPopoverAnchorElement(e.currentTarget as HTMLElement);
    setIsPopoverOpen(true);
    setIsModalOpen(false); // Sicherstellen, dass das Add/Edit Modal geschlossen ist
  }, []);

  const handleEditEventFromPopover = (event: CalendarDisplayEvent) => {
    if (event.resource?.firestoreEvent) {
      setSelectedEventToEdit(event.resource.firestoreEvent as FirestoreEvent);
      setSelectedInitialStartTimeForModal(undefined); // Kein Slot, da Event ausgewählt
      setIsModalOpen(true); // Öffne AddEditEventModal
      setIsPopoverOpen(false); // Schließe Popover
    }
  };

  const handleDeleteEventFromPopover = async (userIdToDelete: string, eventId: string) => {
    if (!userIdToDelete || !eventId) {
      toast.error("Fehler: Event-Informationen für Löschung unvollständig.");
      return;
    }
    // Hier könnte man einen Bestätigungsdialog einbauen (z.B. ShadCN Alert Dialog)
    // Fürs Erste direkt löschen:
    try {
      await deleteCalendarEventService(userIdToDelete, eventId);
      toast.success("Termin erfolgreich gelöscht!");
      setIsPopoverOpen(false); // Schließe Popover
      // Der Subscriber sollte die Event-Liste automatisch aktualisieren.
    } catch (error) {
      console.error("Error deleting event from popover:", error);
      toast.error("Fehler beim Löschen des Termins.");
    }
  };

  const handleEventDrop = useCallback(async (
    args: any
  ) => {
    const { event, start, end, isAllDay } = args as { event: CalendarDisplayEvent, start: Date, end: Date, isAllDay?: boolean };

    if (!user?.uid || !event.id) {
      toast.error("Fehler: Event oder Benutzer nicht identifiziert.");
      return;
    }
    console.log('[CalendarPage] handleEventDrop triggered:', { event, start, end, isAllDay });
    
    const resolvedIsAllDay = typeof isAllDay === 'boolean' ? isAllDay : !!event.allDay;

    console.log(`Event dropped: ${event.id}, New Start: ${start}, New End: ${end}, AllDay: ${resolvedIsAllDay}`);

    const originalEvent = events.find(e => e.id === event.id);
    if (!originalEvent) return;

    setEvents(prevEvents => 
      prevEvents.map(e => 
        e.id === event.id ? { ...e, start, end, allDay: resolvedIsAllDay } : e
      )
    );

    try {
      await updateCalendarEventTimeService(user.uid, event.id, start, end, resolvedIsAllDay);
      toast.success("Termin erfolgreich verschoben!");
    } catch (error) {
      console.error("Error updating event time after drop:", error);
      toast.error("Fehler beim Verschieben des Termins.");
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id ? { ...e, start: originalEvent.start, end: originalEvent.end, allDay: originalEvent.allDay } : e
        )
      );
    }
  }, [user, events]);

  const handleEventResize = useCallback(async (
    args: any
  ) => {
    const { event, start, end } = args as { event: CalendarDisplayEvent, start: Date, end: Date };

    if (!user?.uid || !event.id) {
      toast.error("Fehler: Event oder Benutzer nicht identifiziert.");
      return;
    }
    console.log('[CalendarPage] handleEventResize triggered:', { event, start, end });

    const originalEvent = events.find(e => e.id === event.id);
    if (!originalEvent) return;

    setEvents(prevEvents => 
      prevEvents.map(e => 
        e.id === event.id ? { ...e, start, end } : e
      )
    );

    try {
      await updateCalendarEventTimeService(user.uid, event.id, start, end, !!event.allDay);
      toast.success("Termindauer erfolgreich angepasst!");
    } catch (error) {
      console.error("Error updating event time after resize:", error);
      toast.error("Fehler beim Anpassen der Termindauer.");
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id ? { ...e, start: originalEvent.start, end: originalEvent.end } : e
        )
      );
    }
  }, [user, events]);

  const eventPropGetter = useCallback(
    (event: BigCalendarEvent, start: Date, end: Date, isSelected: boolean) => {
      const displayEvent = event as CalendarDisplayEvent; 
      const backgroundColor = displayEvent.resource?.color || '#3174ad';
      const style: React.CSSProperties = {
        backgroundColor,
        borderRadius: '5px',
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '2px 5px',
        lineHeight: '1.2',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      };
      return {
        style,
        className: '',
        // draggable: true, // draggable wird vom HOC gesteuert, falls aktiv
      };
    },
    []
  );

  const maxTime = new Date();
  maxTime.setHours(23, 59, 59);

  const slotPropGetter = useCallback((date: Date) => {
    const hour = date.getHours();
    if (hour < 6 || hour >= 22) { // Stunden vor 6 Uhr oder ab 22 Uhr
      return {
        style: {
          backgroundColor: '#f0f0f0', // Helles Grau für Randzeiten
        },
      };
    }
    return {};
  }, []);

  console.log('[CalendarPage] Current events:', events); // Events loggen

  if (authLoading) {
    return <div className="p-4 flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600"></div></div>;
  }

  if (!user) {
    return <div className="p-4 text-orange-500">Bitte anmelden, um den Kalender zu sehen.</div>;
  }
  if (calendarLoading) {
    return <div className="p-4">Lade Kalenderereignisse...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const minTime = new Date();
  minTime.setHours(0, 0, 0);

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-var(--header-height))] flex flex-col">
        <div className="flex-grow">
          <BigCalendarOriginal 
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            selectable 
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            culture='de'
            step={15} 
            timeslots={4} 
            min={minTime} 
            max={maxTime}
            slotPropGetter={slotPropGetter} 
            eventPropGetter={eventPropGetter}
            messages={{
              allDay: 'Ganztägig',
              previous: 'Zurück',
              next: 'Weiter',
              today: 'Heute',
              month: 'Monat',
              week: 'Woche',
              day: 'Tag',
              agenda: 'Agenda',
              date: 'Datum',
              time: 'Uhrzeit',
              event: 'Ereignis',
              noEventsInRange: 'Keine Ereignisse in diesem Bereich.',
              showMore: (total: number) => `+${total} weitere`,
            }}
          />
        </div>
        <div className="mt-4">
          <CalendarLegend />
        </div>
      </div>
      {isModalOpen && (
        <AddEditEventModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          initialStartTime={selectedInitialStartTimeForModal}
          initialEndTime={selectedInitialEndTimeForModal}
          eventToEdit={selectedEventToEdit}
          userId={user?.uid}
          onEventAdded={(eventId) => {
            console.log("Event added:", eventId);
            // Hier könnte man die Event-Liste aktualisieren, aber der Subscriber sollte das automatisch tun
          }}
          onEventUpdated={(eventId) => {
            console.log("Event updated:", eventId);
            // Der Subscriber sollte dies ebenfalls automatisch handhaben.
            setIsModalOpen(false); // Modal nach Update schließen
          }}
        />
      )}
      {isPopoverOpen && selectedEventForPopover && user?.uid && (
        <EventDetailPopover
          isOpen={isPopoverOpen}
          onOpenChange={setIsPopoverOpen}
          event={selectedEventForPopover}
          userId={user.uid}
          anchorElement={popoverAnchorElement}
          onEdit={handleEditEventFromPopover}
          onDelete={handleDeleteEventFromPopover}
        />
      )}
    </>
  );
};

export default CalendarPage; 
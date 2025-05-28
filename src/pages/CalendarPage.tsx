import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as BigCalendarOriginal,
  dateFnsLocalizer,
  Views,
  SlotInfo,
  Event as BigCalendarEvent,
  View as CalendarViewType,
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { getDay } from 'date-fns/getDay';
import { de } from 'date-fns/locale/de';
import { useNavigate, useLocation } from 'react-router-dom';
import { isSameDay } from 'date-fns';

import { useAuth } from '@/services/firebase/AuthProvider';
import { CalendarDisplayEvent, FirestoreEvent, EventTypeName, EVENT_TYPE_DETAILS } from '@/types/calendarTypes';
import { subscribeToCalendarEvents, deleteCalendarEventService, updateCalendarEventTimeService } from '@/services/firebase/calendarService';
import { getContactListForUser, ContactQuickSelectItem } from '@/services/firebase/contactService';
import { getDealListForUser, DealQuickSelectItem } from '@/services/firebase/dealService';
import { AddEditEventModal } from '@/components/calendar/AddEditEventModal';
import CustomCalendarToolbar from '@/components/calendar/CustomCalendarToolbar';
import { EventDetailPopover } from '@/components/calendar/EventDetailPopover';
import { toast } from 'sonner';
import { showNotification, requestNotificationPermission } from '@/services/notificationService';
import { getOccurrences } from '@/lib/rruleUtils';
import { RRule } from 'rrule';

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

const DraggableCalendar = withDragAndDrop(BigCalendarOriginal);

const CalendarPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<CalendarDisplayEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  const [activeEventTypeFilters, setActiveEventTypeFilters] = useState<EventTypeName[]>([]);
  const [activeContactFilter, setActiveContactFilter] = useState<string | null>(null);
  const [contactList, setContactList] = useState<ContactQuickSelectItem[]>([]);
  const [activeDealFilter, setActiveDealFilter] = useState<string | null>(null);
  const [dealList, setDealList] = useState<DealQuickSelectItem[]>([]);

  // States für das Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInitialStartTimeForModal, setSelectedInitialStartTimeForModal] = useState<Date | undefined>(undefined);
  const [selectedInitialEndTimeForModal, setSelectedInitialEndTimeForModal] = useState<Date | undefined>(undefined);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<FirestoreEvent | null>(null);

  // States für das Event Detail Popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedEventForPopover, setSelectedEventForPopover] = useState<CalendarDisplayEvent | null>(null);
  const [popoverAnchorElement, setPopoverAnchorElement] = useState<HTMLElement | null>(null);

  // State für Notification-Timeouts
  const [notificationTimeouts, setNotificationTimeouts] = useState<number[]>([]);

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
      (loadedFirestoreEvents: FirestoreEvent[]) => {
        const allDisplayEvents: CalendarDisplayEvent[] = [];
        const calendarViewBounds = getCurrentViewBounds(currentCalendarDate, currentView as CalendarViewType);

        loadedFirestoreEvents.forEach(event => {
          if (event.isRecurring && event.rruleString && event.id) {
            const occurrences = getOccurrences(event, calendarViewBounds.start, calendarViewBounds.end);
            allDisplayEvents.push(...occurrences);
          } else {
            const eventTypeDetail = EVENT_TYPE_DETAILS[event.type as EventTypeName];
            allDisplayEvents.push({
              id: event.id,
              title: event.title,
              start: event.start.toDate(),
              end: event.end.toDate(),
              allDay: event.allDay,
              resource: {
                type: event.type,
                color: eventTypeDetail?.color || '#3174ad',
                contactId: event.contactId,
                dealId: event.dealId,
                location: event.location,
                attendees: event.attendees,
                notes: event.notes,
                reminderOffsetMinutes: event.reminderOffsetMinutes,
                firestoreEvent: event,
                isOccurrence: false,
              },
            });
          }
        });

        setEvents(allDisplayEvents);
        setCalendarLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching calendar events:', err);
        setError('Fehler beim Laden der Kalenderereignisse.');
        setCalendarLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, currentView, currentCalendarDate]);

  useEffect(() => {
    if (location.state?.selectedDate) {
      const dateFromState = parse(location.state.selectedDate, 'yyyy-MM-dd', new Date());
      if (!isNaN(dateFromState.valueOf())) {
        setCurrentCalendarDate(dateFromState);
        setHighlightedDate(dateFromState);
      }
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (user?.uid) {
      getContactListForUser(user.uid)
        .then(setContactList)
        .catch(error => {
          console.error("Error fetching contact list for filter:", error);
          toast.error("Fehler beim Laden der Kontaktliste für Filter.");
        });
      getDealListForUser(user.uid)
        .then(setDealList)
        .catch(error => {
          console.error("Error fetching deal list for filter:", error);
          toast.error("Fehler beim Laden der Deal-Liste für Filter.");
        });
    }
  }, [user?.uid]);

  // Effekt für Benachrichtigungs-Scheduling
  useEffect(() => {
    // Zuerst alle bestehenden Timeouts löschen
    notificationTimeouts.forEach(clearTimeout);
    setNotificationTimeouts([]); // Timeout-Array zurücksetzen

    if (!user || events.length === 0 || Notification.permission !== 'granted') {
      if (Notification.permission === 'default') {
        // Optional: Nutzer einmalig fragen, wenn er die Seite lädt und Events hat
        // Dies könnte man auch an anderer Stelle (z.B. beim Setzen einer Erinnerung) machen
        // requestNotificationPermission().then(p => {
        //   if (p === 'granted') toast.success("Browser-Benachrichtigungen erlaubt!");
        // });
      }
      return;
    }

    const newTimeouts: number[] = [];
    const now = new Date().getTime();

    events.forEach(event => {
      const firestoreEvent = event.resource?.firestoreEvent as FirestoreEvent | undefined;
      if (firestoreEvent?.reminderOffsetMinutes !== null && firestoreEvent?.reminderOffsetMinutes !== undefined) {
        const reminderOffset = firestoreEvent.reminderOffsetMinutes * 60 * 1000; // in Millisekunden
        const reminderTime = event.start.getTime() - reminderOffset;

        if (reminderTime > now) {
          const timeoutId = setTimeout(() => {
            const timeToEvent = event.start.getTime() - new Date().getTime();
            let notificationBody = `Beginnt um ${format(event.start, 'HH:mm', { locale: de })} Uhr.`;
            if (firestoreEvent.location) {
              notificationBody += ` Ort: ${firestoreEvent.location}`;
            }

            if (timeToEvent > 0 && timeToEvent < 2 * 60 * 1000) { // Weniger als 2 Minuten bis zum Event
                 notificationBody = `Beginnt jetzt: ${format(event.start, 'HH:mm', { locale: de })} Uhr`;
            } else if (firestoreEvent.reminderOffsetMinutes === 0) {
                notificationBody = `Beginnt jetzt: ${format(event.start, 'HH:mm', { locale: de })} Uhr`;
            }
            
            showNotification(event.title, {
              body: notificationBody,
              icon: '/logo.png', // Pfad zu einem passenden Icon, ggf. anpassen
              tag: event.id, // Verhindert doppelte Notifications für dasselbe Event bei schnellen Updates
            });
          }, reminderTime - now);
          newTimeouts.push(timeoutId);
        }
      }
    });

    setNotificationTimeouts(newTimeouts);

    // Cleanup-Funktion: Alle Timeouts löschen, wenn die Komponente unmounted wird
    // oder bevor der Effekt erneut ausgeführt wird.
    return () => {
      newTimeouts.forEach(clearTimeout);
    };
  }, [events, user, authLoading]);

  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentCalendarDate(newDate);
    setHighlightedDate(null);
  }, []);

  const handleViewChange = useCallback((view: typeof Views[keyof typeof Views]) => {
    setCurrentView(view);
    setHighlightedDate(null);
  }, []);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    console.log('[CalendarPage] handleSelectSlot triggered:', slotInfo);
    if (slotInfo.action === 'select') { 
        setSelectedInitialStartTimeForModal(slotInfo.start);
        setSelectedInitialEndTimeForModal(slotInfo.end); 
    } else if (slotInfo.action === 'click') { 
        setSelectedInitialStartTimeForModal(slotInfo.start);
        setSelectedInitialEndTimeForModal(slotInfo.start); 
    } else {
        return; 
    }
    setSelectedEventToEdit(null); 
    setIsModalOpen(true);
    setIsPopoverOpen(false); 
    setHighlightedDate(null);
  }, []);

  const handleSelectEvent = useCallback((event: BigCalendarEvent, e: React.SyntheticEvent<HTMLElement>) => {
    setSelectedEventForPopover(event as CalendarDisplayEvent);
    setPopoverAnchorElement(e.currentTarget as HTMLElement);
    setIsPopoverOpen(true);
    setIsModalOpen(false);
    setHighlightedDate(null);
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

  const dayPropGetter = useCallback((date: Date) => {
    if (highlightedDate && isSameDay(date, highlightedDate)) {
      return {
        className: 'highlighted-day-from-mini-calendar',
      };
    }
    return {};
  }, [highlightedDate]);

  console.log('[CalendarPage] Current events:', events); // Events loggen

  // Hilfsfunktion, um die Grenzen des aktuellen Kalender-Views zu bekommen
  // Diese Funktion muss die Logik von react-big-calendar nachahmen oder dessen Infos nutzen
  // Für eine Monatsansicht: Erster sichtbarer Tag bis letzter sichtbarer Tag
  // Für eine Wochenansicht: Montag bis Sonntag der aktuellen Woche
  // Dies ist eine vereinfachte Annahme und muss ggf. präziser implementiert werden.
  const getCurrentViewBounds = (date: Date, view: CalendarViewType): { start: Date, end: Date } => {
    let start = new Date(date);
    let end = new Date(date);
    
    if (view === Views.MONTH) {
      start = startOfMonth(date);
      end = endOfMonth(date);
      // Kalender zeigen oft auch Tage des Vor-/Folge-Monats an, um die Wochen aufzufüllen
      // Für eine genaue Berechnung müssten wir die Logik von BigCalendar kennen oder dessen range() nutzen
      start = startOfWeek(start, { weekStartsOn: 1 });
      end = endOfWeek(end, { weekStartsOn: 1 }); 
      // Um sicherzustellen, dass wir genug Puffer haben, können wir noch etwas erweitern
      // start = subDays(start, 7); // Eine Woche vorher
      // end = addDays(end, 7);   // Eine Woche danach
    } else if (view === Views.WEEK) {
      start = startOfWeek(date, { weekStartsOn: 1 });
      end = endOfWeek(date, { weekStartsOn: 1 });
    } else if (view === Views.DAY) {
      start = startOfDay(date);
      end = endOfDay(date);
    } else if (view === Views.AGENDA) {
      // Agenda zeigt typischerweise einen längeren Zeitraum, z.B. 30 Tage
      start = startOfDay(date);
      end = endOfDay(addDays(date, 30)); // Beispiel: 30 Tage Agenda
    } else {
        // Fallback oder spezifische Logik für andere Views
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
    }
    // Sicherheitspuffer, um sicherzustellen, dass rrule.between() alle relevanten Daten erfasst
    // Besonders wenn der Kalender mehr als den exakten Monat/Woche anzeigt.
    // Ein größerer Puffer ist für die Generierung sicher, kann aber Performance kosten.
    // Eine präzisere Methode wäre, die `range` direkt von BigCalendar zu bekommen, falls möglich.
    return { start: subDays(start, 7) , end: addDays(end, 7) }; 
  };

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

  // Gefilterte Events basierend auf allen aktiven Filtern
  const filteredEvents = events.filter(event => {
    const typeMatch = activeEventTypeFilters.length === 0 || 
                      (event.resource?.type && activeEventTypeFilters.includes(event.resource.type as EventTypeName));
    
    const contactMatch = !activeContactFilter || 
                         (event.resource?.contactId === activeContactFilter);

    const dealMatch = !activeDealFilter || 
                      (event.resource?.dealId === activeDealFilter);
    
    return typeMatch && contactMatch && dealMatch;
  });

  const minTime = new Date();
  minTime.setHours(0, 0, 0);

  // Die Toolbar-Komponente mit den notwendigen Props erstellen
  const components = {
    toolbar: (toolbarProps: any) => (
      <CustomCalendarToolbar
        {...toolbarProps}
        activeEventTypeFilters={activeEventTypeFilters}
        onEventTypeFilterChange={setActiveEventTypeFilters}
        contactList={contactList}
        activeContactFilter={activeContactFilter}
        onContactFilterChange={setActiveContactFilter}
        dealList={dealList}
        activeDealFilter={activeDealFilter}
        onDealFilterChange={setActiveDealFilter}
      />
    ),
  };

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-var(--header-height))] flex flex-col">
        <div className="flex-grow">
          <DraggableCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor={(event: BigCalendarEvent) => (event as CalendarDisplayEvent).start}
            endAccessor={(event: BigCalendarEvent) => (event as CalendarDisplayEvent).end}
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            defaultView={Views.WEEK}
            view={currentView}
            date={currentCalendarDate}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            resizable
            culture='de'
            step={15} 
            timeslots={4} 
            min={minTime} 
            max={maxTime}
            slotPropGetter={slotPropGetter} 
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            components={components}
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
      </div>
    </>
  );
};

export default CalendarPage; 
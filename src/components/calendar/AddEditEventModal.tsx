import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, AlertTriangle } from 'lucide-react'; // Calendar Icon
import { Calendar } from '@/components/ui/calendar'; // ShadCN Calendar
import { format, parse as parseDateFns, setHours, setMinutes, isValid,getHours, getMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

import { EventFormData, EVENT_TYPES, EVENT_TYPE_DETAILS, FirestoreEvent, EventTypeName } from '@/types/calendarTypes';
import { addCalendarEventService, updateCalendarEventService, deleteCalendarEventService } from '@/services/firebase/calendarService';
// TODO: Später updateCalendarEventService importieren
import { useAuth } from '@/services/firebase/AuthProvider';
import { getContactListForUser, ContactQuickSelectItem } from '@/services/firebase/contactService';
import { getDealListForUser, DealQuickSelectItem } from '@/services/firebase/dealService';
import { requestNotificationPermission } from '@/services/notificationService'; // Import für Benachrichtigungen
import { generateRRuleFromFormData } from '@/lib/rruleUtils'; // Import der neuen Funktion
// TODO: Services zum Laden von Kontakten und Deals für die Auswahl importieren

interface AddEditEventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventToEdit?: FirestoreEvent | null;
  initialStartTime?: Date;
  initialEndTime?: Date;
  userId: string | undefined;
  onEventAdded?: (eventId: string) => void;
  onEventUpdated?: (eventId: string) => void;
}

const initialFormData: EventFormData = {
  title: '',
  type: EVENT_TYPES.MEETING,
  startDate: new Date(),
  startTime: format(setMinutes(setHours(new Date(), 9),0), 'HH:mm'), // Default 09:00
  endDate: new Date(),
  endTime: format(setMinutes(setHours(new Date(), 10),0), 'HH:mm'), // Default 10:00
  allDay: false,
  location: '',
  attendees: '',
  notes: '',
  contactId: null,
  dealId: null,
  reminderOffsetMinutes: 'none', // Standardmäßig keine Erinnerung
  // Initialwerte für Serientermine
  isRecurring: false,
  recurrenceFrequency: 'none',
  recurrenceInterval: 1,
  recurrenceByDay: [],
  recurrenceEndType: 'never',
  recurrenceEndDateForm: null,
  recurrenceOccurrences: 10, // Ein Standardwert, falls 'afterOccurrences' gewählt wird
};

// Optionen für das Reminder-Dropdown
const reminderOptions = [
  { value: 'none', label: 'Keine Erinnerung' },
  { value: '0', label: 'Zur Startzeit' },
  { value: '5', label: '5 Minuten vorher' },
  { value: '15', label: '15 Minuten vorher' },
  { value: '30', label: '30 Minuten vorher' },
  { value: '60', label: '1 Stunde vorher' },
  { value: '1440', label: '1 Tag vorher' }, // 24 * 60
];

// Optionen für die Wiederholungsfrequenz
const recurrenceFrequencyOptions = [
  { value: 'none', label: 'Nicht wiederholen' }, // Wird durch Checkbox gesteuert, aber als Default
  { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'monthly', label: 'Monatlich' },
  { value: 'yearly', label: 'Jährlich' },
];

const daysOfWeekOptions = [
  { value: 'SU', label: 'So' }, // RRule verwendet SU, MO, TU, WE, TH, FR, SA
  { value: 'MO', label: 'Mo' },
  { value: 'TU', label: 'Di' },
  { value: 'WE', label: 'Mi' },
  { value: 'TH', label: 'Do' },
  { value: 'FR', label: 'Fr' },
  { value: 'SA', label: 'Sa' },
];

const recurrenceEndTypeOptions = [
  { value: 'never', label: 'Nie' },
  { value: 'onDate', label: 'An Datum' },
  { value: 'afterOccurrences', label: 'Nach Anzahl' },
];

export const AddEditEventModal: React.FC<AddEditEventModalProps> = ({
  isOpen, onOpenChange, eventToEdit, initialStartTime, initialEndTime, userId, onEventAdded, onEventUpdated
}) => {
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExplicitEndTime, setHasExplicitEndTime] = useState(false);

  // States für Kontakt- und Deal-Listen
  const [contactList, setContactList] = useState<ContactQuickSelectItem[]>([]);
  const [dealList, setDealList] = useState<DealQuickSelectItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);

  const { user } = useAuth(); // Holen wir uns den User direkt hier für die ID

  const isEditMode = useMemo(() => !!eventToEdit, [eventToEdit]);

  // Effekt zum Laden von Kontakten und Deals
  useEffect(() => {
    if (isOpen && user?.uid) {
      const fetchLists = async () => {
        setIsLoadingContacts(true);
        setIsLoadingDeals(true);
        try {
          const contacts = await getContactListForUser(user.uid);
          setContactList(contacts);
        } catch (error) {
          console.error("Error fetching contacts for modal:", error);
          toast.error("Fehler beim Laden der Kontakte.");
        }
        setIsLoadingContacts(false);

        try {
          const deals = await getDealListForUser(user.uid);
          setDealList(deals);
        } catch (error) {
          console.error("Error fetching deals for modal:", error);
          toast.error("Fehler beim Laden der Deals.");
        }
        setIsLoadingDeals(false);
      };
      fetchLists();
    }
  }, [isOpen, user?.uid]);

  useEffect(() => {
    console.log('[Modal Effect 1] Start - Props:', { isOpen, eventToEdit, initialStartTime, initialEndTime, isEditMode });
    // console.log('[Modal Effect 1] Start - Current formData (vorher):', JSON.parse(JSON.stringify(formData)));
    // console.log('[Modal Effect 1] Start - Current hasExplicitEndTime (vorher):', hasExplicitEndTime);

    if (isOpen) {
      if (eventToEdit && isEditMode) {
        console.log('[Modal Effect 1] In Edit Mode');
        setHasExplicitEndTime(true); 
        const editFormData = {
          title: eventToEdit.title,
          type: eventToEdit.type,
          startDate: eventToEdit.start.toDate(),
          startTime: format(eventToEdit.start.toDate(), 'HH:mm'),
          endDate: eventToEdit.end.toDate(),
          endTime: format(eventToEdit.end.toDate(), 'HH:mm'),
          allDay: !!eventToEdit.allDay, 
          location: eventToEdit.location || '',
          attendees: eventToEdit.attendees?.join(', ') || '',
          notes: eventToEdit.notes || '',
          contactId: eventToEdit.contactId || null,
          dealId: eventToEdit.dealId || null,
          reminderOffsetMinutes: eventToEdit.reminderOffsetMinutes?.toString() || 'none',
          // TODO: Felder für Serientermine aus eventToEdit befüllen, wenn rruleString vorhanden
          // Dies erfordert das Parsen des rruleString, was wir später machen.
          // Vorerst bleiben die Standardwerte, wenn ein Event editiert wird.
          isRecurring: eventToEdit.isRecurring || initialFormData.isRecurring,
          recurrenceFrequency: initialFormData.recurrenceFrequency, // Placeholder, später aus rrule parsen
          recurrenceInterval: initialFormData.recurrenceInterval, // Placeholder
          recurrenceByDay: initialFormData.recurrenceByDay, // Placeholder
          recurrenceEndType: initialFormData.recurrenceEndType, // Placeholder
          recurrenceEndDateForm: eventToEdit.recurrenceEndDate ? eventToEdit.recurrenceEndDate.toDate() : null, // Enddatum direkt übernehmen
          recurrenceOccurrences: initialFormData.recurrenceOccurrences, // Placeholder
        };
        // console.log('[Modal Effect 1] Setting formData for Edit:', JSON.parse(JSON.stringify(editFormData)));
        setFormData(editFormData);

      } else if (initialStartTime) {
        console.log('[Modal Effect 1] New Event Mode with initialStartTime:', initialStartTime);
        const newStartDate = new Date(initialStartTime);
        const newStartTime = format(initialStartTime, 'HH:mm');
        
        let finalEndDate = new Date(newStartDate); // Standardmäßig gleicher Tag
        let finalEndTime = newStartTime;         // Standardmäßig gleiche Zeit (wird ggf. überschrieben)
        let currentHasExplicitEndTime = false;

        if (initialEndTime && initialEndTime.getTime() !== initialStartTime.getTime()) {
          console.log('[Modal Effect 1] Explicit initialEndTime detected:', initialEndTime);
          finalEndDate = new Date(initialEndTime);
          finalEndTime = format(initialEndTime, 'HH:mm');
          currentHasExplicitEndTime = true;
          setHasExplicitEndTime(true);

          const newFormValuesFromDrag = {
            ...initialFormData, 
            title: '', 
            allDay: false, 
            // type bleibt erstmal vom initialFormData oder vorherigen state
            startDate: newStartDate,
            startTime: newStartTime,
            endDate: finalEndDate,
            endTime: finalEndTime,
            contactId: null, 
            dealId: null, 
            reminderOffsetMinutes: initialFormData.reminderOffsetMinutes, // Übernehme Standardwert
          };
          console.log('[Modal Effect 1] Setting formData for New Event (from Drag):', JSON.parse(JSON.stringify(newFormValuesFromDrag)));
          setFormData(newFormValuesFromDrag);

        } else {
          // Klick auf einzelnen Slot - KEINE explizite Endzeit durch Nutzer
          console.log('[Modal Effect 1] Single Click detected - calculating duration-based end time.');
          currentHasExplicitEndTime = false;
          setHasExplicitEndTime(false);

          // Typ vom aktuellen Formular nehmen oder initialFormData.type
          // Wichtig: formData.type ist hier noch der Wert aus dem *vorherigen* Renderzyklus oder initial.
          // Um den korrekten Typ zu verwenden, falls er im UI bereits geändert wurde, greifen wir auf einen stabilen Wert zurück
          // oder müssen den Typ-Select anders behandeln. Sicherer ist es, vom initialFormData auszugehen oder
          // eine State-Variable für den Typ zu haben, die hier gelesen wird.
          // Fürs Erste verwenden wir den Typ, der im `formData` wäre, falls es nicht geleert wird.
          // Besser: Wir nehmen den initialFormData.type als Basis für die erste Berechnung.
          const eventTypeForDuration = formData.type || initialFormData.type; 
          const eventTypeDetail = EVENT_TYPE_DETAILS[eventTypeForDuration as EventTypeName];
          const defaultDuration = eventTypeDetail?.defaultDurationMinutes;

          if (defaultDuration) {
            try {
              const combinedStartDateTime = setMinutes(setHours(newStartDate, parseInt(newStartTime.split(':')[0],10)), parseInt(newStartTime.split(':')[1],10));
              if (isValid(combinedStartDateTime)) {
                finalEndDate = new Date(combinedStartDateTime.getTime() + defaultDuration * 60000);
                finalEndTime = format(finalEndDate, 'HH:mm');
                console.log('[Modal Effect 1] Calculated duration-based end time:', { finalEndDate, finalEndTime });
              }
            } catch (error) {
              console.error("[Modal Effect 1] Error calculating duration-based end date/time:", error);
              // Fallback: Endzeit = Startzeit
              finalEndDate = new Date(newStartDate);
              finalEndTime = newStartTime;
            }
          } else {
             // Kein Default-Duration: Endzeit = Startzeit
            finalEndDate = new Date(newStartDate);
            finalEndTime = newStartTime;
            console.log('[Modal Effect 1] No default duration, end time = start time.');
          }
          
          const newFormValuesFromClick = {
            ...initialFormData, 
            title: '', 
            allDay: false, 
            type: eventTypeForDuration, 
            startDate: newStartDate,
            startTime: newStartTime,
            endDate: finalEndDate, // Die hier berechnete Endzeit
            endTime: finalEndTime, // Die hier berechnete Endzeit
            contactId: null, 
            dealId: null, 
            reminderOffsetMinutes: initialFormData.reminderOffsetMinutes, // Übernehme Standardwert
          };
          console.log('[Modal Effect 1] Setting formData for New Event (from Click):', JSON.parse(JSON.stringify(newFormValuesFromClick)));
          setFormData(newFormValuesFromClick);
        }
      } else {
        console.log('[Modal Effect 1] No specific mode, setting to initialFormData');
        setHasExplicitEndTime(false); 
        setFormData(initialFormData);
      }
    } else {
      // console.log('[Modal Effect 1] Modal is closed, not processing.');
    }
  // }, [isOpen, eventToEdit, initialStartTime, initialEndTime, isEditMode, formData.type]); // formData.type als dep hinzugefügt für Typ-Änderung
  // ACHTUNG: formData.type als Dependency hier kann zu Schleifen führen, wenn setFormData den Typ nicht ändert.
  // Besser ist es, die Neuberechnung bei Typänderung in einem separaten Effekt zu behandeln.
  }, [isOpen, eventToEdit, initialStartTime, initialEndTime, isEditMode]);


  // Separater Effekt für die Anpassung der Endzeit, wenn sich der TYP ändert
  // und KEINE explizite Endzeit durch den Nutzer gesetzt wurde (z.B. durch Ziehen im Kalender)
  useEffect(() => {
    console.log('[Modal Effect TypeChange] Start - Condition Values:', { hasExplicitEndTime, isEditMode, type: formData.type, startDate: formData.startDate, startTime: formData.startTime, allDay: formData.allDay});
    console.log('[Modal Effect TypeChange] Start - Current formData:', JSON.parse(JSON.stringify(formData)));

    if (!isEditMode && !hasExplicitEndTime && !formData.allDay && formData.type && formData.startDate && formData.startTime) {
      console.log('[Modal Effect TypeChange] Condition MET - Recalculating end time due to type change');
      const eventTypeDetail = EVENT_TYPE_DETAILS[formData.type as EventTypeName];
      const defaultDuration = eventTypeDetail?.defaultDurationMinutes;

      if (defaultDuration) {
        try {
          const startDate = new Date(formData.startDate);
          const [hours, minutes] = formData.startTime.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const combinedStartDateTime = setMinutes(setHours(startDate, hours), minutes);
            if (isValid(combinedStartDateTime)) {
              const newCalculatedEndDate = new Date(combinedStartDateTime.getTime() + defaultDuration * 60000);
              const newCalculatedEndTime = format(newCalculatedEndDate, 'HH:mm');
              console.log('[Modal Effect TypeChange] Calculated new end time:', { newCalculatedEndDate, newCalculatedEndTime });
              
              // Nur aktualisieren, wenn sich die Endzeit tatsächlich ändert, um unnötige Renderings zu vermeiden
              if (newCalculatedEndDate.getTime() !== new Date(formData.endDate).getTime() || newCalculatedEndTime !== formData.endTime) {
                setFormData(prev => {
                  const updatedFormData = { ...prev, endDate: newCalculatedEndDate, endTime: newCalculatedEndTime };
                  console.log('[Modal Effect TypeChange] Setting new formData with recalculated end time:', JSON.parse(JSON.stringify(updatedFormData)));
                  return updatedFormData;
                });
              }
            }
          }
        } catch (error) {
          console.error("[Modal Effect TypeChange] Error calculating end date/time:", error);
        }
      }
    } else {
      console.log('[Modal Effect TypeChange] Condition NOT MET, no automatic end time recalculation.');
    }
  }, [formData.type, formData.startDate, formData.startTime, formData.allDay, isEditMode, hasExplicitEndTime]); // Abhängigkeiten für diesen spezifischen Effekt

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (e.target.type === 'checkbox' && e.target instanceof HTMLInputElement) {
      // Explizite Typzusicherung für den Zugriff auf 'checked'
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: keyof EventFormData, value: string) => {
    // Wenn der Wert "none" ist, setzen wir die ID auf null, ansonsten auf den Wert.
    const idToSet = value === 'none' ? null : value;
    if (name === 'type') {
        setFormData(prev => ({ ...prev, [name]: value as EventTypeName }));
    } else if (name === 'reminderOffsetMinutes') {
        // Vor dem Setzen einer Erinnerung ggf. Berechtigung anfordern
        if (value !== 'none' && Notification.permission === 'default') {
            requestNotificationPermission().then(permission => {
                if (permission === 'granted') {
                    toast.info("Benachrichtigungen wurden erlaubt.");
                } else if (permission === 'denied') {
                    toast.warning("Benachrichtigungen wurden blockiert. Erinnerungen können nicht gesendet werden.");
                }
            });
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    } else {
        setFormData(prev => ({ ...prev, [name]: idToSet }));
    }
  };

  const handleDateChange = (name: 'startDate' | 'endDate' | 'recurrenceEndDateForm', date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, [name]: date }));
    }
  };

  // Automatische Anpassung der Endzeit basierend auf Startzeit und Typ-Dauer
  useEffect(() => {
    console.log('[Modal Effect 2] Start - Condition Values:', { hasExplicitEndTime, isEditMode, allDay: formData.allDay, type: formData.type, startDate: formData.startDate, startTime: formData.startTime });
    console.log('[Modal Effect 2] Start - Current formData:', JSON.parse(JSON.stringify(formData)));

    if (!hasExplicitEndTime && !isEditMode && !formData.allDay && formData.type && formData.startDate && formData.startTime) {
      console.log('[Modal Effect 2] Condition MET - Calculating new end time');
      const eventTypeDetail = EVENT_TYPE_DETAILS[formData.type as EventTypeName];
      const defaultDuration = eventTypeDetail?.defaultDurationMinutes;
      if (defaultDuration) {
        try {
          const startDate = new Date(formData.startDate);
          const [hours, minutes] = formData.startTime.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const combinedStartDateTime = setMinutes(setHours(startDate, hours), minutes);
            if (isValid(combinedStartDateTime)) {
              const newCalculatedEndDate = new Date(combinedStartDateTime.getTime() + defaultDuration * 60000);
              const newCalculatedEndTime = format(newCalculatedEndDate, 'HH:mm');
              console.log('[Modal Effect 2] Calculated new end time:', { newCalculatedEndDate, newCalculatedEndTime });
              setFormData(prev => {
                const updatedFormData = { ...prev, endDate: newCalculatedEndDate, endTime: newCalculatedEndTime };
                console.log('[Modal Effect 2] Setting new formData with calculated end time:', JSON.parse(JSON.stringify(updatedFormData)));
                return updatedFormData;
              });
            }
          }
        } catch (error) {
          console.error("[Modal Effect 2] Error calculating end date/time:", error)
        }
      }
    } else {
      console.log('[Modal Effect 2] Condition NOT MET, no automatic end time calculation.');
    }
  }, [formData.type, formData.startDate, formData.startTime, formData.allDay, isEditMode, hasExplicitEndTime]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error("Benutzer nicht angemeldet. Aktion abgebrochen.");
      return;
    }
    setIsSaving(true);

    const { startDate, startTime, endDate, endTime, attendees, reminderOffsetMinutes: reminderOffsetString, ...restOfFormData } = formData;

    let finalStart: Date, finalEnd: Date;

    try {
      finalStart = localHelperCombineDateAndTime(startDate, startTime);
      finalEnd = localHelperCombineDateAndTime(endDate, endTime);

      if (finalEnd <= finalStart && !formData.allDay) {
        toast.error("Endzeit muss nach Startzeit liegen.");
        setIsSaving(false);
        return;
      }
    } catch (error) {
      toast.error("Ungültiges Datum oder Zeitformat.");
      console.error("Error parsing date/time in handleSubmit:", error);
      setIsSaving(false);
      return;
    }
    
    const attendeesArray = attendees && attendees.trim().length > 0 
      ? attendees.split(',').map(att => att.trim()).filter(att => att.length > 0)
      : [];

    const reminderValue = reminderOffsetString === 'none' || reminderOffsetString === null || reminderOffsetString === undefined
      ? null
      : parseInt(reminderOffsetString, 10);
    
    // Fehlerbehandlung für reminderValue, falls parseInt NaN liefert, obwohl 'none' nicht gewählt wurde
    if (reminderOffsetString !== 'none' && (reminderValue === null || isNaN(reminderValue))) {
        toast.error("Ungültiger Wert für Erinnerungszeit.");
        setIsSaving(false);
        return;
    }

    // Generiere RRULE String und recurrenceEndDate, falls es ein Serientermin ist
    let rruleResult = { rruleString: null, recurrenceEndDate: null };
    if (formData.isRecurring && formData.recurrenceFrequency !== 'none') {
      rruleResult = generateRRuleFromFormData(formData);
      if (!rruleResult.rruleString) {
        toast.error("Fehler beim Erstellen der Wiederholungsregel. Bitte Eingaben prüfen.");
        setIsSaving(false);
        return;
      }
    }

    const eventPayload: Omit<FirestoreEvent, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
      ...restOfFormData,
      start: Timestamp.fromDate(finalStart),
      end: Timestamp.fromDate(finalEnd),
      attendees: attendeesArray,
      contactId: formData.contactId || null,
      dealId: formData.dealId || null,
      reminderOffsetMinutes: reminderValue,
      isRecurring: formData.isRecurring && rruleResult.rruleString ? true : false,
      rruleString: rruleResult.rruleString,
      recurrenceEndDate: rruleResult.recurrenceEndDate,
      excludedDates: (isEditMode && eventToEdit?.excludedDates) ? eventToEdit.excludedDates : [], // Behalte excludedDates bei Bearbeitung
    };

    try {
      if (isEditMode && eventToEdit?.id) {
        // Wenn isRecurring von true auf false geändert wird, alte Serien-Daten löschen
        if (!eventPayload.isRecurring) {
          eventPayload.rruleString = null;
          eventPayload.recurrenceEndDate = null;
          eventPayload.excludedDates = []; // Auch Ausschlüsse löschen
        }
        await updateCalendarEventService(user.uid, eventToEdit.id, eventPayload);
        toast.success("Termin erfolgreich aktualisiert!");
        onEventUpdated?.(eventToEdit.id);
      } else {
        const eventId = await addCalendarEventService(user.uid, eventPayload);
        toast.success("Termin erfolgreich erstellt!");
        onEventAdded?.(eventId);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Fehler beim Speichern des Termins.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !eventToEdit?.id) {
      toast.error("Fehler: Termin oder Benutzer nicht identifiziert für Löschung.");
      return;
    }
    setIsSaving(true);
    try {
      await deleteCalendarEventService(userId, eventToEdit.id);
      toast.success("Termin erfolgreich gelöscht!");
      onOpenChange(false); // Modal schließen
      // onEventDeleted könnte hier aufgerufen werden, wenn die Parent-Komponente es braucht
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Fehler beim Löschen des Termins.");
    } finally {
      setIsSaving(false);
    }
  };

  console.log('[Modal Render] Final formData for render:', JSON.parse(JSON.stringify(formData)));
  console.log('[Modal Render] initialFormData for reference:', JSON.parse(JSON.stringify(initialFormData)));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Termin bearbeiten' : 'Neuen Termin erstellen'}</DialogTitle>
          {initialStartTime && !isEditMode && (
            <DialogDescription>
              Für Datum: {format(initialStartTime, 'PPP', { locale: de })}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="title">Titel <span className="text-red-500">*</span></Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="type">Typ</Label>
            <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Typ auswählen" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EVENT_TYPES).map(type => (
                  <SelectItem key={type} value={type}>{EVENT_TYPE_DETAILS[type]?.name || type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 mt-1 mb-3">
            <Checkbox id="allDay" name="allDay" checked={formData.allDay} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allDay: !!checked }))} />
            <Label htmlFor="allDay" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Ganztägig
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Startdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, 'PPP', { locale: de }) : <span>Datum wählen</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleDateChange('startDate', date)}
                    initialFocus
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {!formData.allDay && (
              <div>
                <Label htmlFor="startTime">Startzeit</Label>
                <Input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleChange} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate">Enddatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, 'PPP', { locale: de }) : <span>Datum wählen</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => handleDateChange('endDate', date)}
                    disabled={(date) => formData.startDate && date < formData.startDate} // Enddatum nicht vor Startdatum
                    initialFocus
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {!formData.allDay && (
              <div>
                <Label htmlFor="endTime">Endzeit</Label>
                <Input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleChange} />
              </div>
            )}
          </div>
          
          {/* Warnung wenn Enddatum vor Startdatum (nur für nicht-ganztägige Termine relevant) */}
          {!formData.allDay && formData.startDate && formData.endDate && formData.startTime && formData.endTime && 
            localHelperCombineDateAndTime(formData.startDate, formData.startTime).getTime() > localHelperCombineDateAndTime(formData.endDate, formData.endTime).getTime() && (
            <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 p-2 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Endzeit liegt vor Startzeit.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactId">Verknüpfter Kontakt</Label>
              <Select
                name="contactId"
                value={formData.contactId || ''}
                onValueChange={(value) => handleSelectChange('contactId', value === 'none' ? '' : value)}
                disabled={isLoadingContacts}
              >
                <SelectTrigger id="contactId">
                  <SelectValue placeholder={isLoadingContacts ? "Lade Kontakte..." : "Kontakt auswählen..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Kontakt</SelectItem>
                  {contactList.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealId">Verknüpfter Deal</Label>
              <Select
                name="dealId"
                value={formData.dealId || ''}
                onValueChange={(value) => handleSelectChange('dealId', value === 'none' ? '' : value)}
                disabled={isLoadingDeals}
              >
                <SelectTrigger id="dealId">
                  <SelectValue placeholder={isLoadingDeals ? "Lade Deals..." : "Deal auswählen..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Deal</SelectItem>
                  {dealList.map(deal => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location">Ort</Label>
            <Input
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              placeholder="z.B. Büro, Online, Kundenadresse"
            />
          </div>

          {/* Attendees Input */}
          <div className="space-y-2">
            <Label htmlFor="attendees">Teilnehmer</Label>
            <Input
              id="attendees"
              name="attendees"
              value={formData.attendees || ''}
              onChange={handleChange}
              placeholder="Namen oder E-Mails, mit Komma getrennt"
            />
          </div>

          {/* Notes Textarea */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Zusätzliche Details zum Termin..."
              rows={3}
            />
          </div>

          {/* Checkbox für Serientermin */}
          <div className="flex items-center space-x-2 mt-1 mb-3">
            <Checkbox 
              id="isRecurring" 
              name="isRecurring" 
              checked={formData.isRecurring} 
              onCheckedChange={(checked) => {
                const newIsRecurring = !!checked;
                setFormData(prev => ({ 
                  ...prev, 
                  isRecurring: newIsRecurring,
                  // Wenn nicht mehr wiederholend, Frequenz auf 'none' setzen
                  recurrenceFrequency: newIsRecurring ? (prev.recurrenceFrequency === 'none' ? 'daily' : prev.recurrenceFrequency) : 'none',
                }));
              }}
            />
            <Label htmlFor="isRecurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Termin wiederholt sich
            </Label>
          </div>

          {/* Zusätzliche Felder für Serientermine, wenn formData.isRecurring true ist */}
          {formData.isRecurring && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50/50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Einstellungen für Wiederholung</h4>
              
              {/* Frequenz und Intervall */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="recurrenceFrequency">Wiederholung</Label>
                  <Select 
                    name="recurrenceFrequency" 
                    value={formData.recurrenceFrequency || 'daily'} 
                    onValueChange={(value) => handleSelectChange('recurrenceFrequency', value)}
                  >
                    <SelectTrigger id="recurrenceFrequency">
                      <SelectValue placeholder="Frequenz auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recurrenceFrequencyOptions.filter(opt => opt.value !== 'none').map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="recurrenceInterval">Alle</Label>
                  <div className="flex items-center">
                    <Input 
                      id="recurrenceInterval" 
                      name="recurrenceInterval" 
                      type="number" 
                      value={formData.recurrenceInterval || 1} 
                      onChange={handleChange} 
                      min={1} 
                      className="w-20 mr-2"
                    />
                    <span className="text-sm text-gray-600">
                      {formData.recurrenceFrequency === 'daily' && 'Tag(e)'}
                      {formData.recurrenceFrequency === 'weekly' && 'Woche(n)'}
                      {formData.recurrenceFrequency === 'monthly' && 'Monat(e)'}
                      {formData.recurrenceFrequency === 'yearly' && 'Jahr(e)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wochentage für wöchentliche Wiederholung */}
              {formData.recurrenceFrequency === 'weekly' && (
                <div className="space-y-1">
                  <Label>An folgenden Tagen wiederholen</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {daysOfWeekOptions.map(day => (
                      <Button 
                        key={day.value} 
                        type="button"
                        variant={formData.recurrenceByDay?.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const currentDays = formData.recurrenceByDay || [];
                          const newDays = currentDays.includes(day.value)
                            ? currentDays.filter(d => d !== day.value)
                            : [...currentDays, day.value];
                          setFormData(prev => ({ ...prev, recurrenceByDay: newDays.sort((a,b) => daysOfWeekOptions.findIndex(d => d.value === a) - daysOfWeekOptions.findIndex(d => d.value === b)) }));
                        }}
                        className="h-8 px-3 text-xs"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ende der Serie */}
              <div className="space-y-1">
                <Label htmlFor="recurrenceEndType">Endet</Label>
                <Select 
                  name="recurrenceEndType" 
                  value={formData.recurrenceEndType || 'never'} 
                  onValueChange={(value) => handleSelectChange('recurrenceEndType', value)}
                >
                  <SelectTrigger id="recurrenceEndType">
                    <SelectValue placeholder="Ende auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recurrenceEndTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.recurrenceEndType === 'onDate' && (
                <div className="space-y-1 pl-2">
                  <Label htmlFor="recurrenceEndDateForm">Enddatum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.recurrenceEndDateForm ? format(formData.recurrenceEndDateForm, 'PPP', { locale: de }) : <span>Datum wählen</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.recurrenceEndDateForm || undefined}
                        onSelect={(date) => handleDateChange('recurrenceEndDateForm', date)}
                        disabled={(date) => formData.startDate && date < formData.startDate} // Enddatum der Serie nicht vor Start des ersten Events
                        initialFocus
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {formData.recurrenceEndType === 'afterOccurrences' && (
                <div className="space-y-1 pl-2">
                  <Label htmlFor="recurrenceOccurrences">Nach Anzahl Vorkommen</Label>
                  <Input 
                    id="recurrenceOccurrences" 
                    name="recurrenceOccurrences" 
                    type="number" 
                    value={formData.recurrenceOccurrences || 1} 
                    onChange={handleChange} 
                    min={1}
                    className="w-24"
                  />
                </div>
              )}
            </div>
          )}

          {/* Reminder Select */}
          <div className="space-y-2">
            <Label htmlFor="reminderOffsetMinutes">Erinnerung</Label>
            <Select
                name="reminderOffsetMinutes"
                value={formData.reminderOffsetMinutes || 'none'} 
                onValueChange={(value) => handleSelectChange('reminderOffsetMinutes', value)}
            >
                <SelectTrigger id="reminderOffsetMinutes">
                    <SelectValue placeholder="Erinnerung auswählen..." />
                </SelectTrigger>
                <SelectContent>
                    {reminderOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {formData.reminderOffsetMinutes !== 'none' && Notification.permission === 'denied' && (
                <p className="text-xs text-yellow-600 pt-1">
                    Browser-Benachrichtigungen sind blockiert. Bitte in den Browser-Einstellungen ändern, um Erinnerungen zu erhalten.
                </p>
            )}
            {formData.reminderOffsetMinutes !== 'none' && Notification.permission === 'default' && (
                 <p className="text-xs text-gray-500 pt-1">
                    Damit Erinnerungen funktionieren, müssen Browser-Benachrichtigungen erlaubt werden.
                </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Abbrechen</Button>
            </DialogClose>
            {isEditMode && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSaving} className="mr-auto">
                {isSaving ? 'Löscht...' : 'Löschen'}
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Speichert...' : (isEditMode ? 'Änderungen speichern' : 'Termin erstellen')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Hilfsfunktion zum Kombinieren von Datum und Zeit zu einem Date-Objekt für die Validierung im Modal
// Umbenannt, um Konflikt mit der Service-Funktion zu vermeiden, falls diese später importiert wird
const localHelperCombineDateAndTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    if (!isNaN(hours) && !isNaN(minutes)) {
      combined.setHours(hours, minutes, 0, 0);
    }
    return combined;
  }; 
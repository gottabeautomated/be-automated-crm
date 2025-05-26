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

import { EventFormData, EVENT_TYPES, EVENT_TYPE_DETAILS, FirestoreEvent, EventTypeName } from '@/types/calendarTypes';
import { addCalendarEventService, updateCalendarEventService, deleteCalendarEventService } from '@/services/firebase/calendarService';
// TODO: Später updateCalendarEventService importieren
import { useAuth } from '@/services/firebase/AuthProvider';
import { getContactListForUser, ContactQuickSelectItem } from '@/services/firebase/contactService';
import { getDealListForUser, DealQuickSelectItem } from '@/services/firebase/dealService';
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
};

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
    } else {
        setFormData(prev => ({ ...prev, [name]: idToSet }));
    }
  };

  const handleDateChange = (name: 'startDate' | 'endDate', date: Date | undefined) => {
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
    if (!userId) {
      toast.error("Fehler: Benutzer nicht identifiziert.");
      return;
    }

    // Validierung vor dem Kombinieren von Datum und Zeit
    if (!formData.startDate || ( !formData.allDay && !formData.startTime)) {
        toast.error("Startdatum und -zeit sind erforderlich.");
        setIsSaving(false);
        return;
    }
    if (!formData.endDate || ( !formData.allDay && !formData.endTime)) {
        toast.error("Enddatum und -zeit sind erforderlich.");
        setIsSaving(false);
        return;
    }

    // Validierung für Zeitformat und Endzeit nicht vor Startzeit
    if (!formData.allDay) {
        const startDateTime = localHelperCombineDateAndTime(formData.startDate, formData.startTime);
        const endDateTime = localHelperCombineDateAndTime(formData.endDate, formData.endTime);

        if (!isValid(startDateTime) || !isValid(endDateTime)) {
            toast.error("Ungültiges Zeitformat.");
            setIsSaving(false);
            return;
        }

        if (startDateTime.getTime() > endDateTime.getTime()) {
            toast.error("Warnung: Endzeit liegt vor Startzeit.");
            // Man könnte hier das Speichern verhindern oder nur warnen
            // setIsSaving(false);
            // return;
        }
    }

    setIsSaving(true);

    try {
      if (isEditMode && eventToEdit?.id) {
        // TODO: Update-Logik
        await updateCalendarEventService(userId, eventToEdit.id, formData); // Aufruf der Update-Funktion
        toast.success("Termin erfolgreich aktualisiert!");
        onEventUpdated?.(eventToEdit.id);
      } else {
        const eventId = await addCalendarEventService(userId, formData);
        toast.success("Termin erfolgreich erstellt!");
        onEventAdded?.(eventId);
      }
      onOpenChange(false); // Modal schließen
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

          <div>
            <Label htmlFor="location">Ort</Label>
            <Input id="location" name="location" value={formData.location} onChange={handleChange} />
          </div>

          <div>
            <Label htmlFor="attendees">Teilnehmer (kommagetrennt)</Label>
            <Input id="attendees" name="attendees" value={formData.attendees} onChange={handleChange} />
          </div>

          {/* TODO: Auswahl für Kontakt und Deal (Dropdowns, die Daten laden) */}
          <div>
            <Label htmlFor="contactId">Kontakt verknüpfen</Label>
            <Select 
              name="contactId" 
              value={formData.contactId || 'none'} 
              onValueChange={(value) => handleSelectChange('contactId', value)}
            >
              <SelectTrigger disabled={isLoadingContacts}>
                <SelectValue placeholder={isLoadingContacts ? "Lade Kontakte..." : "Kontakt auswählen"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Kontakt</SelectItem>
                {contactList.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dealId">Deal verknüpfen</Label>
            <Select 
              name="dealId" 
              value={formData.dealId || 'none'} 
              onValueChange={(value) => handleSelectChange('dealId', value)}
            >
              <SelectTrigger disabled={isLoadingDeals}>
                <SelectValue placeholder={isLoadingDeals ? "Lade Deals..." : "Deal auswählen"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Deal</SelectItem>
                {dealList.map(deal => (
                  <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
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
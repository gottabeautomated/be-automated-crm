import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDisplayEvent, EVENT_TYPE_DETAILS, EventTypeName } from '@/types/calendarTypes';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, MapPin, Users, Edit3, Trash2, X } from 'lucide-react';

interface EventDetailPopoverProps {
  event: CalendarDisplayEvent;
  userId: string;
  anchorElement: HTMLElement | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: CalendarDisplayEvent) => void;
  onDelete: (userId: string, eventId: string) => void;
}

export const EventDetailPopover: React.FC<EventDetailPopoverProps> = ({
  event,
  userId,
  anchorElement,
  isOpen,
  onOpenChange,
  onEdit,
  onDelete,
}) => {
  if (!event || !anchorElement) {
    return null;
  }

  const eventTypeDetail = EVENT_TYPE_DETAILS[event.resource.type as EventTypeName];

  const handleEdit = () => {
    onEdit(event);
    onOpenChange(false); // Popover schließen
  };

  const handleDelete = () => {
    // Hier könnte man noch einen Bestätigungsdialog einbauen
    if (event.id) {
      onDelete(userId, event.id);
    }
    onOpenChange(false); // Popover schließen
  };

  const formatDisplayDate = (start: Date, end: Date, allDay: boolean | undefined) => {
    const startDateFormatted = format(start, 'PPP', { locale: de });
    const endDateFormatted = format(end, 'PPP', { locale: de });

    if (allDay) {
      if (startDateFormatted === endDateFormatted) {
        return startDateFormatted;
      }
      return `${startDateFormatted} - ${endDateFormatted}`;
    }

    const startTimeFormatted = format(start, 'p', { locale: de });
    const endTimeFormatted = format(end, 'p', { locale: de });

    if (startDateFormatted === endDateFormatted) {
      return `${startDateFormatted}, ${startTimeFormatted} - ${endTimeFormatted}`;
    }
    return `${format(start, 'Pp', { locale: de })} - ${format(end, 'Pp', { locale: de })}`;
  };


  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {/* 
          Das anchorElement wird von der CalendarPage verwaltet. 
          Wir brauchen hier einen unsichtbaren Trigger, da das Popover 
          programmatisch geöffnet wird. Die schönere Lösung wäre, wenn Popover 
          direkt ein `target` oder `anchorEl` prop hätte, das nicht ein Kind sein muss.
          Daher "simulieren" wir das Öffnen, indem isOpen von außen gesteuert wird.
          Der Trigger hier ist nur für die korrekte Funktion des Popover-Konstrukts nötig.
        */}
        <button ref={r => { if (r && anchorElement && isOpen) { /* Nichts tun, nur für Ref*/ } }} style={{ position: 'fixed', top: '0', left: '0', width: 0, height: 0, opacity: 0 }} />
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 shadow-xl"
        side="bottom" // Versuche, die Position anzupassen
        align="start" // oder center/end je nach Klickposition
        // Optional: style={{ top: anchorPosition.top, left: anchorPosition.left }}
        // wenn wir die Positionierung manuell steuern
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg leading-none tracking-tight break-all">{event.title}</h3>
                <Button variant="ghost" size="sm" className="-mr-2 -mt-2" onClick={() => onOpenChange(false)}>
                    <X className="h-4 w-4"/>
                </Button>
            </div>
            {eventTypeDetail && (
              <Badge style={{ backgroundColor: eventTypeDetail.color, color: 'white' }}>
                {eventTypeDetail.name}
              </Badge>
            )}
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <CalendarIcon className="mr-2 mt-0.5 h-4 w-4 text-gray-600 flex-shrink-0" />
              <span>{formatDisplayDate(event.start, event.end, event.allDay)}</span>
            </div>
            
            {event.resource?.firestoreEvent?.location && (
              <div className="flex items-start">
                <MapPin className="mr-2 mt-0.5 h-4 w-4 text-gray-600 flex-shrink-0" />
                <span>{event.resource.firestoreEvent.location}</span>
              </div>
            )}

            {event.resource?.firestoreEvent?.attendees && event.resource.firestoreEvent.attendees.length > 0 && (
              <div className="flex items-start">
                <Users className="mr-2 mt-0.5 h-4 w-4 text-gray-600 flex-shrink-0" />
                <span>{event.resource.firestoreEvent.attendees.join(', ')}</span>
              </div>
            )}
            
            {event.resource?.firestoreEvent?.notes && (
                 <div className="mt-2 p-2 bg-gray-50 rounded-md border text-xs">
                    <p className="font-medium mb-1">Notizen:</p>
                    <p className="whitespace-pre-wrap break-words">{event.resource.firestoreEvent.notes}</p>
                 </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Bearbeiten
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Löschen
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 
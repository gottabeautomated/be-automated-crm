import React, { useState, useEffect } from 'react';
import { CalendarDisplayEvent, EVENT_TYPE_DETAILS, EventTypeName } from '@/types/calendarTypes';
import { getUpcomingEventsService } from '@/services/firebase/calendarService';
import { useAuth } from '@/services/firebase/AuthProvider';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, Clock, Info } from 'lucide-react';

interface UpcomingEventsWidgetProps {
  itemLimit?: number;
}

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({ itemLimit = 5 }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarDisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      getUpcomingEventsService(user.uid, itemLimit)
        .then(upcomingEvents => {
          setEvents(upcomingEvents);
          setError(null);
        })
        .catch(err => {
          console.error("Error fetching upcoming events for widget:", err);
          setError("Termine konnten nicht geladen werden.");
          setEvents([]); // Stelle sicher, dass bei Fehler keine alten Events angezeigt werden
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false); // Kein Benutzer, also nicht laden
      setEvents([]);
    }
  }, [user, itemLimit]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bevorstehende Termine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bevorstehende Termine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-24 text-red-500">
            <Info className="h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bevorstehende Termine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-24 text-gray-500">
            <CalendarIcon className="h-8 w-8 mb-2" />
            <p>Keine bevorstehenden Termine.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bevorstehende Termine ({events.length})</CardTitle>
        <CardDescription>Die nächsten {itemLimit} anstehenden Termine.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map(event => {
          const eventType = event.resource?.type as EventTypeName | undefined;
          const eventTypeDetail = eventType ? EVENT_TYPE_DETAILS[eventType] : null;
          return (
            <div key={event.id} className="flex items-start p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-150">
              {eventTypeDetail && (
                <div 
                  className="w-3 h-3 rounded-full mr-3 mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: eventTypeDetail.color }}
                  title={eventTypeDetail.name}
                ></div>
              )}
              <div className="flex-grow">
                <p className="font-semibold text-sm text-gray-800 truncate" title={event.title}>{event.title}</p>
                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                  <CalendarIcon className="w-3 h-3 mr-1.5" />
                  {format(event.start, 'E, dd. MMM', { locale: de })}
                  {!event.allDay && (
                    <>
                      <Clock className="w-3 h-3 ml-2 mr-1" />
                      {format(event.start, 'HH:mm', { locale: de })} Uhr
                    </>
                  )}
                  {event.allDay && <Badge variant="outline" className="ml-2 text-xs py-0 px-1.5">Ganztägig</Badge>}
                </div>
              </div>
              {/* Optional: Link zum Kalender oder Event-Detail-Ansicht */}
              {/* <Button variant="ghost" size="sm" className="ml-auto self-center">
                <ChevronRight className="w-4 h-4" />
              </Button> */}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}; 
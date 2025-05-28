import React, { useState, useEffect, useCallback } from 'react';
import Calendar, { TileContentFunc } from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Standard-Styling importieren
import { useNavigate } from 'react-router-dom';
import { format, getYear, getMonth, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale/de'; // Import für de-Lokalisierung
import { useAuth } from '@/services/firebase/AuthProvider';
import { getDaysWithEventsForMonthService, getEventDetailsForDateService, MiniCalendarEventDetail } from '@/services/firebase/calendarService';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// Typ für den Parameter von onActiveStartDateChange direkt definieren
interface MiniCalendarActiveStartDateChangeProps {
    action: string;
    activeStartDate: Date | null;
    value: Value;
    view: string;
}

const MiniCalendar: React.FC = () => {
  const [value, onChange] = useState<Value>(new Date());
  const navigate = useNavigate();
  const { user } = useAuth();
  const [daysWithEvents, setDaysWithEvents] = useState<Date[]>([]);
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());

  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [popoverEvents, setPopoverEvents] = useState<MiniCalendarEventDetail[]>([]);
  const [isLoadingPopover, setIsLoadingPopover] = useState(false);

  const fetchDaysWithEvents = useCallback(async (date: Date) => {
    if (user?.uid) {
      try {
        const year = getYear(date);
        const month = getMonth(date);
        const days = await getDaysWithEventsForMonthService(user.uid, year, month);
        setDaysWithEvents(days);
      } catch (error) {
        console.error("Error fetching days with events for mini calendar:", error);
        setDaysWithEvents([]);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchDaysWithEvents(activeStartDate);
  }, [activeStartDate, fetchDaysWithEvents]);

  const handleDateChange = (newValue: Value) => {
    onChange(newValue);
    if (newValue instanceof Date) {
      navigate('/calendar', { state: { selectedDate: format(newValue, 'yyyy-MM-dd') } });
    } else if (Array.isArray(newValue) && newValue[0] instanceof Date) {
      navigate('/calendar', { state: { selectedDate: format(newValue[0], 'yyyy-MM-dd') } });
    }
  };

  const handleActiveStartDateChange = ({ activeStartDate: newActiveStartDate }: MiniCalendarActiveStartDateChangeProps) => {
    if (newActiveStartDate) {
        setActiveStartDate(newActiveStartDate);
    }
  };

  const handlePopoverOpenChange = async (open: boolean, date: Date) => {
    if (open) {
      const hasEventDay = daysWithEvents.some(eventDate => isSameDay(eventDate, date));
      if (!hasEventDay) return;

      setHoveredDate(date);
      setIsLoadingPopover(true);
      if (user?.uid) {
        try {
          const events = await getEventDetailsForDateService(user.uid, date);
          setPopoverEvents(events);
        } catch (error) {
          console.error("Error fetching event details for popover:", error);
          setPopoverEvents([]);
        }
        setIsLoadingPopover(false);
      }
    } else {
      setHoveredDate(null);
      setPopoverEvents([]);
    }
  };

  const tileContent: TileContentFunc = ({ date, view }) => {
    const hasEvent = view === 'month' && daysWithEvents.some(eventDate => isSameDay(eventDate, date));
    const isHovered = hoveredDate && isSameDay(date, hoveredDate);

    return (
      <Popover open={Boolean(isHovered && hasEvent)} onOpenChange={(open) => handlePopoverOpenChange(open, date)}>
        <PopoverTrigger asChild onMouseEnter={() => handlePopoverOpenChange(true, date)} onMouseLeave={() => handlePopoverOpenChange(false, date)}>
          <div className="relative w-full h-full flex flex-col items-center justify-center p-1 cursor-default">
            {/* Tageszahl bleibt Standard-Rendering von react-calendar überlassen */}
            {hasEvent && <div className="event-marker"></div>}
          </div>
        </PopoverTrigger>
        {hasEvent && (
            <PopoverContent 
                align="center" 
                side="top" 
                className="w-auto p-2 bg-background border shadow-lg rounded-md text-xs z-50" // z-index hinzufügen
                onOpenAutoFocus={(e) => e.preventDefault()} 
            >
            {isLoadingPopover ? (
              <p>Lade Termine...</p>
            ) : popoverEvents.length > 0 && hoveredDate ? (
              <div className="space-y-1">
                <p className="font-semibold text-center mb-1">{format(hoveredDate, 'PPP', { locale: de })}</p>
                {popoverEvents.map((event, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <span style={{ backgroundColor: event.color || '#3174ad' }} className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"></span>
                    <span className="font-medium truncate max-w-[150px]" title={event.title}>{event.title}</span>
                    <span className="ml-1 text-muted-foreground">({format(event.start, 'HH:mm')})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Keine Termine an diesem Tag.</p>
            )}
          </PopoverContent>
        )}
      </Popover>
    );
  };

  return (
    <div className="p-2 bg-card rounded-lg shadow mini-calendar-wrapper">
      <h4 className="text-sm font-semibold mb-2 text-center text-card-foreground">Mini Kalender</h4>
      <Calendar
        onChange={handleDateChange}
        value={value}
        locale="de-DE"
        onActiveStartDateChange={handleActiveStartDateChange}
        tileContent={tileContent}
        className="text-xs mini-calendar-custom"
      />
    </div>
  );
};

export default MiniCalendar; 
import React from 'react';
import { EVENT_TYPE_DETAILS, EventTypeName } from '@/types/calendarTypes';

export const CalendarLegend: React.FC = () => {
  const eventTypes = Object.values(EVENT_TYPE_DETAILS) as { name: EventTypeName; color: string }[];

  return (
    <div className="p-4 border rounded-md shadow-sm bg-white">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Legende</h3>
      <ul className="space-y-2">
        {eventTypes.map((eventType) => (
          <li key={eventType.name} className="flex items-center">
            <span
              className="w-4 h-4 rounded-full mr-3"
              style={{ backgroundColor: eventType.color }}
            />
            <span className="text-sm text-gray-600">{eventType.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}; 
import React from 'react';
import { EVENT_TYPE_DETAILS, EventTypeName } from '@/types/calendarTypes';
import { cn } from '@/lib/utils';

interface CalendarLegendProps {
  activeFilters: EventTypeName[];
  onFilterChange: (selectedTypes: EventTypeName[]) => void;
  // Optional: Eine Möglichkeit, alle Filter zurückzusetzen
  // onResetFilters?: () => void;
}

export const CalendarLegend: React.FC<CalendarLegendProps> = ({ activeFilters, onFilterChange }) => {
  const eventTypes = Object.values(EVENT_TYPE_DETAILS) as { name: EventTypeName; color: string }[];

  const handleTypeClick = (typeNameToToggle: EventTypeName) => {
    const currentIndex = activeFilters.indexOf(typeNameToToggle);
    let newFilters: EventTypeName[];

    if (currentIndex === -1) {
      // Typ ist nicht aktiv, also hinzufügen
      newFilters = [...activeFilters, typeNameToToggle];
    } else {
      // Typ ist aktiv, also entfernen
      newFilters = activeFilters.filter(t => t !== typeNameToToggle);
    }
    onFilterChange(newFilters);
  };

  const allFiltersActive = activeFilters.length === 0 || activeFilters.length === eventTypes.length;

  return (
    <div className="p-3 border rounded-md shadow-sm bg-white text-sm">
      <h3 className="text-base font-semibold mb-2 text-gray-700">Filter nach Typ</h3>
      <ul className="space-y-1.5">
        {eventTypes.map((eventType) => {
          const isActive = activeFilters.includes(eventType.name);
          return (
            <li 
              key={eventType.name} 
              className={cn(
                "flex items-center p-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors",
                isActive ? "bg-gray-100 border border-gray-300" : "border border-transparent",
                !allFiltersActive && !isActive ? "opacity-60 hover:opacity-100" : ""
              )}
              onClick={() => handleTypeClick(eventType.name)}
            >
              <span
                className="w-3.5 h-3.5 rounded-full mr-2 border border-gray-300"
                style={{ backgroundColor: eventType.color }}
              />
              <span className="text-xs text-gray-600 select-none">{eventType.name}</span>
            </li>
          );
        })}
      </ul>
      {(activeFilters.length > 0 && !allFiltersActive) && (
        <button 
          onClick={() => onFilterChange([])} 
          className="mt-2.5 text-xs text-primary-blue hover:underline w-full text-left"
        >
          Alle Typen anzeigen
        </button>
      )}
    </div>
  );
}; 
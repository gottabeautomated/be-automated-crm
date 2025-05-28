import React from 'react';
import { NavigateAction, View, ViewsProps } from 'react-big-calendar';
import { EVENT_TYPE_DETAILS, EventTypeName } from '@/types/calendarTypes';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { ContactQuickSelectItem } from '@/services/firebase/contactService';
import { DealQuickSelectItem } from '@/services/firebase/dealService';

interface CustomToolbarProps {
  date: Date;
  label: string;
  localizer: any; // Ist komplex, any für Einfachheit hier
  view: View;
  views: ViewsProps;
  onNavigate: (action: NavigateAction, date?: Date) => void;
  onView: (view: View) => void;
  activeEventTypeFilters: EventTypeName[];
  onEventTypeFilterChange: (selectedTypes: EventTypeName[]) => void;
  contactList: ContactQuickSelectItem[];
  activeContactFilter: string | null;
  onContactFilterChange: (contactId: string | null) => void;
  dealList: DealQuickSelectItem[];
  activeDealFilter: string | null;
  onDealFilterChange: (dealId: string | null) => void;
}

const CustomCalendarToolbar: React.FC<CustomToolbarProps> = ({
  label,
  view,
  views,
  onNavigate,
  onView,
  activeEventTypeFilters,
  onEventTypeFilterChange,
  contactList,
  activeContactFilter,
  onContactFilterChange,
  dealList,
  activeDealFilter,
  onDealFilterChange,
}) => {
  const eventTypes = Object.values(EVENT_TYPE_DETAILS);

  const handleTypeClick = (typeNameToToggle: EventTypeName) => {
    const currentIndex = activeEventTypeFilters.indexOf(typeNameToToggle);
    let newFilters: EventTypeName[];
    if (currentIndex === -1) {
      newFilters = [...activeEventTypeFilters, typeNameToToggle];
    } else {
      newFilters = activeEventTypeFilters.filter(t => t !== typeNameToToggle);
    }
    onEventTypeFilterChange(newFilters);
  };

  // Standard-Ansichten-Namen auf Deutsch, falls gewünscht
  const viewNames: { [key in View]?: string } = {
    month: 'Monat',
    week: 'Woche',
    day: 'Tag',
    agenda: 'Agenda',
  };

  return (
    <div className="rbc-toolbar mb-4 p-3 border rounded-md bg-gray-50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Linke Seite: Navigation (Heute, Zurück, Weiter) */}
        <div className="flex items-center gap-1 rbc-btn-group">
          <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')}>Heute</Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('PREV')}>Zurück</Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('NEXT')}>Weiter</Button>
        </div>

        {/* Mitte: Aktuelles Datum/Label */}
        <div className="rbc-toolbar-label text-lg font-semibold text-gray-700">
          {label}
        </div>

        {/* Rechte Seite: Ansichtsumschalter, Kontaktfilter UND Dealfilter-Dropdown */}
        <div className="flex items-center gap-2 rbc-btn-group">
          {/* Kontaktfilter Dropdown */}
          <Select value={activeContactFilter || 'all'} onValueChange={(value) => onContactFilterChange(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[160px] h-9 text-xs py-1 px-2 bg-white">
              <SelectValue placeholder="Kontakt filtern..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kontakte</SelectItem>
              {contactList.map(contact => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Dealfilter Dropdown */}
          <Select value={activeDealFilter || 'all'} onValueChange={(value) => onDealFilterChange(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[160px] h-9 text-xs py-1 px-2 bg-white">
              <SelectValue placeholder="Deal filtern..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Deals</SelectItem>
              {dealList.map(deal => (
                <SelectItem key={deal.id} value={deal.id}>
                  {deal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(Array.isArray(views) ? views : Object.keys(views)).map((viewName) => (
            <Button
              key={viewName}
              variant={view === viewName ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onView(viewName as View)}
            >
              {viewNames[viewName as View] || viewName}
            </Button>
          ))}
        </div>
      </div>

      {/* Untere Reihe: Event-Typ-Filter */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-600 mr-2">Filter:</span>
          {eventTypes.map((eventType) => {
            const isActive = activeEventTypeFilters.includes(eventType.name);
            return (
              <Button
                key={eventType.name}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "h-auto py-1 px-2 text-xs transition-all duration-150 ease-in-out",
                  isActive ? 'shadow-md' : 'opacity-70 hover:opacity-100',
                  isActive && `hover:bg-[${eventType.color}] hover:opacity-90`
                )}
                style={isActive ? { backgroundColor: eventType.color, color: 'white', borderColor: eventType.color } : {borderColor: eventType.color, color: eventType.color}}
                onClick={() => handleTypeClick(eventType.name)}
              >
                {eventType.name}
              </Button>
            );
          })}
          {activeEventTypeFilters.length > 0 && (
            <Button 
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-primary-blue hover:underline"
              onClick={() => onEventTypeFilterChange([])}
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomCalendarToolbar; 
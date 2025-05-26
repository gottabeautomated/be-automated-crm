import React, { useState, useEffect, useRef } from 'react';
import { Deal } from '@/types/dealTypes';
import { DollarSign, Briefcase, Percent, MoreVertical, Edit2, Trash2, Eye, UserCircle, CalendarClock } from 'lucide-react';
import { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

interface DealCardProps {
  deal: Deal;
  index: number; // Required for Draggable
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
  onViewDetails: (deal: Deal) => void;
  innerRef?: (element: HTMLElement | null) => void; // From Draggable
  draggableProps?: DraggableProvidedDraggableProps | null; // From Draggable
  dragHandleProps?: DraggableProvidedDragHandleProps | null; // From Draggable
}

// Helper function for placeholder color based on title (simple hash)
const getTitleColor = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 85%)`; // Light, somewhat saturated color
  const textColor = `hsl(${hash % 360}, 70%, 30%)`; // Darker text color for contrast
  return { backgroundColor: color, textColor: textColor };
};

// Helper for deal age or priority (placeholder)
const getDealPriorityIndicator = (deal: Deal): string => {
  // Simple logic: if expected close date is in the past, color it red
  // More complex logic can be added for age/priority
  if (deal.expectedCloseDate) { // Check if expectedCloseDate is defined
    try {
      const closeDate = deal.expectedCloseDate.toDate(); // Convert Firestore Timestamp to Date
      if (closeDate < new Date() && deal.stage !== 'Abgeschlossen' && deal.stage !== 'Verloren') {
        return 'border-error-red'; // Tailwind class for red border
      }
    } catch (e) { 
      console.warn("Invalid date format for deal.expectedCloseDate: ", deal.expectedCloseDate, e);
    }
  }
  return 'border-transparent'; // Default: no special border
};

const DealCard: React.FC<DealCardProps> = ({ 
  deal, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  innerRef, 
  draggableProps, 
  dragHandleProps 
}) => {
  const cardColorStyle = getTitleColor(deal.title);
  const priorityBorderStyle = getDealPriorityIndicator(deal);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Placeholder for contact initials/avatar
  const ContactAvatar: React.FC<{ companyName: string }> = ({ companyName }) => {
    const initials = companyName?.substring(0, 2).toUpperCase() || '??';
    return (
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mr-2 flex-shrink-0"
        style={{ backgroundColor: cardColorStyle.backgroundColor, color: cardColorStyle.textColor }}
        title={companyName}
      >
        {initials}
      </div>
    );
  };

  return (
    <div 
      ref={innerRef} 
      {...draggableProps} 
      {...dragHandleProps}
      className={`bg-white p-3.5 rounded-lg shadow-md hover:shadow-lg transition-shadow mb-3 border-l-4 ${priorityBorderStyle}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start">
          {/* Drag handle can be a specific icon later, for now the whole card is draggable */}
          {/* <GripVertical size={18} className="mr-2 text-slate-400 cursor-grab" {...dragHandleProps} /> */}
          <ContactAvatar companyName={deal.company || ''} /> {/* Use deal.company and provide fallback */}
          <div>
            <h3 
              className="font-semibold text-sky-700 text-sm leading-tight cursor-pointer hover:underline truncate"
              title={deal.title}
              onClick={() => onViewDetails(deal)}
            >
              {deal.title}
            </h3>
            <p className="text-xs text-slate-500 truncate" title={deal.company || ''}> {/* Use deal.company and provide fallback */}
              <Briefcase size={12} className="inline mr-1 mb-0.5" />{deal.company || 'N/A'}
            </p>
          </div>
        </div>
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="text-slate-400 hover:text-sky-600 p-1"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical size={18} />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg py-1 z-10 border border-slate-200">
              <button
                onClick={() => { onViewDetails(deal); setIsMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center"
              >
                <Eye size={14} className="mr-2 text-sky-600" /> Details anzeigen
              </button>
              <button
                onClick={() => { onEdit(deal); setIsMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center"
              >
                <Edit2 size={14} className="mr-2 text-amber-600" /> Bearbeiten
              </button>
              <button
                onClick={() => { onDelete(deal.id); setIsMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 size={14} className="mr-2" /> Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-2">
        <p className="text-sm text-emerald-700 font-medium flex items-center">
          <DollarSign size={14} className="inline mr-1 text-emerald-600" />
          {deal.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </p>
        <p className="text-xs text-slate-500 flex items-center mt-0.5">
          <Percent size={12} className="inline mr-1" /> 
          Wahrscheinlichkeit: {deal.probability}%
        </p>
      </div>
      
      <div className="text-xs text-slate-400 border-t border-slate-100 pt-1.5 flex items-center">
        <CalendarClock size={12} className="inline mr-1.5" />
        Erw. Abschluss: {deal.expectedCloseDate ? deal.expectedCloseDate.toDate().toLocaleDateString('de-DE') : 'N/A'}
      </div>
    </div>
  );
};

export default DealCard; 
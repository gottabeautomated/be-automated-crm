import React, { useState, useEffect, useRef } from 'react';
import { Deal } from '@/types/dealTypes';
import { DollarSign, Briefcase, Percent, MoreVertical, Edit2, Trash2, Eye, UserCircle, CalendarClock } from 'lucide-react';

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
  onViewDetails: (deal: Deal) => void;
  stageColor?: string;
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
const getDealPriorityIndicator = (deal: Deal, stageColor?: string): string => {
  // Simple logic: if expected close date is in the past, color it red
  // More complex logic can be added for age/priority
  if (deal.expectedCloseDate) { 
    try {
      const closeDate = deal.expectedCloseDate.toDate();
      // Annahme: 'Gewonnen' und 'Verloren' sind die Namen/IDs der Endphasen.
      // Dies sollte idealerweise über eine Eigenschaft der Phase geprüft werden (z.B. type: 'closed')
      // Da wir hier nur die Deal-Daten haben, prüfen wir gegen die stageId.
      // Die stageId 'won' und 'lost' aus initialStages in PipelineSettingsTab.tsx als Referenz.
      if (closeDate < new Date() && deal.stageId !== 'won' && deal.stageId !== 'lost') {
        return 'border-error-red'; 
      }
    } catch (e) { 
      console.warn("Invalid date format for deal.expectedCloseDate: ", deal.expectedCloseDate, e);
    }
  }
  // Wenn eine stageColor übergeben wird, diese für den linken Rand verwenden.
  // Ansonsten transparenter Rand.
  return stageColor ? `border-[${stageColor}]` : 'border-transparent'; 
};

const DealCard: React.FC<DealCardProps> = ({ 
  deal, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  stageColor
}) => {
  const cardColorStyle = getTitleColor(deal.title);
  const priorityBorderStyle = getDealPriorityIndicator(deal, stageColor);
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
      className={`bg-white p-3.5 rounded-lg shadow-md hover:shadow-lg transition-shadow mb-3 border-l-4 ${priorityBorderStyle}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start">
          <ContactAvatar companyName={deal.company || ''} />
          <div>
            <h3 
              className="font-semibold text-sky-700 text-sm leading-tight cursor-pointer hover:underline truncate"
              title={deal.title}
              onClick={() => onViewDetails(deal)}
            >
              {deal.title}
            </h3>
            <p className="text-xs text-slate-500 break-words" title={deal.company || ''}>
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
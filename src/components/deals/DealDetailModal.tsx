import React from 'react';
import { Deal } from '@/types/dealTypes';
import { X, CalendarDays, Tag, AlignLeft, Users, Briefcase, DollarSign, Percent, Link as LinkIcon, Edit2, Trash2, CheckCircle, AlertCircle, Clock, UserCircle as UserCircleIcon } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface DealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  // Optional: Callbacks für Aktionen direkt aus dem Detail-Modal
  // onEdit?: (deal: Deal) => void;
  // onDelete?: (dealId: string) => void;
}

const formatDate = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleDateString('de-DE', {
    year: 'numeric', month: 'long', day: 'numeric',
    // hour: '2-digit', minute: '2-digit' // Falls Zeit benötigt wird
  });
};

const DealDetailModal: React.FC<DealDetailModalProps> = ({ isOpen, onClose, deal /*, onEdit, onDelete */ }) => {
  if (!isOpen || !deal) return null;

  // Beispielhafte Struktur, muss noch weiter ausgebaut werden
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-white relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10">
          <X size={28} />
        </button>

        <div className="mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-bold text-sky-800 mb-1">{deal.title}</h2>
          <p className="text-slate-500 text-sm"><Briefcase size={14} className="inline mr-1.5" /> {deal.company}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
          <div>
            <p className="text-sm text-slate-500 mb-0.5"><DollarSign size={14} className="inline mr-1.5" /> Wert</p>
            <p className="text-lg font-semibold text-emerald-600">{deal.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-0.5"><Percent size={14} className="inline mr-1.5" /> Wahrscheinlichkeit</p>
            <p className="text-lg font-semibold text-sky-600">{deal.probability}%</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-0.5"><CheckCircle size={14} className="inline mr-1.5" /> Phase</p>
            <p className="text-lg font-semibold text-slate-700">{deal.stage}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-0.5"><CalendarDays size={14} className="inline mr-1.5" /> Erw. Abschluss</p>
            <p className="text-lg font-semibold text-slate-700">{formatDate(deal.expectedCloseDate)}</p>
          </div>
        </div>

        {(deal.description || deal.notes || (deal.tags && deal.tags.length > 0)) && (
            <div className="mb-6 border-t border-slate-200 pt-6">
                {deal.description && (
                <div className="mb-4">
                    <h3 className="text-md font-semibold text-slate-700 mb-1 flex items-center"><AlignLeft size={16} className="mr-2 text-sky-600" /> Beschreibung</h3>
                    <p className="text-slate-600 whitespace-pre-wrap text-sm">{deal.description}</p>
                </div>
                )}
                {deal.notes && (
                <div className="mb-4">
                    <h3 className="text-md font-semibold text-slate-700 mb-1 flex items-center"><AlignLeft size={16} className="mr-2 text-sky-600" /> Notizen</h3>
                    <p className="text-slate-600 whitespace-pre-wrap text-sm">{deal.notes}</p>
                </div>
                )}
                {deal.tags && deal.tags.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-md font-semibold text-slate-700 mb-1 flex items-center"><Tag size={16} className="mr-2 text-sky-600" /> Tags</h3>
                    <div className="flex flex-wrap gap-2">
                    {deal.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">{tag}</span>
                    ))}
                    </div>
                </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 border-t border-slate-200 pt-4 mt-4">
            <p><Clock size={12} className="inline mr-1" /> Erstellt: {formatDate(deal.createdAt)}</p>
            <p><Clock size={12} className="inline mr-1" /> Aktualisiert: {formatDate(deal.updatedAt)}</p>
            {deal.contactId && <p><Users size={12} className="inline mr-1" /> Kontakt ID: {deal.contactId}</p>}
            {deal.assignedUserId && <p><UserCircleIcon size={12} className="inline mr-1" /> Zugewiesen: {deal.assignedUserId}</p>}
        </div>

        {/* TODO: Buttons für Aktionen wie Bearbeiten/Löschen, falls benötigt 
        <div className="mt-8 flex justify-end space-x-3">
          {onEdit && <button onClick={() => onEdit(deal)} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm flex items-center"><Edit2 size={16} className="mr-2"/> Bearbeiten</button>}
          {onDelete && <button onClick={() => onDelete(deal.id)} className="px-4 py-2 text-sm font-medium text-white bg-error-red hover:bg-error-red-dark rounded-lg shadow-sm flex items-center"><Trash2 size={16} className="mr-2"/> Löschen</button>}
        </div>
        */}
      </div>
    </div>
  );
};

export default DealDetailModal; 
import React, { useState, FormEvent, useEffect } from 'react';
import { X, Briefcase, DollarSign, CalendarDays, Percent, Tag, AlignLeft, Users, User, ChevronDown } from 'lucide-react';
import { DealFormData, Deal } from '@/types/dealTypes';
import { addDealService } from '@/services/firebase/dealService';
import { FirestoreContact } from '@/types/contactTypes'; // Import Contact types
import { subscribeToContacts } from '@/services/firebase/contactService'; // Import contact service

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onDealAdded?: (newDealId: string) => void; // Optional callback
}

const DEAL_STAGES_OPTIONS: Deal['stage'][] = ['Lead', 'Qualifiziert', 'Angebot', 'Verhandlung', 'Abgeschlossen', 'Verloren'];

const AddDealModal: React.FC<AddDealModalProps> = ({ isOpen, onClose, userId, onDealAdded }) => {
  const initialFormData: DealFormData = {
    title: '',
    value: '0',
    stage: 'Lead',
    companyName: '',
    probability: '0',
    expectedCloseDate: '',
    description: '',
    contactId: '', // Optional, can be linked later or selected
    assignedTo: '', // Optional
    tags: [],
    notes: '',
  };
  const [formData, setFormData] = useState<DealFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<FirestoreContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoadingContacts(true);
      const unsubscribe = subscribeToContacts(
        userId,
        (fetchedContacts) => {
          setContacts(fetchedContacts);
          setIsLoadingContacts(false);
        },
        (err) => {
          console.error("Error fetching contacts for deal modal: ", err);
          setError("Fehler beim Laden der Kontakte.");
          setIsLoadingContacts(false);
        }
      );
      return () => unsubscribe();
    } else {
      setContacts([]); // Clear contacts when modal is closed or no userId
    }
  }, [isOpen, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      tags: value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.companyName) {
      setError("Titel und Firmenname sind Pflichtfelder.");
      return;
    }
    const probabilityNumber = parseFloat(formData.probability);
    if (isNaN(probabilityNumber) || probabilityNumber < 0 || probabilityNumber > 100) {
      setError("Wahrscheinlichkeit muss eine Zahl zwischen 0 und 100 sein.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const newDealId = await addDealService(userId, formData);
      setIsSubmitting(false);
      setFormData(initialFormData); // Reset form
      onClose();
      if (onDealAdded) {
        onDealAdded(newDealId);
      }
    } catch (err) {
      console.error(err);
      setError("Fehler beim Erstellen des Deals. Bitte versuchen Sie es erneut.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-sky-700">Neuen Deal erstellen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titel*</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Firmenname*</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500" />
              </div>
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">Wert (EUR)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input type="number" name="value" id="value" value={formData.value} onChange={handleChange} step="0.01" className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
              <select name="stage" id="stage" value={formData.stage} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 bg-white">
                {DEAL_STAGES_OPTIONS.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="probability" className="block text-sm font-medium text-gray-700 mb-1">Wahrscheinlichkeit (%)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Percent className="h-5 w-5 text-gray-400" />
                </div>
                <input type="number" name="probability" id="probability" value={formData.probability} onChange={handleChange} min="0" max="100" className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-gray-700 mb-1">Erwarteter Abschluss</label>
            <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <CalendarDays className="h-5 w-5 text-gray-400" />
                </div>
              <input type="date" name="expectedCloseDate" id="expectedCloseDate" value={formData.expectedCloseDate} onChange={handleChange} className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500" />
            </div>
          </div>

          {/* Contact Selector */}
          <div>
            <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-1">Verknüpfter Kontakt</label>
            <div className="relative">
              <select 
                name="contactId" 
                id="contactId" 
                value={formData.contactId}
                onChange={handleChange} 
                disabled={isLoadingContacts}
                className="w-full appearance-none bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 pr-8"
              >
                <option value="">{isLoadingContacts ? 'Kontakte laden...' : 'Kontakt auswählen (optional)'}</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>{contact.name} ({contact.company})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 top-0 pl-3 pt-2.5 flex items-start">
                  <AlignLeft className="h-5 w-5 text-gray-400" />
                </div>
              <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"></textarea>
            </div>
          </div>

          {/* Optional Fields Section */}
          <details className="bg-slate-50 p-3 rounded-md">
            <summary className="text-sm font-medium text-gray-600 hover:text-sky-700 cursor-pointer">Optionale Felder</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">Zugewiesen an (Benutzer ID)</label>
                 <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                  <input type="text" name="assignedTo" id="assignedTo" value={formData.assignedTo} onChange={handleChange} placeholder="Benutzer ID (optional)" className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (kommagetrennt)</label>
                 <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Tag className="h-5 w-5 text-gray-400" />
                    </div>
                  <input type="text" name="tags" id="tags" value={(formData.tags || []).join(', ')} onChange={handleTagChange} placeholder="z.B. wichtig, neukunde" className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder="Interne Notizen zum Deal..."></textarea>
              </div>
            </div>
          </details>
          

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50">
              Abbrechen
            </button>
            <button type="submit" disabled={isSubmitting || isLoadingContacts} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:bg-sky-400">
              {isSubmitting ? 'Speichern...' : 'Deal erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDealModal; 
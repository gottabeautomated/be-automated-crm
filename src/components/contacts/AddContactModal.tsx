import React, { useState } from 'react';
import { useAuth } from '@/services/firebase/AuthProvider';
import { Timestamp } from 'firebase/firestore'; // Behalten für initialContactFormData
import {
  X,
  Plus,
  Loader2,
  User,
  Briefcase,
  Mail,
  Phone,
  DollarSign,
  CheckCircle,
  AlignLeft,
  Tag
} from 'lucide-react';
import { ContactFormData } from '@/types/contactTypes';
import { createContact } from '@/services/firebase/contactService'; // Importieren

// Available statuses for the dropdown (excluding 'alle')
const contactStatusesOptions = ['Lead', 'Interessent', 'Kunde'] as const;
const contactPriorityOptions = ['low', 'medium', 'high'] as const;

const initialContactFormData: ContactFormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  dealValue: '',
  status: 'Lead',
  lastContact: new Date().toISOString().split('T')[0], // Defaults to today
  dealStage: '',
  priority: 'medium',
  tags: '',
  notes: '',
};

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [newContactData, setNewContactData] = useState<ContactFormData>(initialContactFormData);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [submitContactError, setSubmitContactError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewContactData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSubmitContactError("Kein Benutzer angemeldet. Bitte erneut anmelden.");
      return;
    }
    if (!newContactData.name || !newContactData.email) {
      setSubmitContactError("Name und E-Mail sind Pflichtfelder.");
      return;
    }

    setIsSubmittingContact(true);
    setSubmitContactError(null);

    try {
      await createContact(user.uid, newContactData); // Service-Funktion verwenden
      handleClose();
    } catch (error: any) {
      console.error("Error adding contact (from service): ", error);
      setSubmitContactError(error.message || "Fehler beim Hinzufügen des Kontakts.");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleClose = () => {
    setNewContactData(initialContactFormData); // Reset form
    setSubmitContactError(null); // Clear errors
    onClose(); // Call the onClose prop passed from parent
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full m-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Neuen Kontakt erstellen</h2>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-grow">
          {/* Name */}
          <div className="relative">
            <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" name="name" placeholder="Name (Pflichtfeld)" value={newContactData.name} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" required disabled={isSubmittingContact} />
          </div>
          {/* Company */}
          <div className="relative">
            <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" name="company" placeholder="Unternehmen" value={newContactData.company} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmittingContact} />
          </div>
          {/* Email */}
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="email" name="email" placeholder="E-Mail (Pflichtfeld)" value={newContactData.email} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" required disabled={isSubmittingContact} />
          </div>
          {/* Phone */}
          <div className="relative">
            <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="tel" name="phone" placeholder="Telefon" value={newContactData.phone} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmittingContact} />
          </div>
          {/* Deal Value */}
          <div className="relative">
            <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="number" name="dealValue" placeholder="Deal Value (€)" value={newContactData.dealValue} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmittingContact} />
          </div>
          {/* Status */}
          <div className="relative">
              <CheckCircle className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select name="status" value={newContactData.status} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm capitalize bg-white appearance-none" disabled={isSubmittingContact}>
              {contactStatusesOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          {/* Last Contact Date */}
          <div>
            <label htmlFor="lastContactDate" className="block text-sm font-medium text-gray-700 mb-1">Letzter Kontakt</label>
            <input type="date" id="lastContactDate" name="lastContact" value={newContactData.lastContact} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmittingContact} />
          </div>
          {/* Deal Stage */}
          <div className="relative">
              <AlignLeft className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" name="dealStage" placeholder="Deal Stage" value={newContactData.dealStage} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmittingContact} />
          </div>
          {/* Priority */}
          <div>
            <label htmlFor="prioritySelect" className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
            <select id="prioritySelect" name="priority" value={newContactData.priority} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm capitalize bg-white appearance-none" disabled={isSubmittingContact}>
              {contactPriorityOptions.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
          {/* Tags */}
          <div className="relative">
            <Tag className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" name="tags" placeholder="Tags (Komma-getrennt)" value={newContactData.tags} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmittingContact} />
          </div>
          {/* Notes */}
          <div>
              <label htmlFor="notesArea" className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
            <textarea name="notes" id="notesArea" placeholder="Notizen zum Kontakt..." value={newContactData.notes} onChange={handleInputChange} rows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm resize-none" disabled={isSubmittingContact}></textarea>
          </div>

          {submitContactError && <p className="text-error-red text-sm text-center py-2">{submitContactError}</p>}
          
          <div className="pt-2 border-t border-gray-200 flex justify-end space-x-3">
              <button 
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-colors" 
              disabled={isSubmittingContact}
            >
              Abbrechen
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-blue rounded-lg hover:bg-primary-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-colors flex items-center disabled:opacity-70"
              disabled={isSubmittingContact || !newContactData.name || !newContactData.email} // Disable if submitting or required fields empty
            >
              {isSubmittingContact ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Speichern...</>
              ) : (
                <><Plus className="w-4 h-4 mr-1.5" /> Kontakt speichern</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal; 
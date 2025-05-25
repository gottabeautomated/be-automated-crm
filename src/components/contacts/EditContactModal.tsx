import React, { useState, useEffect } from 'react';
import { useAuth } from '@/services/firebase/AuthProvider';
import { Timestamp } from 'firebase/firestore';
import {
  X,
  Save,
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
import { FirestoreContact, EditContactFormData } from '@/types/contactTypes';
import { updateContact } from '@/services/firebase/contactService';

const contactStatusesOptions = ['Lead', 'Interessent', 'Kunde'] as const;
const contactPriorityOptions = ['low', 'medium', 'high'] as const;

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: FirestoreContact | null;
}

const EditContactModal: React.FC<EditContactModalProps> = ({ isOpen, onClose, contact }) => {
  const { user } = useAuth();
  const [editContactData, setEditContactData] = useState<EditContactFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      // Convert Firestore data to form data structure
      let lastContactDateStr = '';
      if (contact.lastContact) {
        if (contact.lastContact instanceof Timestamp) {
          lastContactDateStr = contact.lastContact.toDate().toISOString().split('T')[0];
        } else if (typeof contact.lastContact === 'string') {
          // Attempt to parse if it's already a date string (might be from older data or manual input)
          const parsedDate = new Date(contact.lastContact);
          if (!isNaN(parsedDate.getTime())) {
            lastContactDateStr = parsedDate.toISOString().split('T')[0];
          } else {
             // if parsing fails, keep it as is or set to empty, depending on desired behavior
            lastContactDateStr = contact.lastContact; // Or set to today as a fallback if needed
          }
        } else {
             lastContactDateStr = new Date().toISOString().split('T')[0]; // Fallback to today if not set
        }
      } else {
        lastContactDateStr = new Date().toISOString().split('T')[0]; // Default to today if not set
      }

      setEditContactData({
        name: contact.name || '',
        company: contact.company || '',
        email: contact.email || '',
        phone: contact.phone || '',
        dealValue: contact.dealValue ? String(contact.dealValue) : '0',
        status: contact.status || 'Lead',
        lastContact: lastContactDateStr,
        dealStage: contact.dealStage || '',
        priority: contact.priority || 'medium',
        tags: contact.tags ? contact.tags.join(', ') : '',
        notes: contact.notes || '',
      });
    } else {
      // Reset form if contact is null (e.g., modal closed and reopened without a contact)
      setEditContactData(null); 
    }
  }, [contact]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditContactData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contact || !editContactData) {
      setSubmitError("Benutzer nicht angemeldet oder Kontaktdaten fehlen.");
      return;
    }
    if (!editContactData.name || !editContactData.email) {
      setSubmitError("Name und E-Mail sind Pflichtfelder.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateContact(user.uid, contact.id, editContactData);
      handleClose();
    } catch (error: any) {
      console.error("Error updating contact (from service): ", error);
      setSubmitError(error.message || "Fehler beim Aktualisieren des Kontakts.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitError(null);
    onClose(); // Call the onClose prop passed from parent
    // No need to reset editContactData here as useEffect will handle it when contact prop changes
  };

  if (!isOpen || !editContactData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full m-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Kontakt bearbeiten</h2>
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
            <input type="text" name="name" placeholder="Name (Pflichtfeld)" value={editContactData.name} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" required disabled={isSubmitting} />
          </div>
          {/* Company */}
          <div className="relative">
            <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" name="company" placeholder="Unternehmen" value={editContactData.company} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmitting} />
          </div>
          {/* Email */}
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="email" name="email" placeholder="E-Mail (Pflichtfeld)" value={editContactData.email} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" required disabled={isSubmitting} />
          </div>
          {/* Phone */}
          <div className="relative">
            <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="tel" name="phone" placeholder="Telefon" value={editContactData.phone} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmitting} />
          </div>
          {/* Deal Value */}
          <div className="relative">
            <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="number" name="dealValue" placeholder="Deal Value (€)" value={editContactData.dealValue} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmitting} />
          </div>
          {/* Status */}
          <div className="relative">
            <CheckCircle className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select name="status" value={editContactData.status} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm capitalize bg-white appearance-none" disabled={isSubmitting}>
              {contactStatusesOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          {/* Last Contact Date */}
          <div>
            <label htmlFor="lastContactDateEdit" className="block text-sm font-medium text-gray-700 mb-1">Letzter Kontakt</label>
            <input type="date" id="lastContactDateEdit" name="lastContact" value={editContactData.lastContact} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmitting} />
          </div>
          {/* Deal Stage */}
          <div className="relative">
            <AlignLeft className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" name="dealStage" placeholder="Deal Stage" value={editContactData.dealStage} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmitting} />
          </div>
          {/* Priority */}
          <div>
            <label htmlFor="prioritySelectEdit" className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
            <select id="prioritySelectEdit" name="priority" value={editContactData.priority} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm capitalize bg-white appearance-none" disabled={isSubmitting}>
              {contactPriorityOptions.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
          {/* Tags */}
          <div className="relative">
            <Tag className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" name="tags" placeholder="Tags (Komma-getrennt)" value={editContactData.tags} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm" disabled={isSubmitting} />
          </div>
          {/* Notes */}
          <div>
            <label htmlFor="notesAreaEdit" className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
            <textarea name="notes" id="notesAreaEdit" placeholder="Notizen zum Kontakt..." value={editContactData.notes} onChange={handleInputChange} rows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue text-sm resize-none" disabled={isSubmitting}></textarea>
          </div>

          {submitError && <p className="text-error-red text-sm text-center py-2">{submitError}</p>}
          
          <div className="pt-2 border-t border-gray-200 flex justify-end space-x-3">
            <button 
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-colors" 
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-blue rounded-lg hover:bg-primary-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-colors flex items-center disabled:opacity-70"
              disabled={isSubmitting || !editContactData.name || !editContactData.email}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Speichern...</>
              ) : (
                <><Save className="w-4 h-4 mr-1.5" /> Änderungen speichern</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContactModal; 
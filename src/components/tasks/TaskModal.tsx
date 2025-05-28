import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/services/firebase/AuthProvider';
import { subscribeToDealsService } from '@/services/firebase/dealService';
import { subscribeToContacts } from '@/services/firebase/contactService';
import { FirestoreContact } from '@/types/contactTypes';
import { FirestoreError } from 'firebase/firestore';

interface Deal {
  id: string;
  title: string;
}

interface Contact {
  id: string;
  name: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description?: string;
    dueDate?: Timestamp | null;
    status: 'open' | 'in_progress' | 'done';
    relatedDealId?: string;
    relatedContactId?: string;
  }) => void;
  initialData?: {
    title: string;
    description?: string;
    dueDate?: Timestamp | null;
    status: 'open' | 'in_progress' | 'done';
    relatedDealId?: string;
    relatedContactId?: string;
  };
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(initialData?.dueDate ? initialData.dueDate.toDate() : new Date());
  const [dueTime, setDueTime] = useState<string>(initialData?.dueDate ? initialData.dueDate.toDate().toTimeString().slice(0, 5) : '12:00');
  const [status, setStatus] = useState<'open' | 'in_progress' | 'done'>(initialData?.status || 'open');
  const [relatedDealId, setRelatedDealId] = useState(initialData?.relatedDealId || '');
  const [relatedContactId, setRelatedContactId] = useState(initialData?.relatedContactId || '');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const STANDARD_TASKS = [
    { title: 'Kunde kontaktieren', description: 'Den Kunden telefonisch oder per E-Mail kontaktieren.', status: 'open' },
    { title: 'Vertrag prüfen', description: 'Vertragsunterlagen auf Vollständigkeit und Richtigkeit prüfen.', status: 'open' },
    { title: 'Follow-up Termin vereinbaren', description: 'Einen Folgetermin mit dem Kunden abstimmen.', status: 'open' },
    { title: 'Dokumente anfordern', description: 'Fehlende Dokumente beim Kunden anfordern.', status: 'open' },
    { title: 'Angebot erstellen', description: 'Ein individuelles Angebot für den Kunden ausarbeiten und versenden.', status: 'open' },
    { title: 'Bedarfsermittlung durchführen', description: 'Mit dem Kunden die Anforderungen und den Bedarf klären.', status: 'open' },
    { title: 'Produktpräsentation vorbereiten', description: 'Präsentationsunterlagen für das Kundengespräch zusammenstellen.', status: 'open' },
    { title: 'Nachfassen nach Angebot', description: 'Kunden nach Angebotsversand kontaktieren und Rückmeldung einholen.', status: 'open' },
  ];

  useEffect(() => {
    if (isOpen && user?.uid) {
      const unsubscribeDeals = subscribeToDealsService(
        user.uid,
        (deals) => setDeals(deals),
        (err) => console.error('Fehler beim Laden der Deals:', err)
      );
      const unsubscribeContacts = subscribeToContacts(
        user.uid,
        (contacts: FirestoreContact[]) => setContacts(contacts.map(c => ({ id: c.id, name: c.name }))),
        (err: FirestoreError) => console.error('Fehler beim Laden der Kontakte:', err)
      );
      return () => {
        unsubscribeDeals();
        unsubscribeContacts();
      };
    }
  }, [isOpen, user?.uid]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setDueDate(initialData.dueDate ? initialData.dueDate.toDate() : new Date());
      setDueTime(initialData.dueDate ? initialData.dueDate.toDate().toTimeString().slice(0, 5) : '12:00');
      setStatus(initialData.status);
      setRelatedDealId(initialData.relatedDealId || '');
      setRelatedContactId(initialData.relatedContactId || '');
    } else {
      setTitle('');
      setDescription('');
      setDueDate(new Date());
      setDueTime('12:00');
      setStatus('open');
      setRelatedDealId('');
      setRelatedContactId('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedDate = dueDate ? new Date(dueDate) : new Date();
    const [hours, minutes] = dueTime.split(':').map(Number);
    combinedDate.setHours(hours, minutes);
    onSave({
      title,
      description: description || undefined,
      dueDate: Timestamp.fromDate(combinedDate),
      status,
      relatedDealId: relatedDealId || undefined,
      relatedContactId: relatedContactId || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-sky-800">Aufgabe {initialData ? 'bearbeiten' : 'anlegen'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vorlage wählen</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md mb-2"
              onChange={e => {
                const idx = e.target.value;
                if (idx !== '') {
                  const tpl = STANDARD_TASKS[Number(idx)];
                  setTitle(tpl.title);
                  setDescription(tpl.description);
                  setStatus(tpl.status as 'open');
                }
              }}
              defaultValue=""
            >
              <option value="">Keine Vorlage</option>
              {STANDARD_TASKS.map((tpl, idx) => (
                <option key={tpl.title} value={idx}>{tpl.title}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fälligkeitsdatum</label>
            <input
              type="date"
              value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fälligkeitszeit</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'open' | 'in_progress' | 'done')}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="open">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="done">Erledigt</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Verknüpfter Deal (optional)</label>
            <select
              value={relatedDealId}
              onChange={(e) => setRelatedDealId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Kein Deal ausgewählt</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>{deal.title}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Verknüpfter Kontakt (optional)</label>
            <select
              value={relatedContactId}
              onChange={(e) => setRelatedContactId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Kein Kontakt ausgewählt</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>{contact.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Abbrechen
            </button>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal; 
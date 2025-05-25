import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  User,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Building,
  X,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/services/firebase/AuthProvider';
import {
  Timestamp, FirestoreError
} from 'firebase/firestore';
import AddContactModal from './AddContactModal';
import EditContactModal from './EditContactModal';
import { FirestoreContact } from '@/types/contactTypes';
import { subscribeToContacts, deleteContact as deleteContactService } from '@/services/firebase/contactService';

const contactStatuses = ['alle', 'Kunde', 'Interessent', 'Lead'] as const;
type ContactStatus = typeof contactStatuses[number];

const ContactsPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<FirestoreContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<FirestoreContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus>('alle');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [errorContacts, setErrorContacts] = useState<string | null>(null);

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<FirestoreContact | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setContacts([]);
      setLoadingContacts(false);
      return () => {};
    }

    setLoadingContacts(true);
    setErrorContacts(null);

    const unsubscribe = subscribeToContacts(
      user.uid,
      (fetchedContacts) => {
        setContacts(fetchedContacts);
        setLoadingContacts(false);
      },
      (error: FirestoreError) => {
        console.error("Error fetching contacts (from service): ", error);
        setErrorContacts("Fehler beim Laden der Kontakte.");
        setLoadingContacts(false);
      }
    );

    return () => unsubscribe();

  }, [user]);

  const filteredContacts = contacts.filter(contact => {
    const searchMatch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = statusFilter === 'alle' || contact.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const handleDeleteContact = async (contactId: string) => {
    if (!user) {
      console.error("User not logged in, cannot delete contact.");
      setDeleteError("Nicht angemeldet. Kontakt konnte nicht gelöscht werden.");
      return;
    }

    setIsDeletingContact(true);
    setDeleteError(null);

    try {
      await deleteContactService(user.uid, contactId);
      
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact(null);
      }
    } catch (error: any) {
      console.error("Error deleting contact (from service): ", error);
      setDeleteError(error.message || "Fehler beim Löschen des Kontakts.");
    } finally {
      setIsDeletingContact(false);
    }
  };

  const formatDate = (dateValue: string | Timestamp | undefined): string => {
    if (!dateValue) return 'N/A';
    let date: Date;
    if (dateValue instanceof Timestamp) {
      date = dateValue.toDate();
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return 'Ungültiges Datum';
      }
    } else {
        return 'N/A';
    }
    return date.toLocaleDateString('de-DE', { year: '2-digit', month: '2-digit', day: '2-digit' });
  };

  const handleOpenEditModal = (contact: FirestoreContact) => {
    setContactToEdit(contact);
    setIsEditModalOpen(true);
    setSelectedContact(null);
  };

  if (loadingContacts) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 text-primary-blue animate-spin" />
        <p className="ml-4 text-lg text-gray-600">Kontakte werden geladen...</p>
      </div>
    );
  }

  if (errorContacts) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-red-50 p-6 rounded-lg border border-error-red">
        <AlertTriangle className="w-12 h-12 text-error-red mb-4" />
        <p className="text-lg text-error-red font-semibold">Fehler beim Laden der Kontakte</p>
        <p className="text-gray-700">{errorContacts}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-grow w-full md:w-auto">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Kontakte durchsuchen..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex space-x-3 w-full md:w-auto justify-end">
          <div className="relative" ref={filterDropdownRef}>
            <button 
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center space-x-2"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700 capitalize hidden sm:inline">
                {statusFilter === 'alle' ? 'Status' : statusFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                {contactStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      statusFilter === status ? 'bg-blue-50 text-primary-blue' : 'text-gray-700 hover:bg-gray-100'
                    } capitalize`}
                  >
                    {status === 'alle' ? 'Alle anzeigen' : status}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              setIsAddContactModalOpen(true);
            }} 
            className="bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue-dark transition-colors flex items-center space-x-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Kontakt</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Unternehmen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Deal Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Letzter Kontakt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedContact(contact)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary-blue" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate">{contact.name}</div>
                          <div className="text-sm text-gray-500 truncate">{contact.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">{contact.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                        contact.status === 'Kunde' ? 'bg-success-green-light/20 text-success-green' :
                        contact.status === 'Interessent' ? 'bg-blue-100 text-primary-blue' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium hidden lg:table-cell">
                      €{contact.dealValue ? contact.dealValue.toLocaleString() : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {formatDate(contact.lastContact)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); console.log('Call:', contact.name)}} className="p-1 text-gray-500 hover:text-primary-blue hover:bg-blue-50 rounded-md transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); console.log('Email:', contact.name)}} className="p-1 text-gray-500 hover:text-primary-blue hover:bg-blue-50 rounded-md transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          handleOpenEditModal(contact);
                        }} 
                        className="p-1 text-gray-500 hover:text-primary-blue hover:bg-blue-50 rounded-md transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    {contacts.length === 0 ? 'Noch keine Kontakte erstellt.' : 'Keine Kontakte gefunden, die Ihrer Suche entsprechen.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddContactModal 
        isOpen={isAddContactModalOpen} 
        onClose={() => setIsAddContactModalOpen(false)} 
      />

      {contactToEdit && (
        <EditContactModal 
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setContactToEdit(null);
          }}
          contact={contactToEdit}
        />
      )}

      {selectedContact && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={() => setSelectedContact(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out scale-100 opacity-100" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{selectedContact.name}</h2>
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wider">Kontaktinformationen</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2 py-1">
                      <Building className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{selectedContact.company}</span>
                    </div>
                    <div className="flex items-start space-x-2 py-1">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <a href={`mailto:${selectedContact.email}`} className="text-primary-blue hover:underline">{selectedContact.email}</a>
                    </div>
                    <div className="flex items-start space-x-2 py-1">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <a href={`tel:${selectedContact.phone}`} className="text-primary-blue hover:underline">{selectedContact.phone}</a>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wider">Deal Informationen</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Deal Value:</span>
                      <span className="font-medium text-gray-800">€{selectedContact.dealValue ? selectedContact.dealValue.toLocaleString() : '0'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ 
                        selectedContact.status === 'Kunde' ? 'bg-success-green-light/20 text-success-green' :
                        selectedContact.status === 'Interessent' ? 'bg-blue-100 text-primary-blue' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {selectedContact.status}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Deal Stage:</span>
                      <span className="font-medium text-gray-800">{selectedContact.dealStage || 'N/A'}</span>
                    </div>
                     <div className="flex justify-between py-1">
                      <span className="text-gray-500">Priorität:</span>
                      <span className={`font-medium capitalize ${selectedContact.priority === 'high' ? 'text-error-red' : selectedContact.priority === 'medium' ? 'text-warning-orange' : selectedContact.priority === 'low' ? 'text-gray-600' : 'text-gray-500'}`}>{selectedContact.priority || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wider">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.tags && selectedContact.tags.length > 0 ? selectedContact.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 text-primary-blue text-xs font-medium rounded-full">
                      {tag}
                    </span>
                  )) : <p className="text-sm text-gray-500">Keine Tags vorhanden.</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wider">Notizen</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {selectedContact.notes || 'Keine Notizen vorhanden.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 mt-6">
                <button 
                  onClick={() => {
                    if(selectedContact) handleOpenEditModal(selectedContact);
                  }}
                  className="w-full sm:w-auto flex-1 bg-primary-blue text-white py-2 px-4 rounded-lg hover:bg-primary-blue-dark transition-colors flex items-center justify-center space-x-2 text-sm font-medium">
                  <Edit3 className="w-4 h-4"/>
                  <span>Bearbeiten</span>
                </button>
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    await handleDeleteContact(selectedContact.id); 
                  }}
                  className="w-full sm:w-auto flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-error-red hover:text-white hover:border-error-red transition-colors flex items-center justify-center space-x-2 text-sm font-medium disabled:opacity-50"
                  disabled={isDeletingContact}
                > 
                  {isDeletingContact ? (
                    <Loader2 className="w-4 h-4 animate-spin"/>
                  ) : (
                    <Trash2 className="w-4 h-4"/>
                  )}
                  <span>{isDeletingContact ? "Löschen..." : "Löschen"}</span>
                </button>
              </div>
              {deleteError && <p className="text-xs text-error-red mt-2 text-center">{deleteError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage; 
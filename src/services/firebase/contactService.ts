import { db } from './firebase.config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  FirestoreError,
  where,
  limit,
  getDocs
} from 'firebase/firestore';
import { FirestoreContact, ContactFormData, EditContactFormData } from '@/types/contactTypes';

/**
 * Erstellt einen neuen Kontakt in Firestore für den gegebenen Benutzer.
 * @param userId UID des Benutzers.
 * @param contactData Daten des neuen Kontakts.
 * @returns Die ID des neu erstellten Kontaktdokuments.
 */
export const createContact = async (userId: string, contactData: ContactFormData): Promise<string> => {
  try {
    const contactsCollectionRef = collection(db, 'users', userId, 'contacts');
    const contactToAdd = {
      ...contactData,
      dealValue: parseFloat(contactData.dealValue) || 0,
      tags: contactData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      // lastContact ist bereits ein String im Format YYYY-MM-DD
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: userId,
    };
    const docRef = await addDoc(contactsCollectionRef, contactToAdd);
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating contact: ", error);
    throw new Error(error.message || "Fehler beim Erstellen des Kontakts.");
  }
};

/**
 * Aktualisiert einen bestehenden Kontakt in Firestore.
 * @param userId UID des Benutzers.
 * @param contactId ID des zu aktualisierenden Kontakts.
 * @param contactData Die zu aktualisierenden Daten.
 */
export const updateContact = async (userId: string, contactId: string, contactData: EditContactFormData): Promise<void> => {
  try {
    const contactDocRef = doc(db, 'users', userId, 'contacts', contactId);
    const contactToUpdate = {
      ...contactData,
      dealValue: parseFloat(contactData.dealValue) || 0,
      tags: contactData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(contactDocRef, contactToUpdate);
  } catch (error: any) {
    console.error("Error updating contact: ", error);
    throw new Error(error.message || "Fehler beim Aktualisieren des Kontakts.");
  }
};

/**
 * Löscht einen Kontakt aus Firestore.
 * @param userId UID des Benutzers.
 * @param contactId ID des zu löschenden Kontakts.
 */
export const deleteContact = async (userId: string, contactId: string): Promise<void> => {
  try {
    const contactDocRef = doc(db, 'users', userId, 'contacts', contactId);
    await deleteDoc(contactDocRef);
  } catch (error: any) {
    console.error("Error deleting contact: ", error);
    throw new Error(error.message || "Fehler beim Löschen des Kontakts.");
  }
};

/**
 * Abonniert Echtzeit-Updates für die Kontakte eines Benutzers.
 * @param userId UID des Benutzers.
 * @param onContactsUpdate Callback-Funktion, die mit der Liste der Kontakte aufgerufen wird.
 * @param onError Callback-Funktion für Fehler.
 * @returns Unsubscribe-Funktion für den Listener.
 */
export const subscribeToContacts = (
  userId: string, 
  onContactsUpdate: (contacts: FirestoreContact[]) => void, 
  onError: (error: FirestoreError) => void
) => {
  const contactsCollectionRef = collection(db, 'users', userId, 'contacts');
  const q = query(contactsCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, 
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const fetchedContacts: FirestoreContact[] = [];
      querySnapshot.forEach((doc) => {
        // Explizites Typ-Casting für doc.data(), da TypeScript sonst die genauen Felder nicht kennt
        const data = doc.data() as Omit<FirestoreContact, 'id'>; 
        fetchedContacts.push({ 
          id: doc.id, 
          ...data,
          // Sicherstellen, dass Timestamp-Felder auch als Timestamps behandelt werden,
          // falls sie als einfache Objekte vom Server kommen könnten (obwohl Firestore SDK das meist korrekt handhabt)
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : (data.createdAt as any)?.toDate ? new Timestamp((data.createdAt as any).seconds, (data.createdAt as any).nanoseconds) : Timestamp.now(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : (data.updatedAt as any)?.toDate ? new Timestamp((data.updatedAt as any).seconds, (data.updatedAt as any).nanoseconds) : Timestamp.now(),
        } as FirestoreContact);
      });
      onContactsUpdate(fetchedContacts);
    },
    (error: FirestoreError) => {
      console.error("Error in contact subscription: ", error);
      onError(error);
    }
  );

  return unsubscribe;
};

/**
 * Findet einen Kontakt anhand seiner E-Mail-Adresse für einen bestimmten Benutzer.
 * @param userId UID des Benutzers.
 * @param email E-Mail-Adresse des zu suchenden Kontakts.
 * @returns Das FirestoreContact-Objekt, falls gefunden, sonst null.
 */
export const findContactByEmailService = async (userId: string, email: string): Promise<FirestoreContact | null> => {
  if (!userId || !email) {
    console.error("UserID and Email are required to find a contact.");
    return null;
  }
  try {
    const contactsCollectionRef = collection(db, 'users', userId, 'contacts');
    const q = query(contactsCollectionRef, where("email", "==", email.toLowerCase()), limit(1)); // Email in Kleinbuchstaben suchen
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      const data = docSnapshot.data() as Omit<FirestoreContact, 'id'>;
      return {
        id: docSnapshot.id,
        ...data,
        // Sicherstellen, dass Timestamps korrekt sind
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(), // Fallback, sollte idealerweise immer Timestamp sein
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(), // Fallback
      } as FirestoreContact;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error("Error finding contact by email: ", error);
    // Werfe den Fehler nicht weiter, damit der aufrufende Service entscheiden kann, wie er damit umgeht (z.B. neuen Lead erstellen)
    return null; 
  }
};

export interface ContactQuickSelectItem {
  id: string;
  name: string; // Kombinierter Name für die Anzeige
}

/**
 * Lädt eine vereinfachte Liste von Kontakten (ID und Name) für einen Benutzer.
 * Nützlich für Dropdown-Auswahlen.
 * @param userId UID des Benutzers.
 * @returns Ein Promise, das ein Array von ContactQuickSelectItem auflöst.
 */
export const getContactListForUser = async (userId: string): Promise<ContactQuickSelectItem[]> => {
  if (!userId) {
    console.error("UserID is required to get contact list.");
    return [];
  }
  try {
    const contactsCollectionRef = collection(db, 'users', userId, 'contacts');
    // Sortieren nach dem Feld 'name'
    const q = query(contactsCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);

    const contactList: ContactQuickSelectItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Partial<Pick<FirestoreContact, 'name'>>; // name statt firstName/lastName
      // Stelle sicher, dass name vorhanden ist
      const contactName = data.name || 'Unbenannter Kontakt';
      contactList.push({
        id: doc.id,
        name: contactName
      });
    });
    return contactList;
  } catch (error: any) {
    console.error("Error fetching contact list for user: ", error);
    // Im Fehlerfall eine leere Liste zurückgeben, damit die UI nicht bricht
    return []; 
  }
}; 
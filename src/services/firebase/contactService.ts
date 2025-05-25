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
  FirestoreError
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
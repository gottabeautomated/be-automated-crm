import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
  FirestoreError
} from 'firebase/firestore';
import { db } from './firebase.config'; // Korrekter Import von db
import { Deal, DealFormData } from '@/types/dealTypes';
import { toast } from 'sonner';

// --- Helper Functions ---
const getDealsCollectionRef = (userId: string) => {
  if (!userId) throw new Error ('User ID cannot be empty when getting deals collection ref.');
  return collection(db, `users/${userId}/deals`);
};

const getDealDocRef = (userId: string, dealId: string) => {
  if (!userId) throw new Error ('User ID cannot be empty when getting deal doc ref.');
  if (!dealId) throw new Error ('Deal ID cannot be empty when getting deal doc ref.');
  return doc(db, `users/${userId}/deals`, dealId);
};

// --- Service Functions ---

/**
 * Subscribes to real-time updates for deals belonging to a specific user.
 * Orders deals by creation date in descending order.
 */
export const subscribeToDealsService = (
  userId: string,
  callback: (deals: Deal[]) => void,
  onError: (error: FirestoreError) => void
): (() => void) => { // Returns an unsubscribe function
  try {
    const dealsCollectionRef = getDealsCollectionRef(userId);
    const q = query(dealsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const deals = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Deal, 'id'>),
      }));
      callback(deals);
    }, (error) => {
      console.error("Error subscribing to deals: ", error);
      onError(error);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up deals subscription: ", error);
    onError(error as FirestoreError); 
    return () => {}; // Return a no-op unsubscribe function on error
  }
};

/**
 * Adds a new deal to Firestore for a specific user.
 */
export const addDealService = async (userId: string, dealData: DealFormData, pipelineStages?: any[]): Promise<string> => {
  const dealsCollectionRef = getDealsCollectionRef(userId);
  try {
    // Hole den Stage-Namen anhand der stageId (für das Dashboard)
    let stageName = '';
    if (dealData.stageId) {
      stageName = dealData.stageId;
      if (pipelineStages && Array.isArray(pipelineStages)) {
        const found = pipelineStages.find((s: any) => s.id === dealData.stageId);
        if (found) stageName = found.name;
      }
    }
    const dealObjectForFirestore: any = {
      title: dealData.title,
      company: dealData.companyName,
      value: parseFloat(dealData.value) || 0,
      probability: parseInt(dealData.probability, 10) || 0,
      stageId: dealData.stageId,
      stage: stageName, // NEU: für Dashboard-Auswertungen
      status: 'active', // NEU: immer beim Anlegen
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (dealData.contactId) dealObjectForFirestore.contactId = dealData.contactId;
    if (dealData.assignedTo) dealObjectForFirestore.assignedUserId = dealData.assignedTo;
    if (dealData.notes) dealObjectForFirestore.notes = dealData.notes;
    if (dealData.description) dealObjectForFirestore.description = dealData.description;
    if (dealData.tags && dealData.tags.length > 0) dealObjectForFirestore.tags = dealData.tags;
    if (dealData.expectedCloseDate) dealObjectForFirestore.expectedCloseDate = Timestamp.fromDate(new Date(dealData.expectedCloseDate));
    const docRef = await addDoc(dealsCollectionRef, dealObjectForFirestore);
    return docRef.id;
  } catch (error) {
    console.error("Error adding deal: ", error);
    throw error;
  }
};

/**
 * Updates the stage of a specific deal.
 */
export const updateDealStageService = async (
  userId: string,
  dealId: string,
  newStageId: string,
  pipelineStages?: any[]
): Promise<void> => {
  const dealRef = getDealDocRef(userId, dealId);
  try {
    let statusUpdate: any = {};
    let stageName = newStageId;
    if (pipelineStages && Array.isArray(pipelineStages)) {
      const found = pipelineStages.find((s: any) => s.id === newStageId);
      if (found) stageName = found.name;
    }
    // Prüfe, ob die neue Stage "Gewonnen" ist (Name oder ID)
    if (stageName && (stageName.toLowerCase() === 'gewonnen' || newStageId === 'won')) {
      statusUpdate = {
        status: 'won',
        closedAt: serverTimestamp(),
      };
    } else {
      statusUpdate = {
        status: 'active',
        closedAt: null,
      };
    }
    await updateDoc(dealRef, {
      stageId: newStageId,
      stage: stageName,
      updatedAt: serverTimestamp(),
      ...statusUpdate,
    });
  } catch (error) {
    console.error('Error updating deal stage: ', error);
    throw error;
  }
};

/**
 * Updates general details of a specific deal.
 */
export const updateDealDetailsService = async (
  userId: string,
  dealId: string,
  dealData: Partial<DealFormData> 
): Promise<void> => {
  const dealRef = getDealDocRef(userId, dealId);
  const updatePayload: Record<string, any> = {};

  // Map and validate fields from DealFormData to update payload
  if (dealData.title !== undefined) updatePayload.title = dealData.title;
  if (dealData.companyName !== undefined) updatePayload.company = dealData.companyName;
  if (dealData.value !== undefined) updatePayload.value = parseFloat(dealData.value) || 0;
  if (dealData.probability !== undefined) updatePayload.probability = parseInt(dealData.probability, 10) || 0;
  if (dealData.stageId !== undefined) updatePayload.stageId = dealData.stageId;
  
  // For optional fields, set to null if explicitly empty, otherwise use the value
  // This allows clearing fields in Firestore by setting them to null
  if (dealData.hasOwnProperty('contactId')) updatePayload.contactId = dealData.contactId || null;
  if (dealData.hasOwnProperty('assignedTo')) updatePayload.assignedUserId = dealData.assignedTo || null;
  if (dealData.hasOwnProperty('notes')) updatePayload.notes = dealData.notes || null;
  if (dealData.hasOwnProperty('description')) updatePayload.description = dealData.description || null;
  if (dealData.hasOwnProperty('tags')) updatePayload.tags = (dealData.tags && dealData.tags.length > 0) ? dealData.tags : null;
  
  if (dealData.hasOwnProperty('expectedCloseDate')) {
    updatePayload.expectedCloseDate = dealData.expectedCloseDate ? Timestamp.fromDate(new Date(dealData.expectedCloseDate)) : null;
  }

  if (Object.keys(updatePayload).length === 0) {
    console.log("No valid fields to update for deal.");
    return; 
  }

  updatePayload.updatedAt = serverTimestamp();

  try {
    await updateDoc(dealRef, updatePayload);
  } catch (error) {
    console.error("Error updating deal details: ", error);
    throw error;
  }
};

/**
 * Deletes a specific deal from Firestore.
 */
export const deleteDealService = async (userId: string, dealId: string): Promise<void> => {
  const dealRef = getDealDocRef(userId, dealId);
  try {
    await deleteDoc(dealRef);
  } catch (error) {
    console.error("Error deleting deal: ", error);
    throw error;
  }
};

/**
 * Fetches all deals associated with a specific contact ID for a user.
 */
export const getDealsByContactIdService = async (userId: string, contactId: string): Promise<Deal[]> => {
    const dealsCollectionRef = getDealsCollectionRef(userId);
    const q = query(dealsCollectionRef, where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  
    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Deal, 'id'>),
      }));
    } catch (error) {
      console.error("Error fetching deals by contact ID: ", error);
      throw error;
    }
  };

export interface DealQuickSelectItem {
  id: string;
  title: string; // Anzeigename des Deals
}

/**
 * Lädt eine vereinfachte Liste von Deals (ID und Titel) für einen Benutzer.
 * Nützlich für Dropdown-Auswahlen.
 * @param userId UID des Benutzers.
 * @returns Ein Promise, das ein Array von DealQuickSelectItem auflöst.
 */
export const getDealListForUser = async (userId: string): Promise<DealQuickSelectItem[]> => {
  if (!userId) {
    console.error("UserID is required to get deal list.");
    return [];
  }
  try {
    const dealsCollectionRef = getDealsCollectionRef(userId);
    // Sortieren nach Titel für eine geordnete Liste
    const q = query(dealsCollectionRef, orderBy('title', 'asc'));
    const querySnapshot = await getDocs(q);

    const dealList: DealQuickSelectItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Partial<Pick<Deal, 'title'>>;
      // Stelle sicher, dass title vorhanden ist
      const dealTitle = data.title || 'Unbenannter Deal';
      dealList.push({
        id: doc.id,
        title: dealTitle
      });
    });
    return dealList;
  } catch (error: any) {
    console.error("Error fetching deal list for user: ", error);
    // Im Fehlerfall eine leere Liste zurückgeben, damit die UI nicht bricht
    return []; 
  }
};

export interface FirestoreDeal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ruft alle Deals eines Benutzers für den CSV-Export ab.
 * @param userId UID des Benutzers.
 * @returns Ein Promise, das ein Array von FirestoreDeal-Objekten auflöst.
 */
export const getAllDealsForExport = async (userId: string): Promise<FirestoreDeal[]> => {
  if (!userId) {
    console.error("UserID is required to get all deals for export.");
    return [];
  }
  try {
    const dealsCollectionRef = collection(db, 'users', userId, 'deals');
    const q = query(dealsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const deals: FirestoreDeal[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<FirestoreDeal, 'id'>;
      deals.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        expectedCloseDate: data.expectedCloseDate ? (typeof data.expectedCloseDate === 'string' ? data.expectedCloseDate : (data.expectedCloseDate as Timestamp).toDate().toISOString().split('T')[0]) : '',
      } as unknown as FirestoreDeal);
    });
    return deals;
  } catch (error: any) {
    console.error("Error fetching all deals for export: ", error);
    toast.error("Fehler beim Abrufen der Deals für den Export.");
    return [];
  }
};

// END OF FILE - Removed redundant functions below this line 
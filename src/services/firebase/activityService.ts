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
  FirestoreError,
  QueryConstraint // Import QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase.config';
import { Activity, ActivityFormData, ActivityTypeName } from '@/types/activityTypes';

// --- Helper Functions ---
const getActivitiesCollectionRef = (userId: string) => {
  if (!userId) throw new Error('User ID cannot be empty when getting activities collection ref.');
  return collection(db, `users/${userId}/activities`);
};

const getActivityDocRef = (userId: string, activityId: string) => {
  if (!userId) throw new Error('User ID cannot be empty when getting activity doc ref.');
  if (!activityId) throw new Error('Activity ID cannot be empty when getting activity doc ref.');
  return doc(db, `users/${userId}/activities`, activityId);
};

// --- Service Functions ---

/**
 * Adds a new activity to Firestore for a specific user.
 */
export const addActivityService = async (userId: string, activityData: ActivityFormData): Promise<string> => {
  const activitiesCollectionRef = getActivitiesCollectionRef(userId);
  try {
    // Initialize with required fields from Activity, omitting those not in ActivityFormData or handled by serverTimestamp
    const activityObjectForFirestore: Partial<Omit<Activity, 'id' | 'createdAt' | 'updatedAt' | 'userName' | 'contactName' | 'dealTitle' | 'completedAt'> & 
                                      Pick<Activity, 'type' | 'title' | 'activityDate' | 'userId'>> = {
      type: activityData.type,
      title: activityData.title,
      activityDate: Timestamp.fromDate(new Date(activityData.activityDate)),
      userId: userId,
    };

    // Add optional fields if they exist in activityData
    if (activityData.description) activityObjectForFirestore.description = activityData.description;
    if (activityData.notes) activityObjectForFirestore.notes = activityData.notes;
    if (activityData.contactId) activityObjectForFirestore.contactId = activityData.contactId;
    if (activityData.dealId) activityObjectForFirestore.dealId = activityData.dealId;
    
    if (activityData.type === 'Task') {
      activityObjectForFirestore.isCompleted = activityData.isCompleted || false;
    }
    // assignedUserId from activityData.assignedToUserId needs to be mapped if that field exists in Activity interface
    // and also made optional in the Omit<> type for activityObjectForFirestore

    // Prepare the final object for addDoc, including timestamps
    let finalActivityObject: any = {
        ...activityObjectForFirestore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    if (activityObjectForFirestore.isCompleted && activityData.type === 'Task') {
        finalActivityObject.completedAt = serverTimestamp();
    } else {
        // Ensure completedAt is not sent if not a completed task or not a task at all.
        // If Activity interface expects completedAt: null for these cases, adjust here.
        // By not adding it, it will be undefined in the object, and Firestore omits undefined fields.
    }

    const docRef = await addDoc(activitiesCollectionRef, finalActivityObject);
    return docRef.id;
  } catch (error) {
    console.error("Error adding activity: ", error);
    throw error;
  }
};

/**
 * Updates an existing activity in Firestore.
 */
export const updateActivityService = async (userId: string, activityId: string, activityUpdateData: Partial<ActivityFormData>): Promise<void> => {
  const activityRef = getActivityDocRef(userId, activityId);
  const updatePayload: Record<string, any> = {};

  if (activityUpdateData.title !== undefined) updatePayload.title = activityUpdateData.title;
  if (activityUpdateData.description !== undefined) updatePayload.description = activityUpdateData.description || null;
  if (activityUpdateData.notes !== undefined) updatePayload.notes = activityUpdateData.notes || null;
  if (activityUpdateData.activityDate !== undefined) updatePayload.activityDate = Timestamp.fromDate(new Date(activityUpdateData.activityDate));
  if (activityUpdateData.contactId !== undefined) updatePayload.contactId = activityUpdateData.contactId || null;
  if (activityUpdateData.dealId !== undefined) updatePayload.dealId = activityUpdateData.dealId || null;
  
  if (activityUpdateData.type === 'Task') {
    if (activityUpdateData.isCompleted !== undefined) {
      updatePayload.isCompleted = activityUpdateData.isCompleted;
      updatePayload.completedAt = activityUpdateData.isCompleted ? serverTimestamp() : null;
    } 
  } else {
    // Ensure these fields are not accidentally set for non-task activities if they were in formData
    updatePayload.isCompleted = null;
    updatePayload.completedAt = null;
  }
  // if (activityUpdateData.assignedToUserId !== undefined) updatePayload.assignedUserId = activityUpdateData.assignedToUserId || null;
  
  if (Object.keys(updatePayload).length === 0) {
    console.log("No valid fields to update for activity.");
    return;
  }

  updatePayload.updatedAt = serverTimestamp();

  try {
    await updateDoc(activityRef, updatePayload);
  } catch (error) {
    console.error("Error updating activity: ", error);
    throw error;
  }
};

/**
 * Deletes a specific activity from Firestore.
 */
export const deleteActivityService = async (userId: string, activityId: string): Promise<void> => {
  const activityRef = getActivityDocRef(userId, activityId);
  try {
    await deleteDoc(activityRef);
  } catch (error) {
    console.error("Error deleting activity: ", error);
    throw error;
  }
};

export interface ActivityFilters {
  contactId?: string;
  dealId?: string;
  activityType?: ActivityTypeName;
  dateRange?: { startDate: Date; endDate: Date };
  // Add other filters as needed: e.g., completed, assignedTo
}

/**
 * Subscribes to real-time updates for activities.
 * Orders activities by activityDate in descending order by default.
 */
export const subscribeToActivitiesService = (
  userId: string,
  filters: ActivityFilters | null, // Allow null for no filters
  callback: (activities: Activity[]) => void,
  onError: (error: FirestoreError) => void
): (() => void) => {
  try {
    const activitiesCollectionRef = getActivitiesCollectionRef(userId);
    const queryConstraints: QueryConstraint[] = [orderBy('activityDate', 'desc')];

    if (filters) {
      if (filters.contactId) {
        queryConstraints.push(where('contactId', '==', filters.contactId));
      }
      if (filters.dealId) {
        queryConstraints.push(where('dealId', '==', filters.dealId));
      }
      if (filters.activityType) {
        queryConstraints.push(where('type', '==', filters.activityType));
      }
      if (filters.dateRange) {
        queryConstraints.push(where('activityDate', '>=', Timestamp.fromDate(filters.dateRange.startDate)));
        queryConstraints.push(where('activityDate', '<=', Timestamp.fromDate(filters.dateRange.endDate)));
        // Firestore requires the first orderBy to match the inequality field for range queries.
        // If we have other orderBys, this might need adjustment or composite indexes.
      }
    }
    
    const q = query(activitiesCollectionRef, ...queryConstraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activities = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Activity, 'id'>),
      }));
      callback(activities);
    }, (error) => {
      console.error("Error subscribing to activities: ", error);
      onError(error);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up activities subscription: ", error);
    onError(error as FirestoreError);
    return () => {}; // Return a no-op unsubscribe function on error
  }
}; 
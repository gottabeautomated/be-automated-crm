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
import { db } from './firebase';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'done';
  dueDate?: Timestamp;
  priority?: 'low' | 'medium' | 'high';
  relatedDealId?: string;
  relatedContactId?: string;
  template?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  assignedTo?: string;
}

const getTasksCollectionRef = (userId: string) => {
  if (!userId) throw new Error('User ID cannot be empty when getting tasks collection ref.');
  return collection(db, `users/${userId}/tasks`);
};

const getTaskDocRef = (userId: string, taskId: string) => {
  if (!userId) throw new Error('User ID cannot be empty when getting task doc ref.');
  if (!taskId) throw new Error('Task ID cannot be empty when getting task doc ref.');
  return doc(db, `users/${userId}/tasks`, taskId);
};

export const subscribeToTasksService = (
  userId: string,
  callback: (tasks: Task[]) => void,
  onError: (error: FirestoreError) => void,
  filter?: { status?: string; template?: boolean }
): (() => void) => {
  try {
    const tasksCollectionRef = getTasksCollectionRef(userId);
    const constraints = [];
    constraints.push(orderBy('dueDate', 'asc'));
    if (filter?.status) constraints.push(where('status', '==', filter.status));
    if (filter?.template !== undefined) constraints.push(where('template', '==', filter.template));
    const q = query(tasksCollectionRef, ...constraints);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Task, 'id'>),
      }));
      callback(tasks);
    }, (error) => {
      console.error('Error subscribing to tasks: ', error);
      onError(error);
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up tasks subscription: ', error);
    onError(error as FirestoreError);
    return () => {};
  }
};

export const addTaskService = async (userId: string, taskData: Partial<Task>): Promise<string> => {
  const tasksCollectionRef = getTasksCollectionRef(userId);
  try {
    const taskObjectForFirestore: any = {
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'open',
      dueDate: taskData.dueDate ? (taskData.dueDate instanceof Timestamp ? taskData.dueDate : Timestamp.fromDate(new Date(taskData.dueDate))) : null,
      priority: taskData.priority || 'medium',
      relatedDealId: taskData.relatedDealId || null,
      relatedContactId: taskData.relatedContactId || null,
      template: !!taskData.template,
      userId: userId,
      assignedTo: taskData.assignedTo || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(tasksCollectionRef, taskObjectForFirestore);
    return docRef.id;
  } catch (error) {
    console.error('Error adding task: ', error);
    throw error;
  }
};

export const updateTaskService = async (userId: string, taskId: string, taskData: Partial<Task>): Promise<void> => {
  const taskRef = getTaskDocRef(userId, taskId);
  const updatePayload: Record<string, any> = { ...taskData, updatedAt: serverTimestamp() };
  if (taskData.dueDate && !(taskData.dueDate instanceof Timestamp)) {
    updatePayload.dueDate = Timestamp.fromDate(new Date(taskData.dueDate));
  }
  try {
    await updateDoc(taskRef, updatePayload);
  } catch (error) {
    console.error('Error updating task: ', error);
    throw error;
  }
};

export const deleteTaskService = async (userId: string, taskId: string): Promise<void> => {
  const taskRef = getTaskDocRef(userId, taskId);
  try {
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task: ', error);
    throw error;
  }
};

export const getTaskTemplatesService = async (userId: string): Promise<Task[]> => {
  const tasksCollectionRef = getTasksCollectionRef(userId);
  const q = query(tasksCollectionRef, where('template', '==', true), orderBy('title', 'asc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      ...(docSnapshot.data() as Omit<Task, 'id'>),
    }));
  } catch (error) {
    console.error('Error fetching task templates: ', error);
    throw error;
  }
}; 
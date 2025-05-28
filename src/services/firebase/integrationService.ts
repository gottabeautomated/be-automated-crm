import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// API Keys
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed?: Date;
}

export const getApiKeys = async (userId: string): Promise<ApiKey[]> => {
  try {
    const apiKeysRef = collection(db, 'users', userId, 'apiKeys');
    const snapshot = await getDocs(apiKeysRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      lastUsed: doc.data().lastUsed?.toDate()
    })) as ApiKey[];
  } catch (error) {
    console.error("Fehler beim Abrufen der API-Keys:", error);
    throw error;
  }
};

export const createApiKey = async (userId: string, name: string): Promise<ApiKey> => {
  try {
    const apiKey = {
      name,
      key: `be_${uuidv4()}`,
      createdAt: Timestamp.now(),
    };

    const apiKeysRef = collection(db, 'users', userId, 'apiKeys');
    const docRef = await addDoc(apiKeysRef, apiKey);
    
    return {
      id: docRef.id,
      ...apiKey,
      createdAt: apiKey.createdAt.toDate()
    };
  } catch (error) {
    console.error("Fehler beim Erstellen des API-Keys:", error);
    throw error;
  }
};

export const deleteApiKey = async (userId: string, keyId: string): Promise<void> => {
  try {
    const apiKeyRef = doc(db, 'users', userId, 'apiKeys', keyId);
    await deleteDoc(apiKeyRef);
  } catch (error) {
    console.error("Fehler beim Löschen des API-Keys:", error);
    throw error;
  }
};

// Webhooks
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export const getWebhooks = async (userId: string): Promise<Webhook[]> => {
  try {
    const webhooksRef = collection(db, 'users', userId, 'webhooks');
    const snapshot = await getDocs(webhooksRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      lastTriggered: doc.data().lastTriggered?.toDate()
    })) as Webhook[];
  } catch (error) {
    console.error("Fehler beim Abrufen der Webhooks:", error);
    throw error;
  }
};

export const createWebhook = async (userId: string, url: string, events: string[]): Promise<Webhook> => {
  try {
    const webhook = {
      url,
      events,
      isActive: true,
      createdAt: Timestamp.now(),
    };

    const webhooksRef = collection(db, 'users', userId, 'webhooks');
    const docRef = await addDoc(webhooksRef, webhook);
    
    return {
      id: docRef.id,
      ...webhook,
      createdAt: webhook.createdAt.toDate()
    };
  } catch (error) {
    console.error("Fehler beim Erstellen des Webhooks:", error);
    throw error;
  }
};

export const deleteWebhook = async (userId: string, webhookId: string): Promise<void> => {
  try {
    const webhookRef = doc(db, 'users', userId, 'webhooks', webhookId);
    await deleteDoc(webhookRef);
  } catch (error) {
    console.error("Fehler beim Löschen des Webhooks:", error);
    throw error;
  }
};

export const updateWebhookStatus = async (userId: string, webhookId: string, isActive: boolean): Promise<void> => {
  try {
    const webhookRef = doc(db, 'users', userId, 'webhooks', webhookId);
    await updateDoc(webhookRef, { isActive });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Webhook-Status:", error);
    throw error;
  }
};

// Connected Apps
export interface ConnectedApp {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected';
  connectedAt?: Date;
}

export const getConnectedApps = async (userId: string): Promise<ConnectedApp[]> => {
  try {
    const appsRef = collection(db, 'users', userId, 'connectedApps');
    const snapshot = await getDocs(appsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      connectedAt: doc.data().connectedAt?.toDate()
    })) as ConnectedApp[];
  } catch (error) {
    console.error("Fehler beim Abrufen der verbundenen Apps:", error);
    throw error;
  }
};

export const connectApp = async (userId: string, appId: string): Promise<void> => {
  try {
    const appRef = doc(db, 'users', userId, 'connectedApps', appId);
    await updateDoc(appRef, {
      status: 'connected',
      connectedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Fehler beim Verbinden der App:", error);
    throw error;
  }
};

export const disconnectApp = async (userId: string, appId: string): Promise<void> => {
  try {
    const appRef = doc(db, 'users', userId, 'connectedApps', appId);
    await updateDoc(appRef, {
      status: 'disconnected',
      connectedAt: null
    });
  } catch (error) {
    console.error("Fehler beim Trennen der App:", error);
    throw error;
  }
}; 
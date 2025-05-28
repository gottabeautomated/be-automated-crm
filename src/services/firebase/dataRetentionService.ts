import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase.config';
import { toast } from 'sonner';

export interface DataRetentionSettings {
  retentionDays: number;
  lastUpdated: Date;
}

/**
 * Speichert die Datenaufbewahrungseinstellungen für einen Benutzer.
 * @param userId Die UID des Benutzers
 * @param retentionDays Die Anzahl der Tage, für die Daten aufbewahrt werden sollen
 */
export const saveDataRetentionSettings = async (userId: string, retentionDays: number): Promise<void> => {
  if (!userId) {
    throw new Error("UserID is required to save data retention settings.");
  }

  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'dataRetention');
    await setDoc(settingsRef, {
      retentionDays,
      lastUpdated: new Date()
    });
    toast.success("Datenaufbewahrungseinstellungen erfolgreich gespeichert.");
  } catch (error) {
    console.error("Error saving data retention settings:", error);
    toast.error("Fehler beim Speichern der Datenaufbewahrungseinstellungen.");
    throw error;
  }
};

/**
 * Ruft die Datenaufbewahrungseinstellungen für einen Benutzer ab.
 * @param userId Die UID des Benutzers
 * @returns Die Datenaufbewahrungseinstellungen oder null, wenn keine gefunden wurden
 */
export const getDataRetentionSettings = async (userId: string): Promise<DataRetentionSettings | null> => {
  if (!userId) {
    throw new Error("UserID is required to get data retention settings.");
  }

  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'dataRetention');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        retentionDays: data.retentionDays,
        lastUpdated: data.lastUpdated.toDate()
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting data retention settings:", error);
    toast.error("Fehler beim Abrufen der Datenaufbewahrungseinstellungen.");
    throw error;
  }
}; 
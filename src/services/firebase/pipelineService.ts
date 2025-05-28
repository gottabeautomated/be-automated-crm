import { db } from './firebase.config';
import { collection, doc, getDocs, writeBatch, orderBy, query, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { PipelineStage } from '@/types/pipelineTypes';

const PIPELINE_STAGES_COLLECTION = 'pipelineStages';

// Hilfsfunktion, um die Konsistenz der Order-Property sicherzustellen
const reorderStages = (stages: PipelineStage[]): PipelineStage[] => {
  return stages.sort((a, b) => a.order - b.order).map((stage, index) => ({ ...stage, order: index }));
};

/**
 * Lädt alle Pipeline-Stages aus Firestore, sortiert nach ihrer Reihenfolge.
 */
export const getPipelineStages = async (): Promise<PipelineStage[]> => {
  try {
    const stagesCollection = collection(db, PIPELINE_STAGES_COLLECTION);
    const q = query(stagesCollection, orderBy('order'));
    const snapshot = await getDocs(q);
    const stages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PipelineStage));
    return stages;
  } catch (error) {
    console.error("Error fetching pipeline stages: ", error);
    throw new Error('Fehler beim Laden der Pipeline-Stages.');
  }
};

/**
 * Speichert eine einzelne Pipeline-Stage in Firestore.
 * Wenn die Stage neu ist, wird sie hinzugefügt. Bestehende Stages werden aktualisiert.
 * Die Order wird hier nicht direkt angepasst, das sollte durch savePipelineStages oder eine Reorder-Funktion geschehen.
 */
export const savePipelineStage = async (stage: PipelineStage): Promise<void> => {
  try {
    console.log("Attempting to save stage:", JSON.stringify(stage, null, 2));
    const stageRef = doc(db, PIPELINE_STAGES_COLLECTION, stage.id);
    await setDoc(stageRef, stage, { merge: true }); // merge: true, um nur gegebene Felder zu aktualisieren
  } catch (error) {
    console.error("Error saving pipeline stage: ", error);
    throw new Error('Fehler beim Speichern der Pipeline-Stage.');
  }
};

/**
 * Löscht eine Pipeline-Stage aus Firestore.
 * Nach dem Löschen müssen die verbleibenden Stages möglicherweise neu geordnet werden (externer Aufruf von savePipelineStages).
 */
export const deletePipelineStage = async (stageId: string): Promise<void> => {
  try {
    const stageRef = doc(db, PIPELINE_STAGES_COLLECTION, stageId);
    await deleteDoc(stageRef);
  } catch (error) {
    console.error("Error deleting pipeline stage: ", error);
    throw new Error('Fehler beim Löschen der Pipeline-Stage.');
  }
};

/**
 * Speichert alle Pipeline-Stages (nützlich für Reordering oder Batch-Updates).
 * Stellt sicher, dass die Order-Property korrekt gesetzt ist.
 */
export const saveAllPipelineStages = async (stages: PipelineStage[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const orderedStages = reorderStages(stages); // Stellt die korrekte Reihenfolge sicher

    orderedStages.forEach(stage => {
      const stageRef = doc(db, PIPELINE_STAGES_COLLECTION, stage.id);
      batch.set(stageRef, stage);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error saving all pipeline stages: ", error);
    throw new Error('Fehler beim Speichern aller Pipeline-Stages.');
  }
};

/**
 * Aktualisiert die Reihenfolge der Pipeline-Stages in Firestore.
 * Nimmt eine Liste von Stage-IDs in der neuen Reihenfolge entgegen.
 */
export const updatePipelineStagesOrder = async (stageIdsInNewOrder: string[]): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const stagesCollection = collection(db, PIPELINE_STAGES_COLLECTION);
      const currentStagesSnapshot = await getDocs(query(stagesCollection)); // Ungeordnete Docs holen
      const currentStages: PipelineStage[] = currentStagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PipelineStage));

      const updatedStages: PipelineStage[] = [];
      const stageMap = new Map(currentStages.map(s => [s.id, s]));

      // Erstelle die neue, geordnete Liste
      stageIdsInNewOrder.forEach((id, index) => {
        const stage = stageMap.get(id);
        if (stage) {
          updatedStages.push({ ...stage, order: index });
        } else {
          // Dies sollte nicht passieren, wenn die IDs korrekt sind
          console.warn(`Stage mit ID ${id} nicht gefunden während der Neuordnung.`);
        }
      });
      
      // Füge alle Stages hinzu, die nicht in stageIdsInNewOrder waren (sollte auch nicht vorkommen bei korrekter Verwendung)
      currentStages.forEach(stage => {
        if (!stageIdsInNewOrder.includes(stage.id)) {
          // Setze diese an das Ende oder behandle sie als Fehler
          updatedStages.push({ ...stage, order: updatedStages.length });
          console.warn(`Stage ${stage.id} war nicht in der neuen Reihenfolge und wurde ans Ende gesetzt.`);
        }
      });


      // Schreibe die Änderungen in der Transaktion
      updatedStages.forEach(stage => {
        const stageRef = doc(db, PIPELINE_STAGES_COLLECTION, stage.id);
        transaction.set(stageRef, stage);
      });
    });
  } catch (error) {
    console.error("Error updating pipeline stages order: ", error);
    throw new Error('Fehler beim Aktualisieren der Pipeline-Stage-Reihenfolge.');
  }
};

// Beispiel für das initiale Setup von Stages, falls die Collection leer ist.
// Dies sollte nur einmal ausgeführt werden oder über ein Admin-Interface.
export const initializeDefaultPipelineStages = async () => {
    const initialStages: PipelineStage[] = [
        { id: 'lead', name: 'Lead', probability: 10, color: '#3B82F6', order: 0 },
        { id: 'contacted', name: 'Kontaktiert', probability: 25, color: '#F59E0B', order: 1 },
        { id: 'demo-planned', name: 'Demo geplant', probability: 50, color: '#10B981', order: 2 }, // ID geändert, um gültig zu sein
        { id: 'proposal-sent', name: 'Angebot erstellt', probability: 75, color: '#8B5CF6', order: 3 }, // ID geändert
        { id: 'won', name: 'Gewonnen', probability: 100, color: '#14B8A6', order: 4 },
        { id: 'lost', name: 'Verloren', probability: 0, color: '#EF4444', order: 5 },
    ];

    try {
        const stagesSnapshot = await getDocs(collection(db, PIPELINE_STAGES_COLLECTION));
        if (stagesSnapshot.empty) {
            console.log("Initializing default pipeline stages...");
            await saveAllPipelineStages(initialStages); // Nutze die Batch-Funktion
            console.log("Default pipeline stages initialized.");
        } else {
            console.log("Pipeline stages already exist. Skipping initialization.");
        }
    } catch (error) {
        console.error("Error initializing default pipeline stages: ", error);
        // Hier könnte man spezifischer auf den Fehler reagieren
    }
}; 
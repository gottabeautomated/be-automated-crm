import {
  Timestamp,
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  getDocs,
  FirestoreError,
  QueryConstraint,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.config';
import {
  AssessmentResult,
  AssessmentResultFormData,
  AssessmentToolName,
  SendEmailData,
  ASSESSMENT_TOOL_DETAILS
} from '@/types/assessmentTypes';
import { ContactFormData, FirestoreContact } from '@/types/contactTypes';
import { findContactByEmailService, createContact } from './contactService';
import { addActivityService } from './activityService'; // For auto-creating activity
import { ActivityFormData, ACTIVITY_TYPES } from '@/types/activityTypes';

const getAssessmentsCollectionRef = (userId: string) => {
  if (!userId) throw new Error('User ID cannot be empty when getting assessments collection ref.');
  return collection(db, `users/${userId}/assessments`);
};

/**
 * Adds a new assessment result to Firestore for a specific user.
 * Also handles contact linking/creation and activity creation.
 */
export const addAssessmentResultService = async (
  userId: string,
  formData: AssessmentResultFormData
): Promise<string> => {
  console.log('addAssessmentResultService called with:', userId, formData);
  let contactId: string | undefined;
  let contactName: string = 'Unbekannter Kontakt';

  // 1. Finde oder erstelle den Kontakt basierend auf der E-Mail
  try {
    const existingContact = await findContactByEmailService(userId, formData.contactEmail);
    if (existingContact) {
      contactId = existingContact.id;
      contactName = existingContact.name || formData.contactEmail;
      console.log('Existing contact found:', contactId, contactName);
    } else {
      console.log('No existing contact found, creating new one for:', formData.contactEmail);
      const newContactData: ContactFormData = {
        name: formData.contactEmail, 
        email: formData.contactEmail,
        company: '',
        // Default-Werte für neue Kontakte aus Assessment
        leadSource: 'Other', // 'ASSESSMENT' ist kein gültiger Wert für LeadSourceType, daher 'Other'
        status: 'Lead',    // 'LEAD' ist kein gültiger Wert für ContactStatusType, daher 'Lead'
        // Initialisiere andere erforderliche Felder von ContactFormData
        phone: '',
        lastContact: new Date().toISOString().split('T')[0],
        dealStage: 'Initial Contact',
        dealValue: '0',
        priority: 'medium',
        tags: 'assessment-lead',
        notes: `Lead generiert durch ${formData.toolName} Assessment.`,
      };
      contactId = await createContact(userId, newContactData);
      contactName = newContactData.name;
      console.log('New contact created:', contactId, contactName);
    }
  } catch (error) {
    console.error('Error finding or creating contact:', error);
    throw new Error('Fehler beim Verarbeiten der Kontaktinformationen.');
  }

  if (!contactId) {
    throw new Error('Kontakt-ID konnte nicht ermittelt werden.');
  }

  // 2. Erstelle das Assessment-Ergebnis
  const assessmentTimestamp = Timestamp.fromDate(formData.assessmentDate || new Date());
  const newAssessmentResult: Omit<AssessmentResult, 'id'> = {
    userId,
    contactId,
    type: formData.toolName,
    score: formData.score,
    recommendations: formData.recommendations.split('\\n').map((rec, index) => ({ id: String(index), text: rec.trim() })).filter(r => r.text),
    completedAt: assessmentTimestamp,
    // reportUrl: null, // oder leerer String, je nach Definition
  };
  console.log('New assessment result to be added:', newAssessmentResult);

  const assessmentRef = collection(db, 'users', userId, 'assessments');
  const docRef = await addDoc(assessmentRef, newAssessmentResult);
  console.log('Assessment result added with ID:', docRef.id);

  // 3. Erstelle eine Aktivität für dieses Assessment
  try {
    const toolDetails = ASSESSMENT_TOOL_DETAILS[formData.toolName];
    const activityData: ActivityFormData = {
      type: ACTIVITY_TYPES.ASSESSMENT,
      title: `Assessment "${toolDetails.name}" durchgeführt`,
      contactId: contactId,
      notes: `Score: ${formData.score}. Empfehlungen: ${formData.recommendations.substring(0,100)}...`,
      activityDate: (formData.assessmentDate || new Date()).toISOString().split('T')[0],
      isCompleted: true, 
    };
    await addActivityService(userId, activityData);
    console.log('Activity created for assessment:', docRef.id);
  } catch (error) {
    console.error('Error creating activity for assessment:', error);
  }

  return docRef.id;
};

/**
 * Subscribes to real-time updates for assessment results for a specific user.
 */
export const subscribeToAssessmentResultsForUser = (
  userId: string,
  // filters: any, // Define filters interface later
  callback: (results: AssessmentResult[]) => void,
  onError: (error: FirestoreError) => void
): (() => void) => {
  try {
    const collectionRef = getAssessmentsCollectionRef(userId);
    const q = query(collectionRef, orderBy('completedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const results = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<AssessmentResult, 'id'>),
      }));
      callback(results);
    }, (error) => {
      console.error("Error subscribing to assessment results: ", error);
      onError(error);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up assessment results subscription: ", error);
    onError(error as FirestoreError);
    return () => {};
  }
};

/**
 * Subscribes to real-time updates for assessment results for a specific contact.
 */
export const subscribeToAssessmentResultsForContact = (
  userId: string,
  contactId: string,
  callback: (results: AssessmentResult[]) => void,
  onError: (error: FirestoreError) => void
): (() => void) => {
  if (!contactId) return () => {}; // No contactId, no subscription
  try {
    const collectionRef = getAssessmentsCollectionRef(userId);
    const q = query(
      collectionRef, 
      where('contactId', '==', contactId),
      orderBy('completedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const results = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<AssessmentResult, 'id'>),
      }));
      callback(results);
    }, (error) => {
      console.error(`Error subscribing to assessment results for contact ${contactId}: `, error);
      onError(error);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up contact assessment results subscription: ", error);
    onError(error as FirestoreError);
    return () => {};
  }
};

// NEUE FUNKTION
export const sendAssessmentResultEmailService = async (
  emailData: SendEmailData
): Promise<{ success: boolean; message: string }> => {
  console.log('Attempting to send assessment email with data:', emailData);
  // TODO: Hier wird später der Aufruf der Firebase Function implementiert
  // z.B. const functions = getFunctions(app);
  // const sendEmailCallable = httpsCallable(functions, 'sendAssessmentEmail');
  // await sendEmailCallable(emailData);

  // Simulierter Aufruf
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(
        'Email simulation: Email to',
        emailData.to,
        'with subject \'',
        emailData.subject,
        '\' sent successfully for assessmentId:',
        emailData.assessmentId
      );
      resolve({
        success: true,
        message: 'E-Mail wurde (simuliert) erfolgreich versendet.',
      });
    }, 1000);
  });
}; 
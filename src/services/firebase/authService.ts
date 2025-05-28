import { 
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser, // Alias um Kollision mit unserem User-Typ zu vermeiden
  EmailAuthProvider, // Hinzufügen für Re-Authentifizierung
  reauthenticateWithCredential, // Hinzufügen für Re-Authentifizierung
  updatePassword // Hinzufügen für Passwortaktualisierung
} from 'firebase/auth';
import { auth } from './firebase.config'; // Annahme: auth-Instanz wird hier exportiert

// Ggf. Interface für Benutzerdaten, die wir von der Registrierung erwarten
export interface RegistrationData {
  displayName?: string; // Optional, falls direkt bei Registrierung gesetzt
  email: string;
  password_1: string;
  // Weitere Felder nach Bedarf
}

// Ggf. Interface für Login-Daten
export interface LoginData {
  email: string;
  password_1: string;
}

/**
 * Registriert einen neuen Benutzer mit E-Mail und Passwort.
 * Aktualisiert optional den Anzeigenamen.
 */
export const registerUser = async (data: RegistrationData): Promise<FirebaseUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password_1);
    if (data.displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: data.displayName });
    }
    // FirebaseUser direkt zurückgeben, da dies der Typ von userCredential.user ist
    return userCredential.user;
  } catch (error: any) {
    // Hier könnten wir spezifischere Fehlerbehandlung basierend auf error.code machen
    console.error("Error during registration: ", error);
    throw new Error(error.message || "Fehler bei der Registrierung.");
  }
};

/**
 * Meldet einen Benutzer mit E-Mail und Passwort an.
 */
export const loginUser = async (data: LoginData): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password_1);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error during login: ", error);
    throw new Error(error.message || "Fehler bei der Anmeldung.");
  }
};

/**
 * Meldet den aktuellen Benutzer ab.
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Error during logout: ", error);
    throw new Error(error.message || "Fehler beim Abmelden.");
  }
};

/**
 * Abonniert Änderungen des Authentifizierungsstatus.
 * @param callback Funktion, die mit dem FirebaseUser (oder null) aufgerufen wird.
 * @returns Unsubscribe-Funktion.
 */
export const onAuthStatusChanged = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Aktualisiert das Profil des aktuell angemeldeten Benutzers.
 * @param data Ein Objekt mit den zu aktualisierenden Profildaten (z.B. { displayName: 'Neuer Name' })
 */
export const updateUserProfile = async (data: { displayName?: string; photoURL?: string; phoneNumber?: string }) => {
  if (!auth.currentUser) {
    throw new Error("Kein Benutzer angemeldet, um das Profil zu aktualisieren.");
  }
  try {
    await updateProfile(auth.currentUser, data);
    // Wichtig: Firebase Auth aktualisiert phoneNumber nicht direkt über updateProfile.
    // Dies erfordert einen komplexeren Flow mit Verifizierung, der hier nicht abgebildet wird.
    // Wenn `data.phoneNumber` vorhanden ist, müsste hier die separate Logik implementiert werden.
    // Für dieses Beispiel konzentrieren wir uns auf displayName und photoURL via updateProfile.
    // Das `phoneNumber` im `updates`-Objekt in `ProfileSettingsTab` ist daher aktuell ohne direkte Firebase Auth Funktion hier.
  } catch (error: any) {
    console.error("Error updating profile: ", error);
    throw new Error(error.message || "Fehler beim Aktualisieren des Profils.");
  }
};

/**
 * Re-authentifiziert den aktuellen Benutzer mit seinem Passwort.
 */
export const reauthenticateCurrentUser = async (currentPassword_1: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error("Kein Benutzer angemeldet für Re-Authentifizierung.");
  }
  const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword_1);
  try {
    await reauthenticateWithCredential(auth.currentUser, credential);
  } catch (error: any) {
    console.error("Error during re-authentication: ", error);
    // Spezifische Fehlerbehandlung kann hier erfolgen (z.B. error.code === 'auth/wrong-password')
    throw error; // Fehler weiterwerfen, damit die aufrufende Funktion ihn behandeln kann
  }
};

/**
 * Ändert das Passwort des aktuell angemeldeten Benutzers.
 * Wichtig: Der Benutzer sollte kürzlich re-authentifiziert worden sein.
 */
export const changeCurrentUserPassword = async (newPassword_1: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error("Kein Benutzer angemeldet, um das Passwort zu ändern.");
  }
  try {
    await updatePassword(auth.currentUser, newPassword_1);
  } catch (error: any) {
    console.error("Error changing password: ", error);
    throw error; // Fehler weiterwerfen
  }
}; 
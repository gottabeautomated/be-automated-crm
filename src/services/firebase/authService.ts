import { 
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser // Alias um Kollision mit unserem User-Typ zu vermeiden
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
export const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
  if (!auth.currentUser) {
    throw new Error("Kein Benutzer angemeldet, um das Profil zu aktualisieren.");
  }
  try {
    await updateProfile(auth.currentUser, data);
  } catch (error: any) {
    console.error("Error updating profile: ", error);
    throw new Error(error.message || "Fehler beim Aktualisieren des Profils.");
  }
}; 
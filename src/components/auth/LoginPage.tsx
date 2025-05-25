import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Firebase auth imports werden durch den authService ersetzt
// import { auth } from '@/services/firebase/firebase.config'; 
// import { 
//   signInWithEmailAndPassword, 
//   createUserWithEmailAndPassword,
//   updateProfile
// } from 'firebase/auth';
import { loginUser, registerUser, LoginData, RegistrationData } from '@/services/firebase/authService'; // Import der neuen Service-Funktionen
import { Mail, Lock, LogIn, UserPlus, Briefcase } from 'lucide-react'; // Added icons

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // For registration
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('E-Mail und Passwort dürfen nicht leer sein.');
      setLoading(false);
      return;
    }

    if (isRegisterMode && !displayName) {
      setError('Anzeigename darf nicht leer sein.');
      setLoading(false);
      return;
    }

    try {
      if (isRegisterMode) {
        const registrationData: RegistrationData = { email, password_1: password, displayName };
        const user = await registerUser(registrationData);
        console.log('User registered and display name set:', user);
        navigate('/dashboard'); // Navigate to dashboard after registration
      } else {
        const loginData: LoginData = { email, password_1: password };
        const user = await loginUser(loginData);
        console.log('User logged in:', user);
        navigate('/dashboard'); // Navigate to dashboard after login
      }
    } catch (err: any) {
      console.error('Authentication error from service:', err);
      // Fehlerbehandlung bleibt ähnlich, aber jetzt kommen Fehler vom authService
      // Die spezifischen Firebase error.codes sind in err.message (oder einem benutzerdefinierten Error-Objekt vom Service)
      // Für dieses Beispiel nehmen wir an, dass der Service eine generische Fehlermeldung in err.message bereitstellt.
      // Eine robustere Lösung würde spezifische Fehlercodes vom Service zurückgeben oder die Firebase-Fehlercodes direkt durchleiten.
      if (err.message.includes('auth/email-already-in-use')) {
        setError('Diese E-Mail-Adresse wird bereits verwendet.');
      } else if (err.message.includes('auth/invalid-email')) {
        setError('Ungültiges E-Mail-Format.');
      } else if (err.message.includes('auth/weak-password')) {
        setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      } else if (err.message.includes('auth/user-not-found') || err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-credential')) {
        setError('Ungültige E-Mail oder Passwort.');
      } else {
        setError(err.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-blue via-blue-600 to-indigo-700 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-1 text-center text-gray-800">
          {isRegisterMode ? 'Konto erstellen' : 'Willkommen zurück!'}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {isRegisterMode ? 'Starten Sie durch mit Ihrem neuen CRM.' : 'Melden Sie sich an, um fortzufahren.'}
        </p>

        <form onSubmit={handleAuthAction} className="space-y-6">
          {isRegisterMode && (
            <div className="relative">
              <UserPlus className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Anzeigename"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-shadow duration-200 text-sm"
                disabled={loading}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-shadow duration-200 text-sm"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-shadow duration-200 text-sm"
              disabled={loading}
            />
          </div>

          {error && <p className="text-error-red text-sm text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-primary-blue text-white py-3 px-4 rounded-lg hover:bg-primary-blue-dark focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 transition-all duration-200 ease-in-out flex items-center justify-center space-x-2 font-medium disabled:opacity-70"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : isRegisterMode ? (
              <UserPlus className="w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            <span>{loading ? 'Wird verarbeitet...' : (isRegisterMode ? 'Registrieren' : 'Anmelden')}</span>
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          {isRegisterMode ? 'Bereits ein Konto?' : 'Noch kein Konto?'}
          <button 
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null); // Clear error on mode switch
            }}
            className="font-medium text-primary-blue hover:text-primary-blue-dark hover:underline ml-1"
            disabled={loading}
          >
            {isRegisterMode ? 'Hier anmelden' : 'Hier registrieren'}
          </button>
        </p>
      </div>
       <footer className="mt-8 text-center">
        <p className="text-sm text-blue-200">Powered by BE_AUTOMATED</p>
      </footer>
    </div>
  );
};

export default LoginPage; 
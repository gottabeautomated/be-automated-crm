import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Für den 2FA Toggle
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/services/firebase/AuthProvider';
import { updateUserProfile, reauthenticateCurrentUser, changeCurrentUserPassword } from '@/services/firebase/authService'; // Aktualisierte authService Funktionen
import { storage } from '@/services/firebase/firebase.config'; // Korrigierter Pfad
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'sonner';

const ProfileSettingsTab: React.FC = () => {
  const { user, loading } = useAuth();

  // States für Formulardaten
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(''); // Bleibt vorerst nur zur Anzeige
  const [phone, setPhone] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); // Für Re-Authentifizierung
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);

  // Ladezustände
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [showReauthPasswordInput, setShowReauthPasswordInput] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhone(user.phoneNumber || '');
      setProfilePictureUrl(user.photoURL || '');
      // TODO: 2FA Status laden, falls im User Objekt gespeichert oder über einen Service abrufbar
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const updates: { displayName?: string; phoneNumber?: string } = {};
      if (displayName !== user.displayName) updates.displayName = displayName;
      // Firebase Auth phoneNumber Aktualisierung ist komplexer und wird hier nicht direkt implementiert.
      // Die updateUserProfile in authService nimmt phoneNumber entgegen, führt aber keine Firebase-Aktion dafür aus.
      // Wir könnten hier user.updatePhoneNumber() mit Verifizierung verwenden, ist aber umfangreich.
      // Vorerst wird der State phone nicht an updateUserProfile übergeben, um Fehler zu vermeiden.
      // if (phone !== user.phoneNumber) updates.phoneNumber = phone; 

      if (updates.displayName && updates.displayName !== user.displayName) {
        await updateUserProfile({ displayName: updates.displayName });
        toast.success('Anzeigename erfolgreich aktualisiert!');
      } else {
        toast.info('Keine Änderungen am Anzeigenamen zum Speichern vorhanden.');
      }
      // Für Telefonnummer-Änderungen: separate Logik erforderlich (nicht in diesem Schritt)
      if (phone !== user.phoneNumber) {
        toast.info("Telefonnummern-Aktualisierung ist noch nicht implementiert.")
      }

    } catch (error: any) {
      console.error("Error updating profile: ", error);
      toast.error(error.message || 'Fehler beim Aktualisieren des Profils.');
    }
    setIsSavingProfile(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast.error('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    if (!newPassword) {
      toast.error('Das neue Passwort darf nicht leer sein.');
      return;
    }
    if (!currentPassword && !showReauthPasswordInput) {
      setShowReauthPasswordInput(true);
      toast.info('Bitte geben Sie Ihr aktuelles Passwort ein, um fortzufahren.');
      return;
    }
    if (!currentPassword && showReauthPasswordInput) {
      toast.error('Bitte geben Sie Ihr aktuelles Passwort ein.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await reauthenticateCurrentUser(currentPassword);
      await changeCurrentUserPassword(newPassword);
      toast.success('Passwort erfolgreich geändert!');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setShowReauthPasswordInput(false);
    } catch (error: any) {
      console.error("Error changing password: ", error);
      if (error.code === 'auth/wrong-password' || error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
        toast.error('Das aktuelle Passwort ist nicht korrekt.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Zu viele Versuche. Bitte versuchen Sie es später erneut.');
      } else {
        toast.error(error.message || 'Fehler beim Ändern des Passworts.');
      }
    }
    setIsChangingPassword(false);
  };

  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingPicture(true);
    const pictureRef = ref(storage, `profile_pictures/${user.uid}/${file.name}`);
    try {
      await uploadBytes(pictureRef, file);
      const url = await getDownloadURL(pictureRef);
      await updateUserProfile({ photoURL: url }); 
      // Der AuthProvider sollte das user Objekt global aktualisieren, was den useEffect oben triggert.
      // setProfilePictureUrl(url); // Nicht mehr nötig, da useEffect das macht
      toast.success('Profilbild erfolgreich hochgeladen und aktualisiert!');
    } catch (error: any) {
      console.error("Error uploading profile picture: ", error);
      toast.error(error.message || 'Fehler beim Hochladen des Profilbilds.');
    }
    setIsUploadingPicture(false);
  };
  
  const handleTwoFactorToggle = (checked: boolean) => {
    setIsTwoFactorEnabled(checked);
    toast.info('2FA-Umschaltung wird später implementiert...');
    // TODO: API Call zum Aktivieren/Deaktivieren von 2FA und User-Objekt entsprechend aktualisieren
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Benutzerdaten werden geladen...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Einstellungen</CardTitle>
        <CardDescription>Verwalten Sie Ihre Profilinformationen, Ihr Passwort und Sicherheitseinstellungen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Profilbild Sektion */}
        <div className="flex items-center space-x-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profilePictureUrl || undefined} alt={displayName || user?.email || 'User'} />
            <AvatarFallback>{displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'P'}</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" asChild>
              <Label htmlFor="profilePictureInput" className="cursor-pointer">
                  Profilbild ändern
              </Label>
            </Button>
            <Input 
                id="profilePictureInput" 
                type="file" 
                accept="image/*" 
                onChange={handlePictureUpload} 
                className="hidden" 
                disabled={isUploadingPicture}
            />
            {isUploadingPicture && <p className='text-sm text-muted-foreground mt-1'>Lade Bild hoch...</p>}
            <p className="text-xs text-muted-foreground mt-2">Empfohlen: JPG, PNG, GIF (max. 2MB)</p>
          </div>
        </div>

        {/* Persönliche Informationen Formular */}
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">Anzeigename</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ihr Anzeigename" />
            </div>
            <div>
              <Label htmlFor="email">E-Mail Adresse (nur Anzeige)</Label>
              <Input id="email" type="email" value={email} readOnly placeholder="ihre.email@example.com" className="bg-muted/50"/>
              <p className="text-xs text-muted-foreground mt-1">E-Mail-Änderungen erfordern eine separate Verifizierung.</p>
            </div>
            <div>
              <Label htmlFor="phone">Telefonnummer (optional, noch nicht speicherbar)</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 123 456789" />
            </div>
          </div>
          <Button type="submit" disabled={isSavingProfile || isUploadingPicture}>
            {isSavingProfile ? 'Speichert...' : 'Profil speichern'}
          </Button>
        </form>

        <hr />

        {/* Passwort ändern Formular */}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <CardTitle className="text-lg">Passwort ändern</CardTitle>
          {showReauthPasswordInput && (
            <div>
              <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Ihr aktuelles Passwort" autoComplete="current-password" />
            </div>
          )}
          <div>
            <Label htmlFor="newPassword">Neues Passwort</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mind. 6 Zeichen" autoComplete="new-password" />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Neues Passwort wiederholen" autoComplete="new-password" />
          </div>
          <Button type="submit" variant="outline" disabled={isChangingPassword || isUploadingPicture}>
            {isChangingPassword ? 'Ändert...' : 'Passwort ändern'}
          </Button>
        </form>

        <hr />

        {/* Zwei-Faktor-Authentifizierung */}
        <div>
          <CardTitle className="text-lg mb-2">Zwei-Faktor-Authentifizierung (2FA)</CardTitle>
          <div className="flex items-center space-x-3">
            <Switch 
              id="twoFactorAuth" 
              checked={isTwoFactorEnabled} 
              onCheckedChange={handleTwoFactorToggle} 
              disabled // Deaktiviert, bis die Funktionalität implementiert ist
            />
            <Label htmlFor="twoFactorAuth" className={`mb-0 ${isTwoFactorEnabled ? '' : 'text-muted-foreground'}`}>
              {isTwoFactorEnabled ? '2FA ist aktiviert' : '2FA ist deaktiviert (bald verfügbar)'}
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Schützen Sie Ihr Konto zusätzlich mit einer zweiten Authentifizierungsebene.
          </p>
        </div>

      </CardContent>
    </Card>
  );
};

export default ProfileSettingsTab; 
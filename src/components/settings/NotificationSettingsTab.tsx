import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

interface EmailNotificationToggleProps {
  id: string;
  label: string;
  description: string;
  initialChecked?: boolean;
  onCheckedChange: (id: string, checked: boolean) => void;
}

const EmailNotificationToggle: React.FC<EmailNotificationToggleProps> = (
  { id, label, description, initialChecked = false, onCheckedChange }
) => {
  const [isChecked, setIsChecked] = useState(initialChecked);

  const handleToggle = (checked: boolean) => {
    setIsChecked(checked);
    onCheckedChange(id, checked);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
      <div>
        <Label htmlFor={id} className="font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={isChecked} onCheckedChange={handleToggle} />
    </div>
  );
};

const NotificationSettingsTab: React.FC = () => {
  // Beispiel-State für E-Mail-Benachrichtigungen
  const [emailNotifications, setEmailNotifications] = useState<Record<string, boolean>>({
    newLead: true,
    taskReminder: true,
    weeklySummary: false,
    dealWon: true,
    dealLost: false,
  });

  // Beispiel-State für Browser-Benachrichtigungen
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);
  // Beispiel-State für Benachrichtigungshäufigkeit
  const [notificationFrequency, setNotificationFrequency] = useState('immediately');

  const handleEmailNotificationChange = (id: string, checked: boolean) => {
    setEmailNotifications(prev => ({ ...prev, [id]: checked }));
    // TODO: API-Aufruf zum Speichern der Einstellung
    toast.info(`E-Mail-Benachrichtigung '${id}' ${checked ? 'aktiviert' : 'deaktiviert'}. (Speichern noch nicht implementiert)`);
  };

  const handleBrowserNotificationToggle = (checked: boolean) => {
    setBrowserNotificationsEnabled(checked);
    if (checked) {
      // Logik zur Anforderung von Browser-Benachrichtigungsberechtigungen, falls noch nicht erteilt
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast.success('Browser-Benachrichtigungen aktiviert!');
            // TODO: API-Aufruf zum Speichern der Einstellung
          } else {
            toast.warning('Browser-Benachrichtigungen wurden nicht zugelassen.');
            setBrowserNotificationsEnabled(false); // Zurücksetzen, wenn nicht erlaubt
          }
        });
      } else if (Notification.permission === 'granted') {
        toast.info('Browser-Benachrichtigungen sind bereits aktiviert.');
         // TODO: API-Aufruf zum Speichern der Einstellung
      } else {
        toast.error('Ihr Browser unterstützt keine Benachrichtigungen.');
        setBrowserNotificationsEnabled(false); // Zurücksetzen, wenn nicht unterstützt
      }
    } else {
      toast.info('Browser-Benachrichtigungen deaktiviert. (Speichern noch nicht implementiert)');
      // TODO: API-Aufruf zum Speichern der Einstellung
    }
  };

  const handleFrequencyChange = (value: string) => {
    setNotificationFrequency(value);
    // TODO: API-Aufruf zum Speichern der Einstellung
    toast.info(`Benachrichtigungshäufigkeit auf '${value}' gesetzt. (Speichern noch nicht implementiert)`);
  };
  
  const handleSaveNotificationSettings = () => {
    // TODO: Sammel-API-Aufruf zum Speichern aller Benachrichtigungseinstellungen
    toast.success('Benachrichtigungseinstellungen gespeichert! (Dummy)');
    console.log("Email Notifications:", emailNotifications);
    console.log("Browser Notifications Enabled:", browserNotificationsEnabled);
    console.log("Notification Frequency:", notificationFrequency);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benachrichtigungen</CardTitle>
        <CardDescription>
          Konfigurieren Sie, wie und wann Sie über wichtige Ereignisse im CRM informiert werden möchten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* E-Mail Benachrichtigungen */}
        <section>
          <h3 className="text-lg font-semibold mb-4">E-Mail Benachrichtigungen</h3>
          <div className="space-y-4">
            <EmailNotificationToggle
              id="newLead"
              label="Neuer Lead zugewiesen"
              description="Erhalten Sie eine E-Mail, wenn Ihnen ein neuer Lead zugewiesen wird."
              initialChecked={emailNotifications.newLead}
              onCheckedChange={handleEmailNotificationChange}
            />
            <EmailNotificationToggle
              id="taskReminder"
              label="Aufgaben-Erinnerungen"
              description="Erhalten Sie Erinnerungen für fällige Aufgaben."
              initialChecked={emailNotifications.taskReminder}
              onCheckedChange={handleEmailNotificationChange}
            />
            <EmailNotificationToggle
              id="dealWon"
              label="Deal gewonnen"
              description="Benachrichtigung, wenn ein Deal als 'gewonnen' markiert wird."
              initialChecked={emailNotifications.dealWon}
              onCheckedChange={handleEmailNotificationChange}
            />
            <EmailNotificationToggle
              id="dealLost"
              label="Deal verloren"
              description="Benachrichtigung, wenn ein Deal als 'verloren' markiert wird."
              initialChecked={emailNotifications.dealLost}
              onCheckedChange={handleEmailNotificationChange}
            />
            <EmailNotificationToggle
              id="weeklySummary"
              label="Wöchentliche Zusammenfassung"
              description="Erhalten Sie eine wöchentliche Übersicht Ihrer Aktivitäten und Erfolge."
              initialChecked={emailNotifications.weeklySummary}
              onCheckedChange={handleEmailNotificationChange}
            />
          </div>
        </section>

        <hr />

        {/* Browser Benachrichtigungen */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Browser Benachrichtigungen</h3>
          <div className="flex items-center space-x-3 mb-2">
            <Switch 
              id="browserNotifications"
              checked={browserNotificationsEnabled}
              onCheckedChange={handleBrowserNotificationToggle}
            />
            <Label htmlFor="browserNotifications" className="mb-0">
              Desktop-Benachrichtigungen aktivieren
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Erhalten Sie sofortige Benachrichtigungen direkt in Ihrem Browser. Sie müssen ggf. die Berechtigung in Ihrem Browser erteilen.
          </p>
        </section>

        <hr />

        {/* Benachrichtigungshäufigkeit */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Benachrichtigungshäufigkeit (gebündelt)</h3>
          <div>
            <Label htmlFor="notificationFrequency">Wie oft möchten Sie gebündelte Updates erhalten?</Label>
            <Select value={notificationFrequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger id="notificationFrequency" className="mt-1 w-full md:w-1/2 lg:w-1/3">
                <SelectValue placeholder="Häufigkeit auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediately">Sofort (für kritische Alerts)</SelectItem>
                <SelectItem value="hourly">Stündlich</SelectItem>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="never">Nie (nur In-App)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Dies betrifft weniger kritische Benachrichtigungen, die zusammengefasst werden können.
            </p>
          </div>
        </section>
        
        <div className="pt-6 text-right">
            <Button onClick={handleSaveNotificationSettings}>Benachrichtigungseinstellungen speichern</Button>
        </div>

      </CardContent>
    </Card>
  );
};

export default NotificationSettingsTab; 
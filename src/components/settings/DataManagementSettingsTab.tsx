import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Settings2, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAllContactsForExport } from '@/services/firebase/contactService';
import { getAllDealsForExport } from '@/services/firebase/dealService';
import { saveDataRetentionSettings, getDataRetentionSettings } from '@/services/firebase/dataRetentionService';
import { FirestoreContact } from '@/types/contactTypes';
import { FirestoreDeal } from '@/services/firebase/dealService';
import { useAuth } from '@/services/firebase/AuthProvider';

// Funktion zum Konvertieren von Array von Objekten in CSV
const convertToCSV = <T extends Record<string, any>>(data: T[], headers: string[]) => {
  const headerRow = headers.join(',');
  const arrayData = Array.isArray(data) ? data : [data];
  const csvRows = arrayData.map(row => {
    return headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      if (typeof cell === 'string') {
        cell = cell.includes(',') ? `"${cell}"` : cell;
      }
      return cell;
    }).join(',');
  });
  return [headerRow, ...csvRows].join('\r\n');
};

const DataManagementSettingsTab: React.FC = () => {
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const [isExportingContacts, setIsExportingContacts] = useState(false);
  const [isExportingDeals, setIsExportingDeals] = useState(false);
  const [dataRetentionDays, setDataRetentionDays] = useState<number>(365);
  const [isSavingRetention, setIsSavingRetention] = useState(false);

  const { user, loading: authIsLoading } = useAuth();

  useEffect(() => {
    const loadDataRetentionSettings = async () => {
      if (!user?.uid) return;
      
      try {
        const settings = await getDataRetentionSettings(user.uid);
        if (settings) {
          setDataRetentionDays(settings.retentionDays);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Datenaufbewahrungseinstellungen:", error);
      }
    };

    loadDataRetentionSettings();
  }, [user?.uid]);

  const handleContactsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setContactsFile(event.target.files[0]);
    } else {
      setContactsFile(null);
    }
  };

  const handleImportContacts = async () => {
    if (!contactsFile) {
      toast.error("Bitte wählen Sie zuerst eine CSV-Datei aus.");
      return;
    }
    setIsImportingContacts(true);
    toast.info(`Importiere Kontakte aus ${contactsFile.name}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Kontakte aus ${contactsFile.name} erfolgreich importiert! (Dummy)`);
    setIsImportingContacts(false);
    setContactsFile(null);
    const fileInput = document.getElementById('contacts-csv-import') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSaveDataRetention = async () => {
    if (!user?.uid) {
      toast.error("Benutzer nicht angemeldet. Einstellungen können nicht gespeichert werden.");
      return;
    }

    setIsSavingRetention(true);
    try {
      await saveDataRetentionSettings(user.uid, dataRetentionDays);
      toast.success(`Datenaufbewahrungsrichtlinie auf ${dataRetentionDays} Tage gesetzt.`);
    } catch (error) {
      console.error("Fehler beim Speichern der Datenaufbewahrungseinstellungen:", error);
      toast.error("Fehler beim Speichern der Datenaufbewahrungseinstellungen.");
    } finally {
      setIsSavingRetention(false);
    }
  };

  const exportContactsToCSV = async () => {
    if (authIsLoading) {
      toast.info("Authentifizierung wird geladen...");
      return;
    }
    if (!user?.uid) {
      toast.error("Benutzer nicht angemeldet oder Benutzer-ID fehlt. Export nicht möglich.");
      return;
    }
    setIsExportingContacts(true);
    toast.info("Exportiere Kontakte als CSV...");
    try {
      const contacts = await getAllContactsForExport(user.uid);
      if (contacts.length === 0) {
        toast.info("Keine Kontakte zum Exportieren vorhanden.");
        return;
      }

      const headers = ['id', 'name', 'email', 'phone', 'company', 'dealValue', 'status', 'tags', 'lastContact', 'createdAt', 'updatedAt'];
      const csvData = convertToCSV(contacts, headers);

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "contacts.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Kontakte erfolgreich als CSV exportiert!");
      } else {
        toast.error("CSV-Export wird von Ihrem Browser nicht unterstützt.");
      }
    } catch (error) {
      console.error("Fehler beim Exportieren der Kontakte: ", error);
      toast.error("Fehler beim Exportieren der Kontakte.");
    } finally {
      setIsExportingContacts(false);
    }
  };

  const exportDealsToCSV = async () => {
    if (authIsLoading) {
      toast.info("Authentifizierung wird geladen...");
      return;
    }
    if (!user?.uid) {
      toast.error("Benutzer nicht angemeldet oder Benutzer-ID fehlt. Export nicht möglich.");
      return;
    }
    setIsExportingDeals(true);
    toast.info("Exportiere Deals als CSV...");
    try {
      const deals = await getAllDealsForExport(user.uid);
      if (deals.length === 0) {
        toast.info("Keine Deals zum Exportieren vorhanden.");
        return;
      }

      const headers = ['id', 'name', 'value', 'stage', 'probability', 'expectedCloseDate', 'createdAt', 'updatedAt'];
      const csvData = convertToCSV(deals, headers);

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "deals.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Deals erfolgreich als CSV exportiert!");
      } else {
        toast.error("CSV-Export wird von Ihrem Browser nicht unterstützt.");
      }
    } catch (error) {
      console.error("Fehler beim Exportieren der Deals: ", error);
      toast.error("Fehler beim Exportieren der Deals.");
    } finally {
      setIsExportingDeals(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datenverwaltung</CardTitle>
        <CardDescription>
          Verwalten Sie Ihre CRM-Daten, einschließlich Export, Import und Aufbewahrungsrichtlinien.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Datenexport */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Datenexport</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={exportContactsToCSV} 
              variant="outline" 
              className="w-full justify-start text-left space-x-2 py-6"
              disabled={isExportingContacts || isImportingContacts}
            >
              <Download className="h-5 w-5 text-primary-blue" />
              <div>
                <p className="font-medium">{isExportingContacts ? 'Exportiere Kontakte...' : 'Kontakte exportieren (CSV)'}</p>
                <p className="text-xs text-muted-foreground">Laden Sie alle Ihre Kontaktdaten als CSV-Datei herunter.</p>
              </div>
            </Button>
            <Button 
              onClick={exportDealsToCSV} 
              variant="outline" 
              className="w-full justify-start text-left space-x-2 py-6"
              disabled={isExportingDeals || isImportingContacts}
            >
              <Download className="h-5 w-5 text-primary-blue" />
              <div>
                <p className="font-medium">{isExportingDeals ? 'Exportiere Deals...' : 'Deals exportieren (CSV)'}</p>
                <p className="text-xs text-muted-foreground">Laden Sie alle Ihre Deal-Daten als CSV-Datei herunter.</p>
              </div>
            </Button>
          </div>
        </section>

        <hr className="dark:border-gray-700"/>

        {/* Datenimport */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Datenimport</h3>
          <div className="p-4 border rounded-lg dark:border-gray-700">
            <Label htmlFor="contacts-csv-import" className="font-medium text-gray-700 dark:text-gray-300">Kontakte aus CSV-Datei importieren</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Laden Sie eine CSV-Datei hoch, um neue Kontakte zu erstellen oder bestehende zu aktualisieren.
            </p>
            <div className="flex items-center space-x-3">
              <Input
                id="contacts-csv-import"
                type="file"
                accept=".csv"
                onChange={handleContactsFileChange}
                className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-blue file:text-white hover:file:bg-primary-blue-dark"
                disabled={isImportingContacts}
              />
              <Button onClick={handleImportContacts} disabled={!contactsFile || isImportingContacts} className="space-x-2">
                <Upload className="h-4 w-4" />
                <span>{isImportingContacts ? 'Importiere...' : 'Import starten'}</span>
              </Button>
            </div>
            {contactsFile && (
              <p className="text-xs text-muted-foreground mt-2">Ausgewählte Datei: {contactsFile.name}</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Stellen Sie sicher, dass Ihre CSV-Datei Spalten wie 'Name', 'Email', 'Telefon' etc. enthält. <a href="/path-to-csv-template.csv" download className="text-primary-blue hover:underline">Laden Sie eine Vorlage herunter.</a>
            </p>
          </div>
        </section>
        
        <hr className="dark:border-gray-700"/>

        {/* Datenaufbewahrung */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Datenaufbewahrung</h3>
          <div className="p-4 border rounded-lg dark:border-gray-700">
            <Label htmlFor="data-retention-days" className="font-medium text-gray-700 dark:text-gray-300">Aufbewahrungsfrist für Daten</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Legen Sie fest, wie lange inaktive oder gelöschte Daten im System aufbewahrt werden sollen (z.B. für DSGVO-Compliance).
            </p>
            <div className="flex items-center space-x-3">
              <Input
                id="data-retention-days"
                type="number"
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(parseInt(e.target.value, 10))}
                className="w-32"
                min="30"
              />
              <span className="text-sm text-muted-foreground">Tage</span>
              <Button 
                onClick={handleSaveDataRetention} 
                className="space-x-2"
                disabled={isSavingRetention}
              >
                <Settings2 className="h-4 w-4" />
                <span>{isSavingRetention ? 'Speichern...' : 'Richtlinie speichern'}</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Änderungen an dieser Einstellung werden auf zukünftige Daten angewendet. Bestehende Daten folgen ggf. der vorherigen Richtlinie, bis sie manuell bereinigt werden.
            </p>
          </div>
        </section>

        <div className="pt-6 text-right">
          <Button variant="destructive" className="space-x-2" onClick={() => toast.warning("Die Funktion 'Alle Daten löschen' ist sehr kritisch und noch nicht implementiert.", { duration: 5000 })}>
            <Trash2 className="h-4 w-4" />
            <span>Alle CRM Daten unwiderruflich löschen (Achtung!)</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagementSettingsTab; 
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Annahme: Tabs sind verfügbar
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Bell, Settings as SettingsIcon, Database, Zap, Repeat } from 'lucide-react'; // Icons für Tabs
import ProfileSettingsTab from '@/components/settings/ProfileSettingsTab'; // Import der neuen Komponente
import NotificationSettingsTab from '@/components/settings/NotificationSettingsTab'; // Import der neuen Komponente
import PipelineSettingsTab from '@/components/settings/PipelineSettingsTab'; // Import der neuen Komponente
import DataManagementSettingsTab from '@/components/settings/DataManagementSettingsTab'; // Import der neuen Komponente
import IntegrationSettingsTab from '@/components/settings/IntegrationSettingsTab';
import RecurringTasksSettingsTab from '@/components/settings/RecurringTasksSettingsTab';

// Platzhalter-Komponenten für jeden Tab-Inhalt (ProfileSettings wird entfernt)
// const ProfileSettings: React.FC = () => (
//   <Card>
//     <CardHeader>
//       <CardTitle>Profile Settings</CardTitle>
//       <CardDescription>Manage your profile information.</CardDescription>
//     </CardHeader>
//     <CardContent>
//       <p>Display Name, Email, Phone, Profile Picture, Password Change, 2FA...</p>
//     </CardContent>
//   </Card>
// );

// const NotificationSettings: React.FC = () => (
//   <Card>
//     <CardHeader>
//       <CardTitle>Notification Settings</CardTitle>
//       <CardDescription>Configure your notification preferences.</CardDescription>
//     </CardHeader>
//     <CardContent>
//       <p>Email Notifications, Browser Notifications, Frequency...</p>
//     </CardContent>
//   </Card>
// );

// const PipelineSettings: React.FC = () => (
//   <Card>
//     <CardHeader>
//       <CardTitle>Pipeline Settings</CardTitle>
//       <CardDescription>Customize your sales pipeline.</CardDescription>
//     </CardHeader>
//     <CardContent>
//       <p>Stage Names, Add/Remove Stages, Default Probability, Stage Colors...</p>
//     </CardContent>
//   </Card>
// );

// const DataManagementSettings: React.FC = () => (
//   <Card>
//     <CardHeader>
//       <CardTitle>Data Management</CardTitle>
//       <CardDescription>Manage your CRM data.</CardDescription>
//     </CardHeader>
//     <CardContent>
//       <p>Export Contacts (CSV), Export Deals (CSV), Import Contacts (CSV), Data Retention...</p>
//     </CardContent>
//   </Card>
// );

const IntegrationSettings: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Integrations</CardTitle>
      <CardDescription>Connect and manage third-party applications.</CardDescription>
    </CardHeader>
    <CardContent>
      <p>API Keys, Webhook Settings, Connected Apps...</p>
    </CardContent>
  </Card>
);


const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Einstellungen</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Verwalten Sie Ihre Account- und Anwendungseinstellungen.
        </p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Benachrichtigungen</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center space-x-2">
            <SettingsIcon className="w-4 h-4" /> {/* Lucide's Settings als SettingsIcon importiert */}
            <span>Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Datenverwaltung</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Integrationen</span>
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center space-x-2">
            <Repeat className="w-4 h-4" />
            <span>Wiederkehrende Aufgaben</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettingsTab /> {/* Verwendung der neuen Komponente */}
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettingsTab /> {/* Verwendung der neuen Komponente */}
        </TabsContent>
        <TabsContent value="pipeline">
          <PipelineSettingsTab /> {/* Verwendung der neuen Komponente */}
        </TabsContent>
        <TabsContent value="data">
          <DataManagementSettingsTab /> {/* Verwendung der neuen Komponente */}
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationSettingsTab />
        </TabsContent>
        <TabsContent value="recurring">
          <RecurringTasksSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage; 
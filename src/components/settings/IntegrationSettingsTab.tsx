import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Key, Link, Trash2, Plus, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/services/firebase/AuthProvider';
import {
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  getConnectedApps,
  connectApp,
  disconnectApp,
  updateWebhookStatus
} from '@/services/firebase/integrationService';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed?: Date;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

interface ConnectedApp {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected';
  connectedAt?: Date;
}

const IntegrationSettingsTab: React.FC = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState<string[]>([]);

  useEffect(() => {
    loadIntegrationData();
  }, [user?.uid]);

  const loadIntegrationData = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const [keys, hooks, apps] = await Promise.all([
        getApiKeys(user.uid),
        getWebhooks(user.uid),
        getConnectedApps(user.uid)
      ]);
      setApiKeys(keys);
      setWebhooks(hooks);
      setConnectedApps(apps);
    } catch (error) {
      console.error("Fehler beim Laden der Integrationsdaten:", error);
      toast.error("Fehler beim Laden der Integrationsdaten");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!user?.uid || !newApiKeyName.trim()) {
      toast.error("Bitte geben Sie einen Namen für den API-Key ein");
      return;
    }

    try {
      const newKey = await createApiKey(user.uid, newApiKeyName);
      setApiKeys(prev => [...prev, newKey]);
      setNewApiKeyName('');
      toast.success("API-Key erfolgreich erstellt");
    } catch (error) {
      console.error("Fehler beim Erstellen des API-Keys:", error);
      toast.error("Fehler beim Erstellen des API-Keys");
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!user?.uid) return;

    try {
      await deleteApiKey(user.uid, keyId);
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      toast.success("API-Key erfolgreich gelöscht");
    } catch (error) {
      console.error("Fehler beim Löschen des API-Keys:", error);
      toast.error("Fehler beim Löschen des API-Keys");
    }
  };

  const handleCreateWebhook = async () => {
    if (!user?.uid || !newWebhookUrl.trim() || selectedWebhookEvents.length === 0) {
      toast.error("Bitte geben Sie eine URL ein und wählen Sie mindestens ein Event aus");
      return;
    }

    try {
      const newWebhook = await createWebhook(user.uid, newWebhookUrl, selectedWebhookEvents);
      setWebhooks(prev => [...prev, newWebhook]);
      setNewWebhookUrl('');
      setSelectedWebhookEvents([]);
      toast.success("Webhook erfolgreich erstellt");
    } catch (error) {
      console.error("Fehler beim Erstellen des Webhooks:", error);
      toast.error("Fehler beim Erstellen des Webhooks");
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!user?.uid) return;

    try {
      await deleteWebhook(user.uid, webhookId);
      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
      toast.success("Webhook erfolgreich gelöscht");
    } catch (error) {
      console.error("Fehler beim Löschen des Webhooks:", error);
      toast.error("Fehler beim Löschen des Webhooks");
    }
  };

  const handleConnectApp = async (appId: string) => {
    if (!user?.uid) return;

    try {
      await connectApp(user.uid, appId);
      setConnectedApps(prev => prev.map(app => 
        app.id === appId ? { ...app, status: 'connected', connectedAt: new Date() } : app
      ));
      toast.success("App erfolgreich verbunden");
    } catch (error) {
      console.error("Fehler beim Verbinden der App:", error);
      toast.error("Fehler beim Verbinden der App");
    }
  };

  const handleDisconnectApp = async (appId: string) => {
    if (!user?.uid) return;

    try {
      await disconnectApp(user.uid, appId);
      setConnectedApps(prev => prev.map(app => 
        app.id === appId ? { ...app, status: 'disconnected', connectedAt: undefined } : app
      ));
      toast.success("App erfolgreich getrennt");
    } catch (error) {
      console.error("Fehler beim Trennen der App:", error);
      toast.error("Fehler beim Trennen der App");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("In die Zwischenablage kopiert");
  };

  const handleWebhookStatusChange = async (webhookId: string, isActive: boolean) => {
    if (!user?.uid) return;

    try {
      await updateWebhookStatus(user.uid, webhookId, isActive);
      setWebhooks(prev => prev.map(webhook => 
        webhook.id === webhookId ? { ...webhook, isActive } : webhook
      ));
      toast.success(`Webhook ${isActive ? 'aktiviert' : 'deaktiviert'}`);
    } catch (error) {
      console.error("Fehler beim Ändern des Webhook-Status:", error);
      toast.error("Fehler beim Ändern des Webhook-Status");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrationen</CardTitle>
        <CardDescription>
          Verwalten Sie Ihre API-Keys, Webhooks und verbundene Apps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* API Keys */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">API Keys</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Name für neuen API-Key"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                className="max-w-md"
              />
              <Button onClick={handleCreateApiKey} className="space-x-2">
                <Plus className="h-4 w-4" />
                <span>API-Key erstellen</span>
              </Button>
            </div>

            <div className="space-y-2">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{apiKey.name}</p>
                    <p className="text-sm text-muted-foreground">Erstellt am: {apiKey.createdAt.toLocaleDateString()}</p>
                    {apiKey.lastUsed && (
                      <p className="text-sm text-muted-foreground">Zuletzt verwendet: {apiKey.lastUsed.toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Kopieren</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      className="space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Löschen</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="dark:border-gray-700"/>

        {/* Webhooks */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Webhooks</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Webhook URL"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="max-w-md"
              />
              <div className="flex flex-wrap gap-2">
                {['contact.created', 'contact.updated', 'deal.created', 'deal.updated', 'deal.won', 'deal.lost'].map((event) => (
                  <Button
                    key={event}
                    variant={selectedWebhookEvents.includes(event) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWebhookEvents(prev => 
                      prev.includes(event) 
                        ? prev.filter(e => e !== event)
                        : [...prev, event]
                    )}
                  >
                    {event}
                  </Button>
                ))}
              </div>
              <Button onClick={handleCreateWebhook} className="space-x-2">
                <Plus className="h-4 w-4" />
                <span>Webhook erstellen</span>
              </Button>
            </div>

            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{webhook.url}</p>
                    <p className="text-sm text-muted-foreground">
                      Events: {webhook.events.join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Erstellt am: {webhook.createdAt.toLocaleDateString()}
                    </p>
                    {webhook.lastTriggered && (
                      <p className="text-sm text-muted-foreground">
                        Zuletzt ausgelöst: {webhook.lastTriggered.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={(checked) => handleWebhookStatusChange(webhook.id, checked)}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Löschen</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="dark:border-gray-700"/>

        {/* Connected Apps */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Verbundene Apps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedApps.map((app) => (
              <div key={app.id} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <img src={app.icon} alt={app.name} className="w-8 h-8" />
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {app.status === 'connected' ? 'Verbunden' : 'Nicht verbunden'}
                    </p>
                  </div>
                </div>
                {app.status === 'connected' ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDisconnectApp(app.id)}
                    className="w-full"
                  >
                    Trennen
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleConnectApp(app.id)}
                    className="w-full"
                  >
                    Verbinden
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

export default IntegrationSettingsTab; 
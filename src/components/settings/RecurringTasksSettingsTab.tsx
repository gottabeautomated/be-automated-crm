import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/services/firebase/AuthProvider';
import {
  subscribeToRecurringTaskTemplates,
  addRecurringTaskTemplate,
  deleteRecurringTaskTemplate,
  RecurringTaskTemplate
} from '@/services/firebase/recurringTaskTemplateService';

const RecurringTasksSettingsTab: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<RecurringTaskTemplate[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [interval, setInterval] = useState<'täglich' | 'wöchentlich' | 'monatlich'>('täglich');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const unsubscribe = subscribeToRecurringTaskTemplates(
      user.uid,
      (data) => {
        setTemplates(data);
        setLoading(false);
      },
      (err) => {
        setError('Fehler beim Laden der Vorlagen');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user?.uid) return;
    try {
      await addRecurringTaskTemplate(user.uid, { title, description, interval });
      setTitle('');
      setDescription('');
      setInterval('täglich');
    } catch (err) {
      setError('Fehler beim Hinzufügen');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    try {
      await deleteRecurringTaskTemplate(user.uid, id);
    } catch (err) {
      setError('Fehler beim Löschen');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wiederkehrende Aufgaben verwalten</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="mb-6 flex flex-col md:flex-row gap-2 md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="z.B. Morgens E-Mails checken"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Beschreibung (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Kurze Beschreibung"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Intervall</label>
            <select
              value={interval}
              onChange={e => setInterval(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="täglich">Täglich</option>
              <option value="wöchentlich">Wöchentlich</option>
              <option value="monatlich">Monatlich</option>
            </select>
          </div>
          <button type="submit" className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
            <PlusCircle className="mr-2 h-5 w-5" /> Hinzufügen
          </button>
        </form>
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        {loading ? (
          <div className="text-gray-400">Lade Vorlagen...</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {templates.map(tpl => (
              <li key={tpl.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{tpl.title}</div>
                  <div className="text-xs text-gray-500">{tpl.interval}{tpl.description ? ` – ${tpl.description}` : ''}</div>
                </div>
                <button onClick={() => handleDelete(tpl.id)} className="text-red-500 hover:text-red-700" title="Löschen">
                  <Trash2 className="h-5 w-5" />
                </button>
              </li>
            ))}
            {templates.length === 0 && <li className="py-3 text-gray-400">Noch keine wiederkehrenden Aufgaben eingerichtet.</li>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringTasksSettingsTab; 
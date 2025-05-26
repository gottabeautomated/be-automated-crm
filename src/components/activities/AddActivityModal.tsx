import React, { useState, useEffect } from 'react';
import { ActivityFormData, ACTIVITY_TYPES, ACTIVITY_TYPE_DETAILS, ActivityTypeName } from '@/types/activityTypes';
import { addActivityService } from '@/services/firebase/activityService';
import { useAuth } from '@/services/firebase/AuthProvider';

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const NONE_SELECT_VALUE = "__NONE__"; // Special value for no selection

// Dummy data for contacts and deals - replace with actual data fetching/props
// In a real app, these would come from props or a global state/context
const dummyContacts = [
  { id: 'contact1', name: 'Max Mustermann' },
  { id: 'contact2', name: 'Erika Musterfrau' },
];
const dummyDeals = [
  { id: 'deal1', title: 'Großprojekt Alpha' },
  { id: 'deal2', title: 'Servicevertrag Beta' },
];

interface AddActivityModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onActivityAdded?: (activityId: string) => void; // Callback after successful addition
  // Optional default values for linking, e.g. if adding from a specific contact/deal page
  defaultContactId?: string;
  defaultDealId?: string;
}

const AddActivityModal: React.FC<AddActivityModalProps> = ({ 
    isOpen, 
    onOpenChange, 
    onActivityAdded, 
    defaultContactId,
    defaultDealId 
}) => {
  const { user, loading: authLoading } = useAuth();

  const initialFormData: ActivityFormData = {
    type: ACTIVITY_TYPES.CALL, // Default type
    title: '',
    description: '',
    notes: '',
    activityDate: format(new Date(), 'yyyy-MM-dd'), // Default to today
    contactId: defaultContactId || undefined, // Use undefined for no initial selection
    dealId: defaultDealId || undefined, // Use undefined for no initial selection
  };

  const [formData, setFormData] = useState<ActivityFormData>(initialFormData);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        const newActivityDate = format(selectedDate || new Date(), 'yyyy-MM-dd');
        setFormData({
            type: ACTIVITY_TYPES.CALL,
            title: '',
            description: '',
            notes: '',
            activityDate: newActivityDate,
            contactId: defaultContactId || undefined,
            dealId: defaultDealId || undefined,
            isCompleted: false,
        });
        setError(null);
    }
  }, [isOpen, defaultContactId, defaultDealId]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, activityDate: format(selectedDate, 'yyyy-MM-dd') }));
    }
  }, [selectedDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (value === NONE_SELECT_VALUE) {
      setFormData(prev => ({ ...prev, [name]: undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) {
        setError("Authentifizierungsstatus wird geladen...");
        return;
    }
    if (!user?.uid) {
      setError("Benutzer nicht authentifiziert.");
      return;
    }
    if (!formData.title.trim()) {
      setError("Titel darf nicht leer sein.");
      return;
    }
    if (!selectedDate) {
        setError("Aktivitätsdatum muss ausgewählt werden.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dataToSubmit: ActivityFormData = {
        ...formData,
        activityDate: format(selectedDate, 'yyyy-MM-dd'),
      };

      const activityId = await addActivityService(user.uid, dataToSubmit);
      setIsLoading(false);
      setSelectedDate(new Date());
      onOpenChange(false);
      if (onActivityAdded) {
        onActivityAdded(activityId);
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error adding activity: ", err);
      setError("Fehler beim Hinzufügen der Aktivität. Bitte versuche es erneut.");
    }
  };

  if (authLoading && isOpen) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lade...</DialogTitle>
                </DialogHeader>
                <p>Authentifizierung wird überprüft...</p>
            </DialogContent>
        </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Neue Aktivität hinzufügen</DialogTitle>
          <DialogDescription>
            Erfasse eine neue Kundeninteraktion oder Aufgabe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Typ
              </Label>
              <Select 
                name="type"
                value={formData.type}
                onValueChange={(value: ActivityTypeName) => handleSelectChange('type', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ACTIVITY_TYPES).map(type => (
                    <SelectItem key={type} value={type}>
                      {ACTIVITY_TYPE_DETAILS[type].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Titel
              </Label>
              <Input 
                id="title" 
                name="title"
                value={formData.title}
                onChange={handleChange} 
                className="col-span-3" 
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activityDate" className="text-right">
                Datum
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`col-span-3 justify-start text-left font-normal ${
                      !selectedDate && "text-muted-foreground" 
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP', { locale: de }) : <span>Datum auswählen</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Beschreibung
              </Label>
              <Textarea 
                id="description" 
                name="description"
                value={formData.description}
                onChange={handleChange} 
                className="col-span-3" 
                placeholder="Details zur Aktivität..."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Interne Notizen
              </Label>
              <Textarea 
                id="notes" 
                name="notes"
                value={formData.notes}
                onChange={handleChange} 
                className="col-span-3" 
                placeholder="Interne Vermerke, nächste Schritte..."
              />
            </div>

            {/* Contact Linking - Replace with actual Contact Search/Select component later */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactId" className="text-right">Kontakt</Label>
                <Select name="contactId" value={formData.contactId || NONE_SELECT_VALUE} onValueChange={(value: string) => handleSelectChange('contactId', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Kontakt verknüpfen" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE_SELECT_VALUE}>Kein Kontakt</SelectItem>
                        {dummyContacts.map(contact => (
                            <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Deal Linking - Replace with actual Deal Search/Select component later */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dealId" className="text-right">Deal</Label>
                <Select name="dealId" value={formData.dealId || NONE_SELECT_VALUE} onValueChange={(value: string) => handleSelectChange('dealId', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Deal verknüpfen" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE_SELECT_VALUE}>Kein Deal</SelectItem>
                        {dummyDeals.map(deal => (
                            <SelectItem key={deal.id} value={deal.id}>{deal.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            {formData.type === 'Task' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isCompleted" className="text-right">Erledigt</Label>
                    <div className="col-span-3 flex items-center">
                         <Input 
                            type="checkbox" 
                            id="isCompleted" 
                            name="isCompleted"
                            checked={formData.isCompleted || false} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({...prev, isCompleted: e.target.checked}))}
                            className="h-4 w-4"
                        />
                    </div>
                </div>
            )}

            {error && (
              <div className="col-span-4 p-2 bg-red-100 text-red-700 text-sm rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || authLoading}>
              {isLoading ? 'Wird gespeichert...' : 'Aktivität speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddActivityModal; 
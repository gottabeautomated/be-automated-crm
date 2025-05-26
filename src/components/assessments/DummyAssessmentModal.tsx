import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AssessmentResultFormData, AssessmentToolName, ASSESSMENT_TOOL_DETAILS } from '@/types/assessmentTypes';
import { useAuth } from '@/services/firebase/AuthProvider';
import { addAssessmentResultService } from '@/services/firebase/assessmentService';
import { toast } from 'sonner'; // Assuming sonner is used for notifications

interface DummyAssessmentModalProps {
  toolName: AssessmentToolName;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAssessmentCompleted?: (assessmentId: string) => void; // Callback after successful submission
}

export const DummyAssessmentModal: React.FC<DummyAssessmentModalProps> = ({ 
  toolName, 
  isOpen, 
  onOpenChange, 
  onAssessmentCompleted 
}) => {
  const { user } = useAuth();
  const [assessedEmail, setAssessedEmail] = useState('');
  const [score, setScore] = useState<number>(75);
  const [recommendationsInput, setRecommendationsInput] = useState('Empfehlung 1; Empfehlung 2; Empfehlung 3');
  const [isLoading, setIsLoading] = useState(false);

  const toolDetails = ASSESSMENT_TOOL_DETAILS[toolName];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sie müssen angemeldet sein, um ein Assessment zu speichern.');
      return;
    }
    if (!assessedEmail || !toolName) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus.');
      return;
    }

    setIsLoading(true);
    try {
      const recommendationsArray = recommendationsInput
        .split(';')
        .map(rec => ({ text: rec.trim() }))
        .filter(rec => rec.text);

      const formData: AssessmentResultFormData = {
        assessedEmail,
        type: toolName,
        score: Number(score),
        recommendations: recommendationsArray,
      };

      const assessmentId = await addAssessmentResultService(user.uid, formData);
      toast.success(`${toolDetails.name} Ergebnis erfolgreich gespeichert.`);
      onAssessmentCompleted?.(assessmentId);
      onOpenChange(false); // Close modal on success
      // Reset form
      setAssessedEmail('');
      setScore(75);
      setRecommendationsInput('Empfehlung 1; Empfehlung 2; Empfehlung 3');
    } catch (error) {
      console.error("Error submitting dummy assessment: ", error);
      toast.error('Fehler beim Speichern des Assessments. Details siehe Konsole.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>"{toolDetails.name}" durchführen (Simulation)</DialogTitle>
          <DialogDescription>
            Geben Sie hier die Ergebnisse des Assessments ein. Diese werden gespeichert und ggf. mit einem Kontakt verknüpft oder ein neuer Lead erstellt.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="assessedEmail">E-Mail des Teilnehmers</Label>
            <Input 
              id="assessedEmail" 
              type="email" 
              value={assessedEmail} 
              onChange={(e) => setAssessedEmail(e.target.value)} 
              placeholder="max.mustermann@beispiel.com"
              required 
            />
          </div>
          <div>
            <Label htmlFor="score">Erreichte Punktzahl (%)</Label>
            <Input 
              id="score" 
              type="number" 
              value={score} 
              onChange={(e) => setScore(Number(e.target.value))} 
              min="0" 
              max="100" 
              required 
            />
          </div>
          <div>
            <Label htmlFor="recommendations">Empfehlungen (durch Semikolon getrennt)</Label>
            <Textarea 
              id="recommendations" 
              value={recommendationsInput} 
              onChange={(e) => setRecommendationsInput(e.target.value)} 
              placeholder="Empfehlung A; Empfehlung B; ..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Speichert...' : 'Ergebnis Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 
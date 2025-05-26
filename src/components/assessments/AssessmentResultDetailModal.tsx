import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssessmentResult, ASSESSMENT_TOOL_DETAILS } from '@/types/assessmentTypes';
import { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { AssessmentPDFDocument } from './AssessmentPDFDocument';
import { Download, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendAssessmentResultEmailService } from '@/services/firebase/assessmentService';
import { useState } from 'react';

interface AssessmentResultDetailModalProps {
  result: AssessmentResult | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
         date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

export const AssessmentResultDetailModal: React.FC<AssessmentResultDetailModalProps> = ({ result, isOpen, onOpenChange }) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!result) return null;

  const toolDetails = ASSESSMENT_TOOL_DETAILS[result.type];
  const pdfFileName = `${toolDetails?.name.replace(/\s+/g, '_') || result.type.replace(/\s+/g, '_')}_Ergebnis_${result.assessedEmail?.split('@')[0] || 'Export'}.pdf`;

  const handleSendEmail = async () => {
    if (!result || !result.assessedEmail || !result.id || !result.contactId) {
      toast.error("Fehler: Notwendige Informationen für den E-Mail-Versand fehlen.");
      return;
    }
    setIsSendingEmail(true);
    try {
      const emailData = {
        to: result.assessedEmail,
        subject: `Ihr ${toolDetails?.name || result.type} Ergebnis`,
        html: `
          <h1>Ihr Assessment-Ergebnis</h1>
          <p>Hallo,</p>
          <p>anbei Ihr Ergebnis für das ${toolDetails?.name || result.type}.</p>
          <p>Tool: ${toolDetails?.name || result.type}</p>
          <p>Score: ${result.score}%</p>
          <p>Empfehlungen:</p>
          <ul>
            ${result.recommendations.map(rec => `<li>${rec.text}</li>`).join('')}
          </ul>
          <p>Sie können den vollständigen Bericht auch als PDF herunterladen.</p>
          <p>Mit freundlichen Grüßen,</p>
          <p>Ihr Team von Be Automated</p>
        `,
        assessmentId: result.id,
        contactId: result.contactId,
      };

      const response = await sendAssessmentResultEmailService(emailData);
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message || "Fehler beim Senden der E-Mail.");
      }
    } catch (error) {
      console.error("Error sending assessment email:", error);
      toast.error("Ein unerwarteter Fehler ist beim E-Mail-Versand aufgetreten.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Details: {toolDetails?.name || result.type}
            <Badge 
              variant="outline"
              className="ml-3"
              style={toolDetails ? {
                borderColor: toolDetails.colorScheme.border,
                color: toolDetails.colorScheme.text,
              } : {}}
            >
              Score: {result.score}%
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Abgeschlossen am: {formatDate(result.completedAt)} <br />
            Teilnehmer: {result.assessedEmail || 'N/A'}
            {result.contactId && <span className="text-xs"> (Kontakt-ID: {result.contactId})</span>}
          </DialogDescription>
        </DialogHeader>
        
        <Separator className="my-4" />

        <div className="grid gap-4 py-2">
          <h3 className="font-semibold text-md mb-1">Empfehlungen:</h3>
          {result.recommendations && result.recommendations.length > 0 ? (
            <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/20">
              <ul className="space-y-3 list-disc list-inside">
                {result.recommendations.map((rec, index) => (
                  <li key={rec.id || index} className="text-sm">
                    {rec.text}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">Keine spezifischen Empfehlungen vorhanden.</p>
          )}
        </div>

        {/* TODO: Hier könnten weitere Details zum Assessment (z.B. ScoreDetails) angezeigt werden */}

        <DialogFooter className="mt-4 sm:justify-between">
          <div className="flex gap-2">
            {result && (
              <PDFDownloadLink document={<AssessmentPDFDocument result={result} />} fileName={pdfFileName}>
                {({ blob, url, loading, error }) => (
                  <Button variant="outline" disabled={loading} className="whitespace-nowrap">
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'PDF generiert...' : 'PDF Herunterladen'}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
            <Button 
              variant="outline" 
              onClick={handleSendEmail} 
              disabled={isSendingEmail || !result?.assessedEmail}
              className="whitespace-nowrap"
            >
              {isSendingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {isSendingEmail ? 'Sende...' : 'Per E-Mail senden'}
            </Button>
          </div>
          <DialogClose asChild>
            <Button type="button">Schließen</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
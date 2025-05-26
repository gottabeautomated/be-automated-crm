import React, { useEffect, useState } from 'react';
import { useAuth } from '@/services/firebase/AuthProvider';
import { subscribeToAssessmentResultsForContact } from '@/services/firebase/assessmentService';
import { AssessmentResult, ASSESSMENT_TOOL_DETAILS } from '@/types/assessmentTypes';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Info, ListChecks, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssessmentResultDetailModal } from '@/components/assessments/AssessmentResultDetailModal'; // Reuse detail modal

interface ContactAssessmentHistoryProps {
  contactId: string;
}

const formatDate = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  // Kürzeres Format für die Historienansicht
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); 
};

export const ContactAssessmentHistory: React.FC<ContactAssessmentHistoryProps> = ({ contactId }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedResultModal, setSelectedResultModal] = useState<AssessmentResult | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (user?.uid && contactId) {
      setIsLoading(true);
      const unsubscribe = subscribeToAssessmentResultsForContact(
        user.uid,
        contactId,
        (fetchedResults) => {
          setResults(fetchedResults);
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          console.error(`Error fetching assessment results for contact ${contactId}:`, err);
          setError("Fehler beim Laden der Assessment-Historie.");
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setIsLoading(false);
      if (!contactId) setError("Keine Kontakt-ID vorhanden.");
    }
  }, [user, contactId]);

  const handleOpenDetailModal = (result: AssessmentResult) => {
    setSelectedResultModal(result);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary-blue mr-2" />
        <p className="text-sm">Lade Assessment-Historie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider flex items-center">
        <ListChecks className="w-5 h-5 text-gray-500 mr-2" />
        Assessment Historie
      </h3>
      {results.length === 0 ? (
        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Für diesen Kontakt wurden noch keine Assessments erfasst.
        </p>
      ) : (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-200">
              {results.map((result) => (
                <li key={result.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span 
                        className="font-medium text-primary-blue hover:underline cursor-pointer text-sm"
                        onClick={() => handleOpenDetailModal(result)}
                      >
                        {ASSESSMENT_TOOL_DETAILS[result.type]?.name || result.type}
                      </span>
                      <p className="text-xs text-gray-500">
                        Score: {result.score}% am {formatDate(result.completedAt)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDetailModal(result)} title="Details anzeigen">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <AssessmentResultDetailModal 
        result={selectedResultModal}
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
}; 
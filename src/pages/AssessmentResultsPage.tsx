import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/services/firebase/AuthProvider';
import { subscribeToAssessmentResultsForUser } from '@/services/firebase/assessmentService';
import { AssessmentResult, ASSESSMENT_TOOL_DETAILS, AssessmentToolName, ASSESSMENT_TOOLS } from '@/types/assessmentTypes';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Info, Filter, Eye, CalendarIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssessmentResultDetailModal } from '@/components/assessments/AssessmentResultDetailModal';
import { format, isValid, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const formatDateForDisplay = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
         date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

const AssessmentResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [allResults, setAllResults] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterType, setFilterType] = useState<AssessmentToolName | 'all'>('all');
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [filterMaxScore, setFilterMaxScore] = useState<string>('');
  
  // State for detail modal
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      setIsLoading(true);
      const unsubscribe = subscribeToAssessmentResultsForUser(
        user.uid,
        (fetchedResults) => {
          setAllResults(fetchedResults);
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error fetching assessment results:", err);
          setError("Fehler beim Laden der Assessment-Ergebnisse.");
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const filteredResults = useMemo(() => {
    let results = allResults;
    if (filterType !== 'all') {
      results = results.filter(result => result.type === filterType);
    }
    if (filterStartDate) {
      results = results.filter(result => 
        result.completedAt && (result.completedAt as Timestamp).toDate() >= filterStartDate
      );
    }
    if (filterEndDate) {
      // Add 1 day to endDate to make it inclusive of the selected day
      const inclusiveEndDate = new Date(filterEndDate);
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
      results = results.filter(result => 
        result.completedAt && (result.completedAt as Timestamp).toDate() < inclusiveEndDate
      );
    }
    const minScore = parseInt(filterMinScore, 10);
    if (!isNaN(minScore)) {
      results = results.filter(result => result.score >= minScore);
    }
    const maxScore = parseInt(filterMaxScore, 10);
    if (!isNaN(maxScore)) {
      results = results.filter(result => result.score <= maxScore);
    }
    return results;
  }, [allResults, filterType, filterStartDate, filterEndDate, filterMinScore, filterMaxScore]);

  const handleOpenDetailModal = (result: AssessmentResult) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setFilterMinScore('');
    setFilterMaxScore('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary-blue" />
        <p className="ml-4 text-lg">Lade Assessment-Ergebnisse...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Assessment Ergebnisse</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Hier finden Sie eine Übersicht aller Ihrer abgeschlossenen Assessments.
        </p>
      </header>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5" /> Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="filter-type">Assessment Typ</Label>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as AssessmentToolName | 'all')}>
              <SelectTrigger id="filter-type">
                <SelectValue placeholder="Alle Typen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                {Object.values(ASSESSMENT_TOOLS).map(tool => (
                  <SelectItem key={tool} value={tool}>{ASSESSMENT_TOOL_DETAILS[tool]?.name || tool}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="filter-startDate">Startdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!filterStartDate && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterStartDate ? format(filterStartDate, 'PPP', { locale: de }) : <span>Startdatum</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={filterStartDate} onSelect={setFilterStartDate} initialFocus locale={de} />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="filter-endDate">Enddatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!filterEndDate && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterEndDate ? format(filterEndDate, 'PPP', { locale: de }) : <span>Enddatum</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={filterEndDate} onSelect={setFilterEndDate} initialFocus locale={de} />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="filter-minScore">Min Score (%)</Label>
              <Input id="filter-minScore" type="number" placeholder="0" value={filterMinScore} onChange={(e) => setFilterMinScore(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="filter-maxScore">Max Score (%)</Label>
              <Input id="filter-maxScore" type="number" placeholder="100" value={filterMaxScore} onChange={(e) => setFilterMaxScore(e.target.value)} />
            </div>
          </div>

          <Button variant="outline" onClick={resetFilters} className="w-full md:col-span-2 lg:col-span-1 lg:mt-0 mt-4">
             <XIcon className="mr-2 h-4 w-4" /> Filter zurücksetzen
          </Button>
        </CardContent>
      </Card>

      {filteredResults.length === 0 && !isLoading ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Keine Ergebnisse</AlertTitle>
          <AlertDescription>Es wurden keine Assessment-Ergebnisse für die aktuellen Filterkriterien gefunden.</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Abgeschlossene Assessments ({filteredResults.length})</CardTitle>
            <CardDescription>Klicken Sie auf ein Ergebnis oder den "Details" Button, um die vollständigen Informationen anzuzeigen.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Teilnehmer E-Mail</TableHead>
                  <TableHead className="text-right">Score (%)</TableHead>
                  <TableHead>Abgeschlossen am</TableHead>
                  <TableHead className="text-center">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id} className="hover:bg-muted/50">
                    <TableCell onClick={() => handleOpenDetailModal(result)} className="cursor-pointer">
                      <Badge style={{
                        backgroundColor: ASSESSMENT_TOOL_DETAILS[result.type]?.colorScheme.iconBg,
                        color: ASSESSMENT_TOOL_DETAILS[result.type]?.colorScheme.iconText
                      }}>
                        {ASSESSMENT_TOOL_DETAILS[result.type]?.name || result.type}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => handleOpenDetailModal(result)} className="cursor-pointer">{result.assessedEmail || 'N/A'}</TableCell>
                    <TableCell onClick={() => handleOpenDetailModal(result)} className="text-right cursor-pointer">{result.score}</TableCell>
                    <TableCell onClick={() => handleOpenDetailModal(result)} className="cursor-pointer">{formatDateForDisplay(result.completedAt)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetailModal(result)}>
                        <Eye className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <AssessmentResultDetailModal 
        result={selectedResult}
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
};

export default AssessmentResultsPage; 
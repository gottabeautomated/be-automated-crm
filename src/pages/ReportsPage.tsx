import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download, Mail, Printer } from 'lucide-react';
import SalesPerformanceReport from '@/components/reports/SalesPerformanceReport';
import ActivitySummaryReport from '@/components/reports/ActivitySummaryReport';
import PipelineAnalysisReport from '@/components/reports/PipelineAnalysisReport';
import AssessmentResultsReport from '@/components/reports/AssessmentResultsReport';
import CustomReportBuilder from '@/components/reports/CustomReportBuilder';

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });

  const handleExport = (format: 'pdf' | 'csv') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleScheduleEmail = () => {
    // TODO: Implement email scheduling
    console.log('Schedule email report');
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Analysieren Sie Ihre Geschäftsdaten mit vordefinierten und benutzerdefinierten Reports.
        </p>
      </header>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            CSV Export
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            PDF Export
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Drucken
          </Button>
          <Button variant="outline" onClick={handleScheduleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Per E-Mail
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Vertriebsperformance</TabsTrigger>
          <TabsTrigger value="activities">Aktivitäten</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="custom">Benutzerdefiniert</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesPerformanceReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitySummaryReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="pipeline">
          <PipelineAnalysisReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="assessments">
          <AssessmentResultsReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="custom">
          <CustomReportBuilder dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage; 
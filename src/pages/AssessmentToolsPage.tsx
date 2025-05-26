import React, { useState } from 'react';
import { BarChart3, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ASSESSMENT_TOOLS, ASSESSMENT_TOOL_DETAILS, AssessmentToolDetail, AssessmentToolName } from '@/types/assessmentTypes';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names
import { DummyAssessmentModal } from '@/components/assessments/DummyAssessmentModal'; // Import the modal

// Helper to get Lucide icon component by name
const iconMap: Record<string, React.ElementType> = {
  BarChart3,
  Zap,
  Users,
};

const AssessmentToolCard: React.FC<{ 
  tool: AssessmentToolDetail;
  onClick: () => void; // Add onClick prop
}> = ({ tool, onClick }) => {
  const IconComponent = iconMap[tool.icon];

  return (
    <Card 
      className={cn(
        'w-full max-w-sm cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2',
        tool.colorScheme.border,
      )}
      onClick={onClick} // Use the passed onClick handler
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn('text-xl font-semibold', tool.colorScheme.text)}>{tool.name}</CardTitle>
        {IconComponent && (
          <div className={cn('p-2 rounded-md', tool.colorScheme.iconBg)}>
            <IconComponent className={cn('h-6 w-6', tool.colorScheme.iconText)} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-muted-foreground">
          {tool.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

const AssessmentToolsPage: React.FC = () => {
  const toolsToShow: AssessmentToolName[] = [
    ASSESSMENT_TOOLS.DIGITAL_ASSESSMENT,
    ASSESSMENT_TOOLS.KI_READINESS,
    ASSESSMENT_TOOLS.CRM_BUILDER,
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AssessmentToolName | null>(null);

  const handleCardClick = (toolName: AssessmentToolName) => {
    setSelectedTool(toolName);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTool(null);
  };

  const handleAssessmentCompleted = (assessmentId: string) => {
    console.log("Assessment completed with ID:", assessmentId);
    // Optionally, navigate to results page or show further confirmation
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Assessment Center</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Starten Sie hier Ihre Assessments, um wertvolle Einblicke zu gewinnen und Strategien zu entwickeln.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolsToShow.map((toolName) => (
          <AssessmentToolCard 
            key={toolName} 
            tool={ASSESSMENT_TOOL_DETAILS[toolName]} 
            onClick={() => handleCardClick(toolName)} // Pass click handler
          />
        ))}
      </div>

      {selectedTool && (
        <DummyAssessmentModal 
          toolName={selectedTool}
          isOpen={isModalOpen}
          onOpenChange={handleModalClose} // Use a specific close handler for clarity or if more logic is needed
          onAssessmentCompleted={handleAssessmentCompleted}
        />
      )}

      {/* 
        Placeholder for future Assessment Results Dashboard link or section 
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Ihre Ergebnisse</h2>
          <p>Hier finden Sie eine Übersicht Ihrer abgeschlossenen Assessments.</p>
          <Button className="mt-4">Zum Ergebnis-Dashboard</Button> 
        </div>
      */}
    </div>
  );
};

export default AssessmentToolsPage; 
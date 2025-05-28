import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const handleAddTask = () => {
    navigate('/tasks/new');
  };

  const handleLogActivity = () => {
    navigate('/activities/new');
  };

  const handleScheduleFollowUp = () => {
    navigate('/activities/new?type=follow-up');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Schnellzugriff</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto py-4"
            onClick={handleAddTask}
          >
            <PlusCircle className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Aufgabe</div>
              <div className="text-xs text-muted-foreground">Neue Aufgabe erstellen</div>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto py-4"
            onClick={handleLogActivity}
          >
            <Activity className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Aktivität</div>
              <div className="text-xs text-muted-foreground">Aktivität protokollieren</div>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto py-4"
            onClick={handleScheduleFollowUp}
          >
            <Calendar className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Follow-up</div>
              <div className="text-xs text-muted-foreground">Follow-up planen</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions; 
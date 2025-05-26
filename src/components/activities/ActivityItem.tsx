import React, { useState, lazy, Suspense } from 'react';
import { Activity, ACTIVITY_TYPE_DETAILS, ActivityTypeName } from '@/types/activityTypes';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // For marking tasks as complete
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Dynamically import lucide-react icons
const LucideIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const Icon = lazy(() => 
    import('lucide-react').then(module => ({
      default: module[name] as React.ComponentType<any>
    }))
  );
  return (
    <Suspense fallback={<div style={{ width: props.size || 20, height: props.size || 20 }} />}>
      <Icon {...props} />
    </Suspense>
  );
};

interface ActivityItemProps {
  activity: Activity;
  onUpdateActivity?: (activityId: string, updates: Partial<Activity>) => Promise<void>;
  onDeleteActivity?: (activityId: string) => Promise<void>; // Optional for future use
  currentUserId?: string; // To check if the current user can edit/delete
}

const formatDate = (timestamp?: Timestamp) => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleString('de-DE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onUpdateActivity, currentUserId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeDetails = ACTIVITY_TYPE_DETAILS[activity.type];

  const handleToggleExpand = () => setIsExpanded(!isExpanded);

  const handleMarkTaskComplete = async (completed: boolean) => {
    if (activity.type === 'Task' && onUpdateActivity) {
      try {
        await onUpdateActivity(activity.id, { isCompleted: completed, completedAt: completed ? Timestamp.now() : undefined });
      } catch (error) {
        console.error("Error updating task status: ", error);
        // Optionally show an error to the user
      }
    }
  };

  const canModify = activity.userId === currentUserId;

  return (
    <Card className={`mb-4 shadow-sm hover:shadow-md transition-shadow ${typeDetails.color.replace('text-', 'border-l-4 border-') // Use border for type color
    .replace(/bg-([a-z]+)-50/, `bg-$1-50`)}`}>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${typeDetails.color}`}>
              <LucideIcon name={typeDetails.icon} size={20} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{activity.title}</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {typeDetails.name} {activity.userName && `von ${activity.userName}`}
                {' • '} {/* Separator dot */}
                {formatDate(activity.activityDate)}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleToggleExpand} className="self-start">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 pt-0">
          <Separator className="my-2" />
          {activity.description && (
            <div className="mb-2">
              <h4 className="font-medium text-sm mb-1">Beschreibung</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.description}</p>
            </div>
          )}
          {activity.notes && (
            <div className="mb-2">
              <h4 className="font-medium text-sm mb-1">Notizen</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.notes}</p>
            </div>
          )}

          <div className="text-xs text-gray-500 mb-2">
            {activity.contactName && (
                <span>Verknüpfter Kontakt: <span className="font-medium text-gray-700">{activity.contactName}</span></span>
            )}
            {activity.contactName && activity.dealTitle && <span className="mx-1">|</span>}
            {activity.dealTitle && (
                <span>Verknüpfter Deal: <span className="font-medium text-gray-700">{activity.dealTitle}</span></span>
            )}
          </div>

          {activity.type === 'Task' && onUpdateActivity && (
            <div className="mt-3 flex items-center space-x-2 p-3 bg-slate-50 rounded-md">
              <Checkbox 
                id={`task-${activity.id}`}
                checked={activity.isCompleted}
                onCheckedChange={(checked: boolean | string) => handleMarkTaskComplete(checked as boolean)}
                disabled={!canModify} // Disable if user cannot modify
              />
              <label 
                htmlFor={`task-${activity.id}`}
                className={`text-sm font-medium ${activity.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'} ${!canModify ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Als erledigt markieren
              </label>
            </div>
          )}
          <Separator className="my-3" />
          <div className="text-xs text-gray-400 flex justify-between">
            <span>Erstellt: {formatDate(activity.createdAt)}</span>
            <span>Zuletzt geändert: {formatDate(activity.updatedAt)}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ActivityItem; 
import React from 'react';
import { Activity } from '@/types/activityTypes';
import ActivityItem from './ActivityItem';
import { Timestamp } from 'firebase/firestore';

interface ActivityListProps {
  activities: Activity[];
  onUpdateActivity?: (activityId: string, updates: Partial<Activity>) => Promise<void>;
  currentUserId?: string;
  isLoading?: boolean;
}

const groupActivitiesByDate = (activities: Activity[]) => {
  const groups: Record<string, Activity[]> = {};

  activities.forEach(activity => {
    const date = activity.activityDate.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let dateString: string;
    if (date.toDateString() === today.toDateString()) {
      dateString = 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateString = 'Gestern';
    } else {
      dateString = date.toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    if (!groups[dateString]) {
      groups[dateString] = [];
    }
    groups[dateString].push(activity);
  });

  return groups;
};

const ActivityList: React.FC<ActivityListProps> = ({ activities, onUpdateActivity, currentUserId, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-gray-100 p-4 rounded-lg shadow animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return <p className="text-center text-gray-500 py-8">Keine Aktivitäten gefunden.</p>;
  }

  const groupedActivities = groupActivitiesByDate(activities);
  const dateKeys = Object.keys(groupedActivities).sort((a, b) => {
    // Sort logic: 'Heute' first, 'Gestern' second, then dates descending
    if (a === 'Heute') return -1;
    if (b === 'Heute') return 1;
    if (a === 'Gestern') return -1;
    if (b === 'Gestern') return 1;
    // For actual dates, convert back to Date objects for comparison, assuming format is parseable or use stored Timestamps
    // This is a simplified sort for the example, robust date sorting might be needed if format varies wildly
    const dateA = new Date(groupedActivities[a][0].activityDate.toDate());
    const dateB = new Date(groupedActivities[b][0].activityDate.toDate());
    return dateB.getTime() - dateA.getTime(); 
  });


  return (
    <div className="space-y-6">
      {dateKeys.map(dateKey => (
        <div key={dateKey}>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
            {dateKey}
          </h3>
          <div className="space-y-4">
            {groupedActivities[dateKey].map(activity => (
              <ActivityItem 
                key={activity.id} 
                activity={activity} 
                onUpdateActivity={onUpdateActivity} 
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityList; 
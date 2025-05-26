import React, { useState, useEffect, useCallback } from 'react';
import { Activity, ActivityFormData } from '@/types/activityTypes';
import { useAuth } from '@/services/firebase/AuthProvider';
import {
  subscribeToActivitiesService,
  updateActivityService,
  ActivityFilters // Assuming you might want to add filters later
} from '@/services/firebase/activityService';
import ActivityList from '@/components/activities/ActivityList';
import AddActivityModal from '@/components/activities/AddActivityModal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
// import { toast } from 'sonner'; // Commented out for now

const ActivitiesPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Optional: State for filters if you want to implement them on this page
  // const [filters, setFilters] = useState<ActivityFilters | null>(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      setError('Benutzer nicht angemeldet, um Aktivitäten zu laden.');
      setActivities([]); // Clear activities if user logs out
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToActivitiesService(
      user.uid,
      null, // Pass filters here if using them
      (fetchedActivities) => {
        setActivities(fetchedActivities);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error subscribing to activities: ", err);
        setError('Fehler beim Laden der Aktivitäten.');
        // toast.error("Fehler beim Laden der Aktivitäten."); // Example notification
        setIsLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [user, authLoading /*, filters */]);

  const handleUpdateActivity = async (activityId: string, updates: Partial<Activity>) => {
    if (!user) {
      // toast.error("Benutzer nicht angemeldet.");
      console.error("User not logged in to update activity");
      return;
    }
    try {
      // Prepare data specifically for ActivityFormData
      const updateDataForService: Partial<ActivityFormData> = {};

      if (updates.type !== undefined) updateDataForService.type = updates.type;
      if (updates.title !== undefined) updateDataForService.title = updates.title;
      if (updates.description !== undefined) updateDataForService.description = updates.description;
      if (updates.notes !== undefined) updateDataForService.notes = updates.notes;
      if (updates.contactId !== undefined) updateDataForService.contactId = updates.contactId;
      if (updates.dealId !== undefined) updateDataForService.dealId = updates.dealId;
      if (updates.isCompleted !== undefined && updates.type === 'Task') { // Ensure isCompleted is only for Tasks
        updateDataForService.isCompleted = updates.isCompleted;
      }
      // Handle assignedToUserId if it exists in Activity and ActivityFormData
      // if (updates.assignedToUserId !== undefined) updateDataForService.assignedToUserId = updates.assignedToUserId; 

      if (updates.activityDate) {
        if (updates.activityDate instanceof Timestamp) {
          updateDataForService.activityDate = updates.activityDate.toDate().toISOString().split('T')[0]; // Format as YYYY-MM-DD string
        } else if (typeof updates.activityDate === 'string') { 
          // If it's already a string, assume it's correctly formatted or add validation/reformatting
          updateDataForService.activityDate = updates.activityDate;
        } else {
          // Handle cases where activityDate might be a Date object directly from some client-side manipulation
          // This case might not be hit if updates always come from Firestore (as Timestamp) or forms (as string)
          try {
            updateDataForService.activityDate = (updates.activityDate as Date).toISOString().split('T')[0];
          } catch (dateError) {
            console.error("Invalid date format in updates for activityDate: ", updates.activityDate);
            // Optionally, throw an error or prevent update if date is unusable
          }
        }
      }

      if (Object.keys(updateDataForService).length === 0) {
        console.log("No valid fields to update.");
        return;
      }

      await updateActivityService(user.uid, activityId, updateDataForService);
      // toast.success("Aktivität aktualisiert!");
    } catch (err) {
      console.error("Error updating activity: ", err);
      // toast.error("Fehler beim Aktualisieren der Aktivität.");
    }
  };

  const handleActivityAdded = (activityId: string) => {
    // toast.success("Neue Aktivität erfolgreich hinzugefügt!");
    console.log("New activity added with ID:", activityId);
    // The list will refresh due to the Firestore listener.
    // Optionally, you could re-fetch or optimistically add to the list if not using real-time updates for some reason.
  };

  if (authLoading) {
    return <div className="p-6 text-center">Authentifizierung wird geladen...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Aktivitäten-Timeline</h1>
        {user && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle size={20} className="mr-2" />
            Neue Aktivität
          </Button>
        )}
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
      
      <ActivityList 
        activities={activities} 
        onUpdateActivity={handleUpdateActivity} 
        currentUserId={user?.uid}
        isLoading={isLoading}
      />

      {user && (
        <AddActivityModal 
          isOpen={isAddModalOpen} 
          onOpenChange={setIsAddModalOpen} 
          onActivityAdded={handleActivityAdded}
        />
      )}
    </div>
  );
};

export default ActivitiesPage; 
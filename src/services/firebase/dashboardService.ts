import { collection, query, where, getDocs, orderBy, limit, Timestamp, startAt, endAt } from 'firebase/firestore';
import { db } from './firebase';

export interface DashboardKPIs {
  activeDeals: {
    value: number;
    change: number;
  };
  newContacts: {
    value: number;
    period: string;
  };
  pipelineValue: {
    value: number;
    change: number;
  };
  openTasks: {
    value: number;
    dueToday: number;
  };
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  probability: number;
  stage: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  relatedTo?: {
    type: 'deal' | 'contact';
    id: string;
    name: string;
  };
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface PipelineData {
  name: string;
  value: number;
}

export interface DealData {
  stage: string;
  value: number;
  count: number;
}

export interface ContactData {
  date: string;
  new: number;
  total: number;
}

export interface ActivityData {
  date: string;
  calls: number;
  emails: number;
  meetings: number;
  tasks: number;
}

export const getDashboardKPIs = async (userId: string): Promise<DashboardKPIs> => {
  try {
    // Aktive Deals
    const dealsRef = collection(db, 'users', userId, 'deals');
    const activeDealsQuery = query(
      dealsRef,
      where('status', '==', 'active')
    );
    const activeDealsSnapshot = await getDocs(activeDealsQuery);
    const activeDealsValue = activeDealsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().value || 0), 0);

    // Neue Kontakte
    const contactsRef = collection(db, 'users', userId, 'contacts');
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newContactsQuery = query(
      contactsRef,
      where('createdAt', '>=', Timestamp.fromDate(lastWeek))
    );
    const newContactsSnapshot = await getDocs(newContactsQuery);

    // Pipeline-Wert
    const pipelineQuery = query(
      dealsRef,
      where('status', 'in', ['active', 'negotiation'])
    );
    const pipelineSnapshot = await getDocs(pipelineQuery);
    const pipelineValue = pipelineSnapshot.docs.reduce((sum, doc) => sum + (doc.data().value || 0), 0);

    // Offene Aufgaben
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const openTasksQuery = query(
      tasksRef,
      where('status', '==', 'open')
    );
    const openTasksSnapshot = await getDocs(openTasksQuery);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueToday = openTasksSnapshot.docs.filter(doc => {
      const dueDate = doc.data().dueDate?.toDate();
      return dueDate && dueDate <= today;
    }).length;

    return {
      activeDeals: {
        value: activeDealsValue,
        change: 12 // TODO: Implementiere tatsächliche Berechnung
      },
      newContacts: {
        value: newContactsSnapshot.size,
        period: 'Diese Woche'
      },
      pipelineValue: {
        value: pipelineValue,
        change: 8 // TODO: Implementiere tatsächliche Berechnung
      },
      openTasks: {
        value: openTasksSnapshot.size,
        dueToday
      }
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Dashboard-KPIs:", error);
    throw error;
  }
};

export const getTopDeals = async (userId: string, max: number = 3): Promise<Deal[]> => {
  try {
    const dealsRef = collection(db, 'users', userId, 'deals');
    const topDealsQuery = query(
      dealsRef,
      where('status', '==', 'active'),
      orderBy('value', 'desc'),
      limit(max)
    );
    const snapshot = await getDocs(topDealsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Deal[];
  } catch (error) {
    console.error("Fehler beim Abrufen der Top Deals:", error);
    throw error;
  }
};

export const getRecentActivities = async (userId: string, max: number = 3): Promise<Activity[]> => {
  try {
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      orderBy('timestamp', 'desc'),
      limit(max)
    );
    const snapshot = await getDocs(activitiesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as Activity[];
  } catch (error) {
    console.error("Fehler beim Abrufen der letzten Aktivitäten:", error);
    throw error;
  }
};

export const getRevenueData = async (userId: string, days: number = 30): Promise<RevenueData[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const dealsRef = collection(db, 'users', userId, 'deals');
    const dealsQuery = query(
      dealsRef,
      where('status', '==', 'won'),
      where('closedAt', '>=', Timestamp.fromDate(startDate))
    );
    const snapshot = await getDocs(dealsQuery);
    
    const revenueByDate = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const deal = doc.data();
      const date = deal.closedAt.toDate().toISOString().split('T')[0];
      revenueByDate.set(date, (revenueByDate.get(date) || 0) + (deal.value || 0));
    });

    return Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Fehler beim Abrufen der Umsatzdaten:", error);
    throw error;
  }
};

export const getPipelineData = async (userId: string): Promise<PipelineData[]> => {
  try {
    const dealsRef = collection(db, 'users', userId, 'deals');
    const dealsQuery = query(
      dealsRef,
      where('status', 'in', ['active', 'negotiation'])
    );
    const snapshot = await getDocs(dealsQuery);
    
    const pipelineByStage = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const deal = doc.data();
      const stage = deal.stage || 'Unbekannt';
      pipelineByStage.set(stage, (pipelineByStage.get(stage) || 0) + (deal.value || 0));
    });

    return Array.from(pipelineByStage.entries()).map(([name, value]) => ({
      name,
      value
    }));
  } catch (error) {
    console.error("Fehler beim Abrufen der Pipeline-Daten:", error);
    throw error;
  }
};

export const getDealsData = async (userId: string): Promise<DealData[]> => {
  try {
    const dealsRef = collection(db, 'users', userId, 'deals');
    const dealsQuery = query(dealsRef);
    const snapshot = await getDocs(dealsQuery);
    
    const dealsByStage = new Map<string, { value: number; count: number }>();
    snapshot.docs.forEach(doc => {
      const deal = doc.data();
      const stage = deal.stage || 'Unbekannt';
      const current = dealsByStage.get(stage) || { value: 0, count: 0 };
      dealsByStage.set(stage, {
        value: current.value + (deal.value || 0),
        count: current.count + 1
      });
    });

    return Array.from(dealsByStage.entries()).map(([stage, data]) => ({
      stage,
      ...data
    }));
  } catch (error) {
    console.error("Fehler beim Abrufen der Deals-Daten:", error);
    throw error;
  }
};

export const getContactsData = async (userId: string, days: number = 30): Promise<ContactData[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const contactsRef = collection(db, 'users', userId, 'contacts');
    const contactsQuery = query(
      contactsRef,
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    );
    const snapshot = await getDocs(contactsQuery);
    
    const contactsByDate = new Map<string, { new: number; total: number }>();
    snapshot.docs.forEach(doc => {
      const contact = doc.data();
      const date = contact.createdAt.toDate().toISOString().split('T')[0];
      const current = contactsByDate.get(date) || { new: 0, total: 0 };
      contactsByDate.set(date, {
        new: current.new + 1,
        total: current.total + 1
      });
    });

    return Array.from(contactsByDate.entries()).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Fehler beim Abrufen der Kontakte-Daten:", error);
    throw error;
  }
};

export const getActivitiesData = async (userId: string, days: number = 30): Promise<ActivityData[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    const snapshot = await getDocs(activitiesQuery);
    
    const activitiesByDate = new Map<string, { calls: number; emails: number; meetings: number; tasks: number }>();
    snapshot.docs.forEach(doc => {
      const activity = doc.data();
      const date = activity.timestamp.toDate().toISOString().split('T')[0];
      const current = activitiesByDate.get(date) || { calls: 0, emails: 0, meetings: 0, tasks: 0 };
      
      switch (activity.type) {
        case 'call':
          current.calls++;
          break;
        case 'email':
          current.emails++;
          break;
        case 'meeting':
          current.meetings++;
          break;
        case 'task':
          current.tasks++;
          break;
      }
      
      activitiesByDate.set(date, current);
    });

    return Array.from(activitiesByDate.entries()).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Fehler beim Abrufen der Aktivitäten-Daten:", error);
    throw error;
  }
}; 
import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';

export interface SalesData {
  month: string;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  conversionRate: number;
}

export interface ActivityData {
  date: string;
  calls: number;
  emails: number;
  meetings: number;
  total: number;
}

export interface PipelineData {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

export interface AssessmentData {
  date: string;
  score: number;
  category: string;
  trend: number;
}

export async function getSalesPerformanceData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SalesData[]> {
  const dealsRef = collection(db, 'deals');
  const q = query(
    dealsRef,
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(endDate))
  );

  const snapshot = await getDocs(q);
  const deals = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Gruppiere Deals nach Monat
  const monthlyData = new Map<string, SalesData>();
  
  deals.forEach(deal => {
    const date = new Date(deal.createdAt.toDate());
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        month: monthKey,
        revenue: 0,
        dealsWon: 0,
        dealsLost: 0,
        conversionRate: 0
      });
    }
    
    const monthData = monthlyData.get(monthKey)!;
    
    if (deal.status === 'won') {
      monthData.revenue += deal.value;
      monthData.dealsWon++;
    } else if (deal.status === 'lost') {
      monthData.dealsLost++;
    }
  });

  // Berechne Konversionsraten
  monthlyData.forEach(data => {
    const totalDeals = data.dealsWon + data.dealsLost;
    data.conversionRate = totalDeals > 0 ? (data.dealsWon / totalDeals) * 100 : 0;
  });

  return Array.from(monthlyData.values()).sort((a, b) => {
    const [aMonth, aYear] = a.month.split('/').map(Number);
    const [bMonth, bYear] = b.month.split('/').map(Number);
    return aYear === bYear ? aMonth - bMonth : aYear - bYear;
  });
}

export async function getActivitySummaryData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ActivityData[]> {
  const activitiesRef = collection(db, 'activities');
  const q = query(
    activitiesRef,
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  const activities = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Gruppiere Aktivitäten nach Datum
  const dailyData = new Map<string, ActivityData>();
  
  activities.forEach(activity => {
    const date = activity.date.toDate().toISOString().split('T')[0];
    
    if (!dailyData.has(date)) {
      dailyData.set(date, {
        date,
        calls: 0,
        emails: 0,
        meetings: 0,
        total: 0
      });
    }
    
    const dayData = dailyData.get(date)!;
    
    switch (activity.type) {
      case 'call':
        dayData.calls++;
        break;
      case 'email':
        dayData.emails++;
        break;
      case 'meeting':
        dayData.meetings++;
        break;
    }
    
    dayData.total++;
  });

  return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPipelineAnalysisData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<PipelineData[]> {
  const dealsRef = collection(db, 'deals');
  const q = query(
    dealsRef,
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(endDate))
  );

  const snapshot = await getDocs(q);
  const deals = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Gruppiere Deals nach Stage
  const stageData = new Map<string, PipelineData>();
  
  deals.forEach(deal => {
    if (!stageData.has(deal.stage)) {
      stageData.set(deal.stage, {
        stage: deal.stage,
        count: 0,
        value: 0,
        conversionRate: 0
      });
    }
    
    const stage = stageData.get(deal.stage)!;
    stage.count++;
    stage.value += deal.value;
  });

  // Berechne Konversionsraten
  const stages = Array.from(stageData.values());
  const totalDeals = stages.reduce((sum, stage) => sum + stage.count, 0);
  
  stages.forEach(stage => {
    stage.conversionRate = (stage.count / totalDeals) * 100;
  });

  return stages.sort((a, b) => b.value - a.value);
}

export async function getAssessmentResultsData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<AssessmentData[]> {
  const assessmentsRef = collection(db, 'assessments');
  const q = query(
    assessmentsRef,
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  const assessments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return assessments.map(assessment => ({
    date: assessment.date.toDate().toISOString().split('T')[0],
    score: assessment.score,
    category: assessment.category,
    trend: assessment.trend || 0
  }));
} 
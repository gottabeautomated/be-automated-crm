import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Activity as ActivityIcon
} from 'lucide-react';
import { useAuth } from '@/services/firebase/AuthProvider';
import { 
  getDashboardKPIs, 
  getTopDeals, 
  getRecentActivities,
  getRevenueData,
  getPipelineData,
  getDealsData,
  getContactsData,
  getActivitiesData,
  type Deal, 
  type Activity,
  type RevenueData,
  type PipelineData,
  type DealData,
  type ContactData,
  type ActivityData
} from '@/services/firebase/dashboardService';
import { toast } from 'sonner';
import RevenueChart from '@/components/dashboard/charts/RevenueChart';
import PipelineChart from '@/components/dashboard/charts/PipelineChart';
import DealsChart from '@/components/dashboard/charts/DealsChart';
import ContactsChart from '@/components/dashboard/charts/ContactsChart';
import ActivitiesChart from '@/components/dashboard/charts/ActivitiesChart';
import { subscribeToRecurringTaskTemplates, RecurringTaskTemplate } from '@/services/firebase/recurringTaskTemplateService';
import QuickActions from '@/components/dashboard/QuickActions';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [topDeals, setTopDeals] = useState<Deal[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  const [dealsData, setDealsData] = useState<DealData[]>([]);
  const [contactsData, setContactsData] = useState<ContactData[]>([]);
  const [activitiesData, setActivitiesData] = useState<ActivityData[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTaskTemplate[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
    if (!user?.uid) return;
    const unsubscribe = subscribeToRecurringTaskTemplates(
      user.uid,
      (data) => setRecurringTasks(data),
      (err) => console.error('Fehler beim Laden der wiederkehrenden Aufgaben:', err)
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const loadDashboardData = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const [
        kpisData,
        dealsData,
        activitiesData,
        revenueData,
        pipelineData,
        dealsChartData,
        contactsData,
        activitiesChartData
      ] = await Promise.all([
        getDashboardKPIs(user.uid),
        getTopDeals(user.uid),
        getRecentActivities(user.uid),
        getRevenueData(user.uid),
        getPipelineData(user.uid),
        getDealsData(user.uid),
        getContactsData(user.uid),
        getActivitiesData(user.uid)
      ]);
      setKpis(kpisData);
      setTopDeals(dealsData);
      setRecentActivities(activitiesData);
      setRevenueData(revenueData);
      setPipelineData(pipelineData);
      setDealsData(dealsChartData);
      setContactsData(contactsData);
      setActivitiesData(activitiesChartData);
    } catch (error) {
      console.error("Fehler beim Laden der Dashboard-Daten:", error);
      toast.error("Fehler beim Laden der Dashboard-Daten");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheck = (id: string) => {
    setCheckedTasks((prev) => prev.includes(id) ? prev : [...prev, id]);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Übersicht über Ihre wichtigsten Geschäftskennzahlen und Aktivitäten.
        </p>
      </header>

      {/* KPI-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Deals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{kpis?.activeDeals.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.activeDeals.change > 0 ? '+' : ''}{kpis?.activeDeals.change}% gegenüber dem Vormonat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Kontakte</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{kpis?.newContacts.value}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.newContacts.period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline-Wert</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{kpis?.pipelineValue.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.pipelineValue.change > 0 ? '+' : ''}{kpis?.pipelineValue.change}% gegenüber dem Vormonat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Aufgaben</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.openTasks.value}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.openTasks.dueToday} fällig heute
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Hauptbereich mit Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="contacts">Kontakte</TabsTrigger>
          <TabsTrigger value="activities">Aktivitäten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Umsatzentwicklung */}
            <Card>
              <CardHeader>
                <CardTitle>Umsatzentwicklung</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={revenueData} />
              </CardContent>
            </Card>

            {/* Pipeline-Verteilung */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <PipelineChart data={pipelineData} />
              </CardContent>
            </Card>

            {/* Top Deals */}
            <Card>
              <CardHeader>
                <CardTitle>Top Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deal.name}</p>
                        <p className="text-sm text-muted-foreground">€{deal.value.toLocaleString()}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {deal.probability}% Wahrscheinlichkeit
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Letzte Aktivitäten */}
            <Card>
              <CardHeader>
                <CardTitle>Letzte Aktivitäten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ToDo: Wiederkehrende Aufgaben heute */}
            <Card>
              <CardHeader>
                <CardTitle>ToDo: Wiederkehrende Aufgaben heute</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-200">
                  {recurringTasks.length === 0 && <li className="py-2 text-gray-400">Keine wiederkehrenden Aufgaben eingerichtet.</li>}
                  {recurringTasks.map(task => (
                    <li key={task.id} className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        checked={checkedTasks.includes(task.id)}
                        onChange={() => handleCheck(task.id)}
                        className="accent-sky-600 h-4 w-4"
                        id={`rec-task-${task.id}`}
                      />
                      <label htmlFor={`rec-task-${task.id}`} className={checkedTasks.includes(task.id) ? 'line-through text-gray-400' : ''}>
                        <span className="font-medium">{task.title}</span>
                        {task.description && <span className="ml-2 text-xs text-gray-500">{task.description}</span>}
                        <span className="ml-2 text-xs text-gray-400">({task.interval})</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle>Deals Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <DealsChart data={dealsData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Kontakte Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactsChart data={contactsData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitäten Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivitiesChart data={activitiesData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Hilfsfunktion zum Formatieren der Zeit
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Gerade eben';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Vor ${diffInMinutes} ${diffInMinutes === 1 ? 'Minute' : 'Minuten'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Vor ${diffInHours} ${diffInHours === 1 ? 'Stunde' : 'Stunden'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Vor ${diffInDays} ${diffInDays === 1 ? 'Tag' : 'Tagen'}`;
  }

  return date.toLocaleDateString();
};

export default DashboardPage; 
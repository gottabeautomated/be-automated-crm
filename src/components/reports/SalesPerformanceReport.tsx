import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { useAuth } from '@/services/firebase/AuthProvider';
import { getSalesPerformanceData } from '@/services/firebase/reportsService';

interface SalesPerformanceReportProps {
  dateRange: DateRange;
}

interface SalesData {
  month: string;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  conversionRate: number;
}

const SalesPerformanceReport: React.FC<SalesPerformanceReportProps> = ({ dateRange }) => {
  const { user } = useAuth();
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !dateRange.from || !dateRange.to) return;
      
      setLoading(true);
      try {
        const salesData = await getSalesPerformanceData(user.uid, dateRange.from, dateRange.to);
        setData(salesData);
      } catch (err) {
        setError('Fehler beim Laden der Vertriebsdaten');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid, dateRange]);

  if (loading) {
    return <div>Lade Vertriebsdaten...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalDealsWon = data.reduce((sum, item) => sum + item.dealsWon, 0);
  const totalDealsLost = data.reduce((sum, item) => sum + item.dealsLost, 0);
  const avgConversionRate = data.reduce((sum, item) => sum + item.conversionRate, 0) / data.length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gewonnene Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDealsWon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verlorene Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDealsLost}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konversionsrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Umsatzentwicklung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Umsatz" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals Gewonnen/Verloren</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="dealsWon" fill="#4ade80" name="Gewonnen" />
                  <Bar dataKey="dealsLost" fill="#f87171" name="Verloren" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesPerformanceReport; 
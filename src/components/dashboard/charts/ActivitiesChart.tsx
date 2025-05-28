import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ActivityData {
  date: string;
  calls: number;
  emails: number;
  meetings: number;
  tasks: number;
}

interface ActivitiesChartProps {
  data: ActivityData[];
}

const ActivitiesChart: React.FC<ActivitiesChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          labelFormatter={(label) => new Date(label).toLocaleDateString('de-DE', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        />
        <Bar
          dataKey="calls"
          fill="#2563eb"
          name="Anrufe"
          stackId="a"
        />
        <Bar
          dataKey="emails"
          fill="#3b82f6"
          name="E-Mails"
          stackId="a"
        />
        <Bar
          dataKey="meetings"
          fill="#60a5fa"
          name="Termine"
          stackId="a"
        />
        <Bar
          dataKey="tasks"
          fill="#93c5fd"
          name="Aufgaben"
          stackId="a"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ActivitiesChart; 
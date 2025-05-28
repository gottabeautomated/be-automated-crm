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

interface ContactData {
  date: string;
  new: number;
  total: number;
}

interface ContactsChartProps {
  data: ContactData[];
}

const ContactsChart: React.FC<ContactsChartProps> = ({ data }) => {
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
          formatter={(value: number, name: string) => {
            if (name === 'new') {
              return [value, 'Neue Kontakte'];
            }
            return [value, 'Gesamt'];
          }}
          labelFormatter={(label) => new Date(label).toLocaleDateString('de-DE', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        />
        <Bar
          dataKey="new"
          fill="#2563eb"
          name="Neue Kontakte"
        />
        <Bar
          dataKey="total"
          fill="#60a5fa"
          name="Gesamt"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ContactsChart; 
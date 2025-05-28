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

interface DealData {
  stage: string;
  value: number;
  count: number;
}

interface DealsChartProps {
  data: DealData[];
}

const DealsChart: React.FC<DealsChartProps> = ({ data }) => {
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
          dataKey="stage" 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `€${value.toLocaleString()}`}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === 'value') {
              return [`€${value.toLocaleString()}`, 'Wert'];
            }
            return [value, 'Anzahl'];
          }}
        />
        <Bar
          dataKey="value"
          fill="#2563eb"
          name="Wert"
        />
        <Bar
          dataKey="count"
          fill="#60a5fa"
          name="Anzahl"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DealsChart; 
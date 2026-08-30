import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Tooltip,
} from 'recharts';

// -- Mini Bar Group ------------------------------------------------------------
interface BarGroupProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export const BarGroup: React.FC<BarGroupProps> = ({ data, height = 40 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart
      data={data}
      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      barGap={2}
    >
      <Bar dataKey="value" radius={[2, 2, 0, 0]}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color || '#00E784'} />
        ))}
      </Bar>
      <Tooltip
        contentStyle={{
          background: '#1e293b',
          border: 'none',
          borderRadius: 8,
          fontSize: 10,
          color: '#fff',
          padding: '4px 8px',
        }}
        itemStyle={{ color: '#fff' }}
        cursor={{ fill: 'transparent' }}
      />
    </BarChart>
  </ResponsiveContainer>
);

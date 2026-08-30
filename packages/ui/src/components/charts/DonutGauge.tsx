import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// -- Mini Donut Gauge ----------------------------------------------------------
interface DonutProps {
  value: number; // 0–100
  color?: string;
  size?: number;
  label?: string;
}

export const DonutGauge: React.FC<DonutProps> = ({
  value,
  color = '#00E784',
  size = 64,
  label,
}) => {
  const data = [{ v: value }, { v: 100 - value }];
  const colors = [color, '#f1f5f9'];
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2 - 1}
          cy={size / 2 - 1}
          innerRadius={size * 0.32}
          outerRadius={size * 0.46}
          startAngle={90}
          endAngle={-270}
          dataKey="v"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Pie>
      </PieChart>
      <span
        className="absolute text-[10px] font-semibold text-slate-700"
        style={{ fontSize: size * 0.18 }}
      >
        {label ?? `${value}%`}
      </span>
    </div>
  );
};

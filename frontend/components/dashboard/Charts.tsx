"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";

const COLORS = {
  brand: "#1dad97",
  brandSoft: "#82dec8",
  warning: "#e69a1a",
  danger: "#c0392b",
  success: "#1dad97",
  pencil: "#2b2418",
};

interface ChartCardProps {
  title: string;
  description?: string;
  height?: number;
  children: React.ReactElement;
}

export function ChartCard({ title, description, height = 300, children }: ChartCardProps) {
  return (
    <Card variant="default" padding="md">
      <div className="mb-3">
        <h3 className="font-handrawn text-display-6 text-heading">{title}</h3>
        {description ? (
          <p className="text-small text-body-subtle">{description}</p>
        ) : null}
      </div>
      <div style={{ width: "100%", height }}>{children}</div>
    </Card>
  );
}

const AXIS_STYLE = { fontSize: 12, fill: "#6f6151", fontFamily: "Elms Sans" };
const TOOLTIP_STYLE = {
  backgroundColor: "#f4eddf",
  border: "2px dashed #2b2418",
  borderRadius: 16,
  fontFamily: "Elms Sans",
  fontSize: 13,
  padding: "8px 12px",
};

export interface BarSeriesPoint {
  label: string;
  value: number;
}

export function BarSeriesChart({
  data,
  dataKey = "value",
  xKey = "label",
  color = COLORS.brand,
  height = 280,
}: {
  data: BarSeriesPoint[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="#d9c9ae" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS_STYLE} stroke="#c9b795" />
        <YAxis tick={AXIS_STYLE} stroke="#c9b795" />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(29,173,151,0.08)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface LineSeriesPoint {
  label: string;
  value: number;
}

export function LineSeriesChart({
  data,
  dataKey = "value",
  xKey = "label",
  color = COLORS.brand,
  height = 280,
}: {
  data: LineSeriesPoint[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="#d9c9ae" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS_STYLE} stroke="#c9b795" />
        <YAxis tick={AXIS_STYLE} stroke="#c9b795" />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={3}
          dot={{ r: 5, fill: color, stroke: "#2b2418", strokeWidth: 2 }}
          activeDot={{ r: 7, fill: color, stroke: "#2b2418", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface PieDatum {
  name: string;
  value: number;
}

export function PieSeriesChart({
  data,
  height = 280,
}: {
  data: PieDatum[];
  height?: number;
}) {
  const colors = [COLORS.brand, COLORS.warning, COLORS.danger, COLORS.brandSoft];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          stroke="#2b2418"
          strokeWidth={2}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={colors[idx % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          wrapperStyle={{ fontFamily: "Elms Sans", fontSize: 13, color: "#4a3f2e" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

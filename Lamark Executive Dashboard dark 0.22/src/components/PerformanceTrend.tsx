import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendData {
  month: string;
  spend: number;
  roas: number;
}

interface PerformanceTrendProps {
  data: TrendData[];
}

export function PerformanceTrend({ data }: PerformanceTrendProps) {
  return (
    <div className="bg-white p-6 border border-slate-200">
      <h3 className="text-slate-900 mb-4">Performance Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis yAxisId="left" stroke="#64748b" />
          <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="spend"
            stroke="#2563eb"
            strokeWidth={2}
            name="Spend ($)"
            dot={{ fill: "#2563eb", r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="roas"
            stroke="#f97316"
            strokeWidth={2}
            name="ROAS (x)"
            dot={{ fill: "#f97316", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Account {
  accountName: string;
  clientType: string;
  spend: number;
  revenue: number;
  leads: number;
  roas: number;
  cpl: number;
}

interface ClientTypeComparisonProps {
  ecomData: Account[];
  leadGenData: Account[];
}

export function ClientTypeComparison({
  ecomData,
  leadGenData,
}: ClientTypeComparisonProps) {
  const ecomSpend = ecomData.reduce((sum, acc) => sum + acc.spend, 0);
  const leadGenSpend = leadGenData.reduce((sum, acc) => sum + acc.spend, 0);
  const ecomRevenue = ecomData.reduce((sum, acc) => sum + acc.revenue, 0);
  const leadGenRevenue = leadGenData.reduce((sum, acc) => sum + acc.revenue, 0);
  const ecomROAS = ecomRevenue / ecomSpend;
  const leadGenROAS = leadGenRevenue / leadGenSpend;

  const comparisonData = [
    {
      metric: "Spend",
      "E-commerce": ecomSpend,
      "Lead Generation": leadGenSpend,
    },
    {
      metric: "ROAS",
      "E-commerce": ecomROAS,
      "Lead Generation": leadGenROAS,
    },
  ];

  return (
    <div className="bg-white p-6 border border-slate-200">
      <h3 className="text-slate-900 mb-4">Client Type Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="metric" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
            }}
          />
          <Legend />
          <Bar dataKey="E-commerce" fill="#2563eb" />
          <Bar dataKey="Lead Generation" fill="#f97316" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

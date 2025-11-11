import { Card } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const trendData = [
  { month: "Jan", champions: 1056, atRisk: 1567, hibernating: 1234 },
  { month: "Feb", champions: 1123, atRisk: 1456, hibernating: 1189 },
  { month: "Mar", champions: 1187, atRisk: 1398, hibernating: 1045 },
  { month: "Apr", champions: 1201, atRisk: 1345, hibernating: 987 },
  { month: "May", champions: 1234, atRisk: 1342, hibernating: 956 },
  { month: "Jun", champions: 1245, atRisk: 1342, hibernating: 939 },
];

export function RFMTrendChart() {
  return (
    <Card className="p-6">
      <h3 className="mb-4">Segment Trends Over Time</h3>
      <p className="text-sm text-gray-600 mb-4">
        Track how key customer segments are evolving month over month
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="champions" stroke="#10b981" strokeWidth={2} name="Champions" />
          <Line type="monotone" dataKey="atRisk" stroke="#ef4444" strokeWidth={2} name="At Risk" />
          <Line type="monotone" dataKey="hibernating" stroke="#9ca3af" strokeWidth={2} name="Hibernating" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

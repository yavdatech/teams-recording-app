import { Card } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const segmentData = [
  { name: "Champions", value: 1245, color: "#10b981" },
  { name: "Loyal Customers", value: 2156, color: "#3b82f6" },
  { name: "Potential Loyalists", value: 1823, color: "#6366f1" },
  { name: "New Customers", value: 987, color: "#8b5cf6" },
  { name: "Promising", value: 1456, color: "#06b6d4" },
  { name: "Need Attention", value: 1654, color: "#f59e0b" },
  { name: "At Risk", value: 1342, color: "#ef4444" },
  { name: "Can't Lose Them", value: 856, color: "#dc2626" },
  { name: "Hibernating", value: 939, color: "#9ca3af" },
];

export function RFMSegmentChart() {
  return (
    <Card className="p-6">
      <h3 className="mb-4">Customer Segmentation Distribution</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={segmentData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {segmentData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

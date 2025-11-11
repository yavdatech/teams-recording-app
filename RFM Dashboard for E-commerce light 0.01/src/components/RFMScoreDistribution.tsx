import { Card } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const rfmData = [
  { score: "1", recency: 234, frequency: 456, monetary: 345 },
  { score: "2", recency: 567, frequency: 678, monetary: 543 },
  { score: "3", recency: 1234, frequency: 987, monetary: 876 },
  { score: "4", recency: 2345, frequency: 1876, monetary: 1654 },
  { score: "5", recency: 1876, frequency: 2134, monetary: 2345 },
];

export function RFMScoreDistribution() {
  return (
    <Card className="p-6">
      <h3 className="mb-4">RFM Score Distribution</h3>
      <p className="text-sm text-gray-600 mb-4">
        Distribution of customers across Recency, Frequency, and Monetary scores (1-5 scale)
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={rfmData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="score" label={{ value: 'Score', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Number of Customers', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="recency" fill="#3b82f6" name="Recency" />
          <Bar dataKey="frequency" fill="#10b981" name="Frequency" />
          <Bar dataKey="monetary" fill="#f59e0b" name="Monetary" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

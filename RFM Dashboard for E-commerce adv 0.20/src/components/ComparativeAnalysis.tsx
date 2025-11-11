import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface PeriodData {
  period: string;
  totalCustomers: number;
  totalRevenue: number;
  avgRFM: number;
  segments: Record<string, number>;
}

const periodsData: Record<string, PeriodData> = {
  "current": {
    period: "Oct 2024",
    totalCustomers: 12458,
    totalRevenue: 1200000,
    avgRFM: 3.8,
    segments: {
      "Champions": 1245,
      "Loyal Customers": 2890,
      "Potential Loyalists": 2150,
      "New Customers": 1680,
      "Promising": 890,
      "Need Attention": 1420,
      "At Risk": 1340,
      "Can't Lose Them": 520,
      "Hibernating": 323,
    }
  },
  "last-month": {
    period: "Sep 2024",
    totalCustomers: 11980,
    totalRevenue: 1100000,
    avgRFM: 3.7,
    segments: {
      "Champions": 1180,
      "Loyal Customers": 2720,
      "Potential Loyalists": 2050,
      "New Customers": 1520,
      "Promising": 840,
      "Need Attention": 1380,
      "At Risk": 1450,
      "Can't Lose Them": 560,
      "Hibernating": 280,
    }
  },
  "last-quarter": {
    period: "Jul 2024",
    totalCustomers: 10850,
    totalRevenue: 980000,
    avgRFM: 3.6,
    segments: {
      "Champions": 1050,
      "Loyal Customers": 2450,
      "Potential Loyalists": 1890,
      "New Customers": 1420,
      "Promising": 780,
      "Need Attention": 1320,
      "At Risk": 1380,
      "Can't Lose Them": 390,
      "Hibernating": 170,
    }
  },
  "last-year": {
    period: "Oct 2023",
    totalCustomers: 8640,
    totalRevenue: 750000,
    avgRFM: 3.4,
    segments: {
      "Champions": 820,
      "Loyal Customers": 1890,
      "Potential Loyalists": 1520,
      "New Customers": 1180,
      "Promising": 640,
      "Need Attention": 1050,
      "At Risk": 1120,
      "Can't Lose Them": 320,
      "Hibernating": 100,
    }
  },
};

const segmentColors: Record<string, string> = {
  "Champions": "#10b981",
  "Loyal Customers": "#3b82f6",
  "Potential Loyalists": "#6366f1",
  "New Customers": "#a855f7",
  "Promising": "#06b6d4",
  "Need Attention": "#eab308",
  "At Risk": "#f97316",
  "Can't Lose Them": "#ef4444",
  "Hibernating": "#6b7280",
};

export function ComparativeAnalysis() {
  const [period1, setPeriod1] = useState("current");
  const [period2, setPeriod2] = useState("last-quarter");

  const data1 = periodsData[period1];
  const data2 = periodsData[period2];

  // Calculate changes
  const customerChange = ((data1.totalCustomers - data2.totalCustomers) / data2.totalCustomers * 100).toFixed(1);
  const revenueChange = ((data1.totalRevenue - data2.totalRevenue) / data2.totalRevenue * 100).toFixed(1);
  const rfmChange = ((data1.avgRFM - data2.avgRFM) / data2.avgRFM * 100).toFixed(1);

  // Prepare comparison data for charts
  const segmentComparisonData = Object.keys(data1.segments).map(segment => ({
    segment,
    [data1.period]: data1.segments[segment],
    [data2.period]: data2.segments[segment],
    change: data1.segments[segment] - data2.segments[segment],
  }));

  // Top movers
  const topGainers = segmentComparisonData
    .filter(s => s.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 3);

  const topDecliners = segmentComparisonData
    .filter(s => s.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="mb-1">Period Comparison</h3>
            <p className="text-sm text-gray-600">Compare RFM metrics across different time periods</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm text-gray-600 mb-2 block">Period 1</label>
            <Select value={period1} onValueChange={setPeriod1}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current (Oct 2024)</SelectItem>
                <SelectItem value="last-month">Last Month (Sep 2024)</SelectItem>
                <SelectItem value="last-quarter">Last Quarter (Jul 2024)</SelectItem>
                <SelectItem value="last-year">Last Year (Oct 2023)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ArrowRight className="w-6 h-6 text-gray-400 mt-6" />

          <div className="flex-1">
            <label className="text-sm text-gray-600 mb-2 block">Period 2</label>
            <Select value={period2} onValueChange={setPeriod2}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current (Oct 2024)</SelectItem>
                <SelectItem value="last-month">Last Month (Sep 2024)</SelectItem>
                <SelectItem value="last-quarter">Last Quarter (Jul 2024)</SelectItem>
                <SelectItem value="last-year">Last Year (Oct 2023)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total Customers</div>
          <div className="flex items-baseline gap-4 mb-2">
            <div className="text-3xl">{data1.totalCustomers.toLocaleString()}</div>
            <div className="text-sm text-gray-500">vs {data2.totalCustomers.toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-1">
            {parseFloat(customerChange) >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+{customerChange}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">{customerChange}%</span>
              </>
            )}
            <span className="text-sm text-gray-500 ml-1">change</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
          <div className="flex items-baseline gap-4 mb-2">
            <div className="text-3xl">${(data1.totalRevenue / 1000000).toFixed(2)}M</div>
            <div className="text-sm text-gray-500">vs ${(data2.totalRevenue / 1000000).toFixed(2)}M</div>
          </div>
          <div className="flex items-center gap-1">
            {parseFloat(revenueChange) >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+{revenueChange}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">{revenueChange}%</span>
              </>
            )}
            <span className="text-sm text-gray-500 ml-1">change</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Avg RFM Score</div>
          <div className="flex items-baseline gap-4 mb-2">
            <div className="text-3xl">{data1.avgRFM.toFixed(1)}</div>
            <div className="text-sm text-gray-500">vs {data2.avgRFM.toFixed(1)}</div>
          </div>
          <div className="flex items-center gap-1">
            {parseFloat(rfmChange) >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+{rfmChange}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">{rfmChange}%</span>
              </>
            )}
            <span className="text-sm text-gray-500 ml-1">change</span>
          </div>
        </Card>
      </div>

      {/* Segment Distribution Comparison */}
      <Card className="p-6">
        <h3 className="mb-6">Segment Distribution Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={segmentComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={data1.period} fill="#3b82f6" />
            <Bar dataKey={data2.period} fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Segment Changes Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="mb-4">Top Growing Segments</h3>
          <div className="space-y-3">
            {topGainers.map((segment) => (
              <div key={segment.segment} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium">{segment.segment}</div>
                  <div className="text-sm text-gray-600">
                    {segment[data2.period]} → {segment[data1.period]} customers
                  </div>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">+{segment.change}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4">Declining Segments</h3>
          <div className="space-y-3">
            {topDecliners.map((segment) => (
              <div key={segment.segment} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">{segment.segment}</div>
                  <div className="text-sm text-gray-600">
                    {segment[data2.period]} → {segment[data1.period]} customers
                  </div>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-medium">{segment.change}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card className="p-6">
        <h3 className="mb-4">Detailed Segment Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Segment</th>
                <th className="text-center p-3">{data2.period}</th>
                <th className="text-center p-3">{data1.period}</th>
                <th className="text-center p-3">Change</th>
                <th className="text-center p-3">% Change</th>
                <th className="text-center p-3">Share of Total</th>
              </tr>
            </thead>
            <tbody>
              {segmentComparisonData.map((segment) => {
                const percentChange = ((segment.change / segment[data2.period]) * 100).toFixed(1);
                const shareOfTotal = ((segment[data1.period] / data1.totalCustomers) * 100).toFixed(1);
                const isPositive = segment.change >= 0;
                
                return (
                  <tr key={segment.segment} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Badge style={{ 
                        backgroundColor: segmentColors[segment.segment] + '20',
                        color: segmentColors[segment.segment]
                      }}>
                        {segment.segment}
                      </Badge>
                    </td>
                    <td className="text-center p-3">{segment[data2.period].toLocaleString()}</td>
                    <td className="text-center p-3">{segment[data1.period].toLocaleString()}</td>
                    <td className="text-center p-3">
                      <span className={isPositive ? "text-green-600" : "text-red-600"}>
                        {isPositive ? "+" : ""}{segment.change}
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <span className={isPositive ? "text-green-600" : "text-red-600"}>
                        {isPositive ? "+" : ""}{percentChange}%
                      </span>
                    </td>
                    <td className="text-center p-3">{shareOfTotal}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Key Insights */}
      <Card className="p-6 bg-blue-50">
        <h4 className="mb-4">💡 Period Comparison Insights</h4>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              Customer base {parseFloat(customerChange) >= 0 ? "grew" : "declined"} by {Math.abs(parseFloat(customerChange))}% between periods
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              {topGainers[0].segment} segment showed strongest growth with +{topGainers[0].change} customers
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              Revenue {parseFloat(revenueChange) >= 0 ? "increased" : "decreased"} by {Math.abs(parseFloat(revenueChange))}%, 
              {parseFloat(revenueChange) > parseFloat(customerChange) ? " outpacing" : " lagging"} customer growth
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              Average RFM score {parseFloat(rfmChange) >= 0 ? "improved" : "declined"} by {Math.abs(parseFloat(rfmChange))}%, 
              indicating {parseFloat(rfmChange) >= 0 ? "better" : "weaker"} overall customer engagement
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface SegmentData {
  name: string;
  count: number;
  percentage: number;
  revenue: number;
  color: string;
  description: string;
}

const segments: SegmentData[] = [
  {
    name: "Champions",
    count: 1245,
    percentage: 10,
    revenue: 485000,
    color: "bg-green-500",
    description: "Bought recently, buy often and spend the most"
  },
  {
    name: "Loyal Customers",
    count: 2156,
    percentage: 17.3,
    revenue: 425000,
    color: "bg-blue-500",
    description: "Spend good money with us often. Responsive to promotions"
  },
  {
    name: "Potential Loyalists",
    count: 1823,
    percentage: 14.6,
    revenue: 285000,
    color: "bg-indigo-500",
    description: "Recent customers, but spent a good amount and bought more than once"
  },
  {
    name: "New Customers",
    count: 987,
    percentage: 7.9,
    revenue: 145000,
    color: "bg-purple-500",
    description: "Bought most recently, but not often"
  },
  {
    name: "Promising",
    count: 1456,
    percentage: 11.7,
    revenue: 195000,
    color: "bg-cyan-500",
    description: "Recent shoppers, but haven't spent much"
  },
  {
    name: "Need Attention",
    count: 1654,
    percentage: 13.3,
    revenue: 165000,
    color: "bg-yellow-500",
    description: "Above average recency, frequency and monetary values"
  },
  {
    name: "At Risk",
    count: 1342,
    percentage: 10.8,
    revenue: 225000,
    color: "bg-orange-500",
    description: "Spent big money and purchased often. But long time ago"
  },
  {
    name: "Can't Lose Them",
    count: 856,
    percentage: 6.9,
    revenue: 175000,
    color: "bg-red-500",
    description: "Made biggest purchases, and often. But haven't returned for a long time"
  },
  {
    name: "Hibernating",
    count: 939,
    percentage: 7.5,
    revenue: 95000,
    color: "bg-gray-500",
    description: "Last purchase was long back, low spenders and low number of orders"
  },
];

export function SegmentBreakdown() {
  const totalRevenue = segments.reduce((sum, seg) => sum + seg.revenue, 0);

  return (
    <Card className="p-6">
      <h3 className="mb-4">Detailed Segment Breakdown</h3>
      <p className="text-sm text-gray-600 mb-6">
        Understanding each customer segment and their characteristics
      </p>
      
      <div className="space-y-6">
        {segments.map((segment, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                <span>{segment.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm">{segment.count.toLocaleString()} customers</div>
                <div className="text-xs text-gray-500">${(segment.revenue / 1000).toFixed(0)}K revenue</div>
              </div>
            </div>
            <Progress value={segment.percentage * 10} className="h-2" />
            <p className="text-xs text-gray-600 italic">{segment.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between items-center">
          <span>Total Revenue</span>
          <span className="text-2xl">${(totalRevenue / 1000000).toFixed(2)}M</span>
        </div>
      </div>
    </Card>
  );
}

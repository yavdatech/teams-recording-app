import { Card } from "./ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Calendar } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  prefix?: string;
}

function MetricCard({ title, value, change, icon, prefix = "" }: MetricCardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl mb-2">
            {prefix}{value}
          </p>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function RFMMetricsCards() {
  const metrics = [
    {
      title: "Total Customers",
      value: "12,458",
      change: 12.5,
      icon: <Users className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "Total Revenue",
      value: "1.2M",
      change: 8.3,
      icon: <DollarSign className="w-6 h-6 text-blue-600" />,
      prefix: "$"
    },
    {
      title: "Avg Order Value",
      value: "156",
      change: -2.1,
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />,
      prefix: "$"
    },
    {
      title: "Avg Days Since Purchase",
      value: "42",
      change: 5.2,
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface WaterfallItem {
  category: string;
  value: number;
  type: "positive" | "negative" | "total";
  description: string;
  segments?: string[];
}

const waterfallData: WaterfallItem[] = [
  {
    category: "Starting Revenue",
    value: 980000,
    type: "total",
    description: "Revenue from last quarter (Q3 2024)",
  },
  {
    category: "Champions Growth",
    value: 85000,
    type: "positive",
    description: "Increased spending from Champions segment",
    segments: ["Champions"],
  },
  {
    category: "New Customer Acquisition",
    value: 124000,
    type: "positive",
    description: "Revenue from new customers joining",
    segments: ["New Customers"],
  },
  {
    category: "Loyal Customers Upsell",
    value: 67000,
    type: "positive",
    description: "Cross-sell and upsell to loyal customers",
    segments: ["Loyal Customers"],
  },
  {
    category: "Win-back Success",
    value: 42000,
    type: "positive",
    description: "Recovered revenue from At Risk customers",
    segments: ["At Risk", "Can't Lose Them"],
  },
  {
    category: "At Risk Churn",
    value: -58000,
    type: "negative",
    description: "Lost revenue from customers moving to At Risk",
    segments: ["At Risk"],
  },
  {
    category: "Hibernating Losses",
    value: -32000,
    type: "negative",
    description: "Revenue loss from hibernating customers",
    segments: ["Hibernating"],
  },
  {
    category: "Can't Lose Them Churn",
    value: -28000,
    type: "negative",
    description: "High-value customers lost",
    segments: ["Can't Lose Them"],
  },
  {
    category: "Ending Revenue",
    value: 1200000,
    type: "total",
    description: "Current quarter revenue (Q4 2024)",
  },
];

const segmentImpact = [
  {
    segment: "Champions",
    revenueImpact: 85000,
    customerMovement: 195,
    action: "Increased engagement & VIP program",
  },
  {
    segment: "Loyal Customers",
    revenueImpact: 67000,
    customerMovement: 170,
    action: "Successful cross-sell campaigns",
  },
  {
    segment: "New Customers",
    revenueImpact: 124000,
    customerMovement: 260,
    action: "Effective acquisition strategies",
  },
  {
    segment: "At Risk",
    revenueImpact: -16000, // Net of win-back and churn
    customerMovement: -110,
    action: "Mixed results - need stronger retention",
  },
  {
    segment: "Can't Lose Them",
    revenueImpact: -28000,
    customerMovement: -130,
    action: "Critical churn - urgent intervention needed",
  },
  {
    segment: "Hibernating",
    revenueImpact: -32000,
    customerMovement: -43,
    action: "Expected attrition from inactive customers",
  },
];

export function RevenueWaterfall() {
  const [timePeriod, setTimePeriod] = useState("q4-2024");

  const totalGains = waterfallData
    .filter(item => item.type === "positive")
    .reduce((sum, item) => sum + item.value, 0);

  const totalLosses = waterfallData
    .filter(item => item.type === "negative")
    .reduce((sum, item) => sum + Math.abs(item.value), 0);

  const netChange = totalGains - totalLosses;
  const percentChange = ((netChange / waterfallData[0].value) * 100).toFixed(1);

  // Calculate bar positions for waterfall chart
  let runningTotal = waterfallData[0].value;
  const chartData = waterfallData.map((item, index) => {
    const startValue = runningTotal;
    if (item.type !== "total" && index !== 0) {
      runningTotal += item.value;
    }
    const endValue = item.type === "total" ? item.value : runningTotal;
    
    return {
      ...item,
      startValue,
      endValue,
      displayValue: item.type === "total" ? item.value : Math.abs(item.value),
    };
  });

  const maxValue = Math.max(...chartData.map(d => Math.max(d.startValue, d.endValue)));
  const minValue = Math.min(...chartData.map(d => Math.min(d.startValue, d.endValue)));
  const range = maxValue - minValue;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Net Revenue Change</p>
              <p className="text-3xl mb-1">${(netChange / 1000).toFixed(0)}K</p>
              <div className="flex items-center gap-1">
                {netChange >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+{percentChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">{percentChange}%</span>
                  </>
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Gains</p>
              <p className="text-3xl mb-1">${(totalGains / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-600">From growth initiatives</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ArrowUpCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Losses</p>
              <p className="text-3xl mb-1">${(totalLosses / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-600">From churn and attrition</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <ArrowDownCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ending Revenue</p>
              <p className="text-3xl mb-1">${(chartData[chartData.length - 1].value / 1000000).toFixed(2)}M</p>
              <p className="text-sm text-gray-600">Current period total</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Waterfall Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="mb-1">Revenue Waterfall Analysis</h3>
            <p className="text-sm text-gray-600">Breakdown of revenue changes by segment movements</p>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q4-2024">Q4 2024 vs Q3 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024 vs Q2 2024</SelectItem>
              <SelectItem value="ytd">Year to Date 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Waterfall Visualization */}
        <div className="relative h-96 bg-gray-50 rounded-lg p-6">
          <div className="absolute inset-6 flex items-end justify-between gap-2">
            {chartData.map((item, index) => {
              const height = ((item.displayValue / maxValue) * 100);
              const bottom = item.type === "total" ? 0 : 
                            Math.min(item.startValue, item.endValue) / maxValue * 100;
              
              const isPositive = item.type === "positive";
              const isNegative = item.type === "negative";
              const isTotal = item.type === "total";

              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative">
                  {/* Connector line */}
                  {index > 0 && index < chartData.length - 1 && (
                    <div 
                      className="absolute w-full border-t-2 border-dashed border-gray-300"
                      style={{ 
                        top: `${100 - (chartData[index - 1].endValue / maxValue * 100)}%`,
                        right: '100%',
                      }}
                    />
                  )}
                  
                  {/* Bar */}
                  <div className="w-full flex flex-col items-center" style={{ height: '100%' }}>
                    <div 
                      className={`w-full rounded-t transition-all cursor-pointer ${
                        isTotal ? 'bg-blue-500 hover:bg-blue-600' :
                        isPositive ? 'bg-green-500 hover:bg-green-600' :
                        'bg-red-500 hover:bg-red-600'
                      }`}
                      style={{ 
                        height: `${height}%`,
                        marginTop: `${100 - height - bottom}%`,
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap z-10">
                        <div className="font-medium">{item.category}</div>
                        <div className="text-green-300">
                          {isNegative ? '-' : '+'}${(item.displayValue / 1000).toFixed(0)}K
                        </div>
                        <div className="text-gray-300 text-xs mt-1">{item.description}</div>
                      </div>
                    </div>
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium truncate w-full px-1">
                      {item.category.split(' ')[0]}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isTotal ? 'text-blue-600' :
                      isPositive ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {isTotal ? '$' : isNegative ? '-$' : '+$'}
                      {(item.displayValue / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Segment Impact Breakdown */}
      <Card className="p-6">
        <h3 className="mb-6">Segment Impact Analysis</h3>
        <div className="space-y-4">
          {segmentImpact.map((segment) => {
            const isPositive = segment.revenueImpact >= 0;
            const impactPercent = ((Math.abs(segment.revenueImpact) / totalGains) * 100).toFixed(1);
            
            return (
              <div key={segment.segment} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge className={isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {segment.segment}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}${(segment.revenueImpact / 1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-gray-600">
                      {isPositive ? '+' : ''}{segment.customerMovement} customers
                    </div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(parseFloat(impactPercent), 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-600">Action:</span>
                  <span className="text-gray-900">{segment.action}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Key Insights and Recommendations */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <h4 className="mb-4">💡 Revenue Optimization Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm mb-3">Top Revenue Drivers</h5>
            <div className="space-y-2">
              {waterfallData
                .filter(item => item.type === "positive")
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{item.category}</span>
                    <span className="text-green-600 font-medium">+${(item.value / 1000).toFixed(0)}K</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h5 className="text-sm mb-3">Revenue At Risk</h5>
            <div className="space-y-2">
              {waterfallData
                .filter(item => item.type === "negative")
                .sort((a, b) => a.value - b.value)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                      !
                    </span>
                    <span className="flex-1">{item.category}</span>
                    <span className="text-red-600 font-medium">-${(Math.abs(item.value) / 1000).toFixed(0)}K</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h5 className="text-sm mb-3">Strategic Recommendations</h5>
          <ul className="text-sm space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span className="text-blue-600">→</span>
              <span>Replicate "New Customer Acquisition" success (+${(124000 / 1000).toFixed(0)}K) across all channels</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">→</span>
              <span>Urgent intervention needed for "Can't Lose Them" segment to prevent $28K monthly revenue loss</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">→</span>
              <span>Scale "Win-back Success" program - recovered $42K with potential for 2-3x improvement</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

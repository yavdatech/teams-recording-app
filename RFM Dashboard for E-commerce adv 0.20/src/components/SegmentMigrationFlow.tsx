import { Card } from "./ui/card";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface FlowData {
  from: string;
  to: string;
  value: number;
  color: string;
}

const segmentFlowData: FlowData[] = [
  { from: "Champions", to: "Champions", value: 850, color: "#10b981" },
  { from: "Champions", to: "Loyal Customers", value: 120, color: "#3b82f6" },
  { from: "Champions", to: "At Risk", value: 30, color: "#f97316" },
  
  { from: "Loyal Customers", to: "Champions", value: 180, color: "#10b981" },
  { from: "Loyal Customers", to: "Loyal Customers", value: 1200, color: "#3b82f6" },
  { from: "Loyal Customers", to: "Need Attention", value: 150, color: "#eab308" },
  { from: "Loyal Customers", to: "At Risk", value: 70, color: "#f97316" },
  
  { from: "Potential Loyalists", to: "Loyal Customers", value: 220, color: "#3b82f6" },
  { from: "Potential Loyalists", to: "Potential Loyalists", value: 640, color: "#6366f1" },
  { from: "Potential Loyalists", to: "Need Attention", value: 90, color: "#eab308" },
  
  { from: "At Risk", to: "Loyal Customers", value: 45, color: "#3b82f6" },
  { from: "At Risk", to: "Can't Lose Them", value: 110, color: "#ef4444" },
  { from: "At Risk", to: "At Risk", value: 390, color: "#f97316" },
  { from: "At Risk", to: "Hibernating", value: 85, color: "#6b7280" },
  
  { from: "Need Attention", to: "Loyal Customers", value: 65, color: "#3b82f6" },
  { from: "Need Attention", to: "Need Attention", value: 420, color: "#eab308" },
  { from: "Need Attention", to: "At Risk", value: 95, color: "#f97316" },
  
  { from: "Can't Lose Them", to: "Loyal Customers", value: 35, color: "#3b82f6" },
  { from: "Can't Lose Them", to: "At Risk", value: 55, color: "#f97316" },
  { from: "Can't Lose Them", to: "Can't Lose Them", value: 180, color: "#ef4444" },
  { from: "Can't Lose Them", to: "Hibernating", value: 130, color: "#6b7280" },
  
  { from: "Hibernating", to: "Loyal Customers", value: 15, color: "#3b82f6" },
  { from: "Hibernating", to: "Need Attention", value: 25, color: "#eab308" },
  { from: "Hibernating", to: "Hibernating", value: 510, color: "#6b7280" },
  
  { from: "New Customers", to: "Champions", value: 95, color: "#10b981" },
  { from: "New Customers", to: "Potential Loyalists", value: 280, color: "#6366f1" },
  { from: "New Customers", to: "New Customers", value: 420, color: "#a855f7" },
  { from: "New Customers", to: "Promising", value: 160, color: "#06b6d4" },
];

const segments = [
  "Champions",
  "Loyal Customers", 
  "Potential Loyalists",
  "New Customers",
  "Promising",
  "Need Attention",
  "At Risk",
  "Can't Lose Them",
  "Hibernating"
];

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

export function SegmentMigrationFlow() {
  const [timePeriod, setTimePeriod] = useState("last-quarter");

  // Calculate totals for each segment
  const segmentTotals: Record<string, { inflow: number; outflow: number }> = {};
  segments.forEach(seg => {
    segmentTotals[seg] = { inflow: 0, outflow: 0 };
  });

  segmentFlowData.forEach(flow => {
    segmentTotals[flow.from].outflow += flow.value;
    segmentTotals[flow.to].inflow += flow.value;
  });

  // Calculate key insights
  const topGainers = segments
    .map(seg => ({ 
      segment: seg, 
      net: segmentTotals[seg].inflow - segmentTotals[seg].outflow 
    }))
    .sort((a, b) => b.net - a.net)
    .slice(0, 3);

  const topLosers = segments
    .map(seg => ({ 
      segment: seg, 
      net: segmentTotals[seg].inflow - segmentTotals[seg].outflow 
    }))
    .sort((a, b) => a.net - b.net)
    .slice(0, 3);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="mb-1">Segment Migration Flow</h3>
          <p className="text-sm text-gray-600">Track how customers move between segments over time</p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-quarter">Last Quarter</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sankey-style Flow Visualization */}
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Previous Period */}
          <div>
            <div className="text-sm mb-4 text-center">Previous Period</div>
            <div className="space-y-2">
              {segments.map(segment => {
                const outflow = segmentTotals[segment].outflow;
                const flows = segmentFlowData.filter(f => f.from === segment);
                const retainedPct = flows.find(f => f.from === f.to)?.value || 0;
                const retainedRate = outflow > 0 ? ((retainedPct / outflow) * 100).toFixed(0) : "0";
                
                return (
                  <div key={segment} className="p-3 rounded-lg border" style={{ borderColor: segmentColors[segment] }}>
                    <div className="text-sm mb-1">{segment}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{outflow} customers</span>
                      <span className="text-xs" style={{ color: segmentColors[segment] }}>
                        {retainedRate}% retained
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flow Lines */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-4">Customer Movement</div>
              <div className="space-y-1">
                {segmentFlowData
                  .filter(flow => flow.from !== flow.to && flow.value > 50)
                  .slice(0, 8)
                  .map((flow, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600 truncate w-24 text-right">{flow.from}</span>
                      <div className="flex-1 h-1 rounded" style={{ 
                        backgroundColor: flow.color,
                        opacity: 0.6,
                        width: `${Math.min(flow.value / 3, 100)}px`
                      }} />
                      <span className="text-gray-900">{flow.value}</span>
                      <div className="flex-1 h-1 rounded" style={{ 
                        backgroundColor: flow.color,
                        opacity: 0.6,
                        width: `${Math.min(flow.value / 3, 100)}px`
                      }} />
                      <span className="text-gray-600 truncate w-24">{flow.to}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Current Period */}
          <div>
            <div className="text-sm mb-4 text-center">Current Period</div>
            <div className="space-y-2">
              {segments.map(segment => {
                const inflow = segmentTotals[segment].inflow;
                const outflow = segmentTotals[segment].outflow;
                const net = inflow - outflow;
                const isGrowth = net > 0;
                
                return (
                  <div key={segment} className="p-3 rounded-lg border" style={{ borderColor: segmentColors[segment] }}>
                    <div className="text-sm mb-1">{segment}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{inflow} customers</span>
                      <span className={`text-xs ${isGrowth ? 'text-green-600' : 'text-red-600'}`}>
                        {isGrowth ? '+' : ''}{net}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t">
        <div>
          <h4 className="text-sm mb-3">Top Gainers</h4>
          <div className="space-y-2">
            {topGainers.map(({ segment, net }) => (
              <div key={segment} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">{segment}</span>
                <span className="text-sm text-green-600">+{net}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm mb-3">Top Losers</h4>
          <div className="space-y-2">
            {topLosers.map(({ segment, net }) => (
              <div key={segment} className="flex items-center justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">{segment}</span>
                <span className="text-sm text-red-600">{net}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

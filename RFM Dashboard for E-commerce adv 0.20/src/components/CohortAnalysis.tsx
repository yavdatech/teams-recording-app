import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CohortData {
  cohort: string;
  month0: number;
  month1: number;
  month2: number;
  month3: number;
  month4: number;
  month5: number;
  avgRFM: number;
  clv: number;
  dominantSegment: string;
}

const cohortData: CohortData[] = [
  { 
    cohort: "Jan 2024", 
    month0: 100, month1: 68, month2: 55, month3: 48, month4: 45, month5: 42,
    avgRFM: 4.2, clv: 1850, dominantSegment: "Champions"
  },
  { 
    cohort: "Feb 2024", 
    month0: 100, month1: 72, month2: 58, month3: 51, month4: 47, month5: 0,
    avgRFM: 4.1, clv: 1720, dominantSegment: "Champions"
  },
  { 
    cohort: "Mar 2024", 
    month0: 100, month1: 65, month2: 52, month3: 45, month4: 0, month5: 0,
    avgRFM: 3.8, clv: 1580, dominantSegment: "Loyal Customers"
  },
  { 
    cohort: "Apr 2024", 
    month0: 100, month1: 70, month2: 54, month3: 0, month4: 0, month5: 0,
    avgRFM: 3.9, clv: 1640, dominantSegment: "Loyal Customers"
  },
  { 
    cohort: "May 2024", 
    month0: 100, month1: 64, month2: 0, month3: 0, month4: 0, month5: 0,
    avgRFM: 3.6, clv: 1420, dominantSegment: "Potential Loyalists"
  },
  { 
    cohort: "Jun 2024", 
    month0: 100, month1: 0, month2: 0, month3: 0, month4: 0, month5: 0,
    avgRFM: 3.4, clv: 1280, dominantSegment: "New Customers"
  },
];

const segmentColors: Record<string, string> = {
  "Champions": "bg-green-100 text-green-800",
  "Loyal Customers": "bg-blue-100 text-blue-800",
  "Potential Loyalists": "bg-indigo-100 text-indigo-800",
  "New Customers": "bg-purple-100 text-purple-800",
};

function getRetentionColor(value: number): string {
  if (value >= 60) return "bg-green-100 text-green-800";
  if (value >= 45) return "bg-yellow-100 text-yellow-800";
  if (value >= 30) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

export function CohortAnalysis() {
  const [metric, setMetric] = useState("retention");
  const [viewType, setViewType] = useState("table");

  const avgFirstMonth = cohortData.reduce((sum, c) => sum + c.month1, 0) / cohortData.filter(c => c.month1 > 0).length;
  const avgThirdMonth = cohortData.reduce((sum, c) => sum + c.month3, 0) / cohortData.filter(c => c.month3 > 0).length;
  const bestCohort = cohortData.reduce((best, current) => 
    current.avgRFM > best.avgRFM ? current : best
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="mb-1">Cohort Analysis</h3>
          <p className="text-sm text-gray-600">Track how customer cohorts evolve over time</p>
        </div>
        <div className="flex gap-2">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retention">Retention %</SelectItem>
              <SelectItem value="rfm">Avg RFM Score</SelectItem>
              <SelectItem value="clv">Customer CLV</SelectItem>
            </SelectContent>
          </Select>
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table View</SelectItem>
              <SelectItem value="chart">Chart View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Month 1 Retention</div>
          <div className="text-2xl">{avgFirstMonth.toFixed(0)}%</div>
          <div className="text-xs text-gray-600 mt-1">Avg across cohorts</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Month 3 Retention</div>
          <div className="text-2xl">{avgThirdMonth.toFixed(0)}%</div>
          <div className="text-xs text-gray-600 mt-1">Long-term engagement</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Best Performing Cohort</div>
          <div className="text-2xl">{bestCohort.cohort}</div>
          <div className="text-xs text-gray-600 mt-1">RFM Score: {bestCohort.avgRFM}</div>
        </div>
      </div>

      {viewType === "table" ? (
        <>
          {/* Retention Table */}
          {metric === "retention" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Cohort</th>
                    <th className="text-center p-3">Month 0</th>
                    <th className="text-center p-3">Month 1</th>
                    <th className="text-center p-3">Month 2</th>
                    <th className="text-center p-3">Month 3</th>
                    <th className="text-center p-3">Month 4</th>
                    <th className="text-center p-3">Month 5</th>
                    <th className="text-left p-3">Dominant Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((cohort) => (
                    <tr key={cohort.cohort} className="border-b hover:bg-gray-50">
                      <td className="p-3">{cohort.cohort}</td>
                      <td className="text-center p-3">
                        <span className="px-2 py-1 rounded bg-gray-100">100%</span>
                      </td>
                      {[cohort.month1, cohort.month2, cohort.month3, cohort.month4, cohort.month5].map((val, idx) => (
                        <td key={idx} className="text-center p-3">
                          {val > 0 ? (
                            <span className={`px-2 py-1 rounded ${getRetentionColor(val)}`}>
                              {val}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      ))}
                      <td className="p-3">
                        <Badge className={segmentColors[cohort.dominantSegment]}>
                          {cohort.dominantSegment}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* RFM Score Table */}
          {metric === "rfm" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Cohort</th>
                    <th className="text-center p-3">Avg RFM Score</th>
                    <th className="text-center p-3">Month 1 Retention</th>
                    <th className="text-center p-3">Current CLV</th>
                    <th className="text-left p-3">Dominant Segment</th>
                    <th className="text-center p-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((cohort, idx) => {
                    const prevCohort = cohortData[idx - 1];
                    const rfmChange = prevCohort ? cohort.avgRFM - prevCohort.avgRFM : 0;
                    const isImproving = rfmChange > 0;
                    
                    return (
                      <tr key={cohort.cohort} className="border-b hover:bg-gray-50">
                        <td className="p-3">{cohort.cohort}</td>
                        <td className="text-center p-3">
                          <span className="px-3 py-1 rounded bg-blue-100 text-blue-800">
                            {cohort.avgRFM.toFixed(1)}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          {cohort.month1 > 0 ? `${cohort.month1}%` : '-'}
                        </td>
                        <td className="text-center p-3">${cohort.clv.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge className={segmentColors[cohort.dominantSegment]}>
                            {cohort.dominantSegment}
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          {idx > 0 && (
                            <div className="flex items-center justify-center gap-1">
                              {isImproving ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                              <span className={`text-xs ${isImproving ? 'text-green-600' : 'text-red-600'}`}>
                                {isImproving ? '+' : ''}{rfmChange.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CLV Table */}
          {metric === "clv" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Cohort</th>
                    <th className="text-center p-3">Customer Lifetime Value</th>
                    <th className="text-center p-3">Avg RFM Score</th>
                    <th className="text-center p-3">Month 3 Retention</th>
                    <th className="text-left p-3">Dominant Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((cohort) => (
                    <tr key={cohort.cohort} className="border-b hover:bg-gray-50">
                      <td className="p-3">{cohort.cohort}</td>
                      <td className="text-center p-3">
                        <span className="px-3 py-1 rounded bg-green-100 text-green-800">
                          ${cohort.clv.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center p-3">{cohort.avgRFM.toFixed(1)}</td>
                      <td className="text-center p-3">
                        {cohort.month3 > 0 ? `${cohort.month3}%` : '-'}
                      </td>
                      <td className="p-3">
                        <Badge className={segmentColors[cohort.dominantSegment]}>
                          {cohort.dominantSegment}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Chart View */
        <div className="space-y-4">
          {cohortData.map((cohort) => {
            const retention = [cohort.month1, cohort.month2, cohort.month3, cohort.month4, cohort.month5].filter(v => v > 0);
            
            return (
              <div key={cohort.cohort} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{cohort.cohort}</span>
                  <Badge className={segmentColors[cohort.dominantSegment]}>
                    {cohort.dominantSegment}
                  </Badge>
                </div>
                <div className="flex gap-1 h-12 items-end">
                  {retention.map((val, idx) => (
                    <div key={idx} className="flex-1 relative group">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${val}%` }}
                      />
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Month {idx + 1}: {val}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm mb-2">💡 Key Insights</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• {bestCohort.cohort} cohort shows strongest performance with {bestCohort.avgRFM.toFixed(1)} avg RFM score</li>
          <li>• Average first-month retention of {avgFirstMonth.toFixed(0)}% indicates strong initial engagement</li>
          <li>• By month 3, {avgThirdMonth.toFixed(0)}% retention suggests good product-market fit</li>
        </ul>
      </div>
    </Card>
  );
}

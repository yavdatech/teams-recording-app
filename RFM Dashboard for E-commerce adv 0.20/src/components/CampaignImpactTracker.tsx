import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { TrendingUp, TrendingDown, Target, Mail, DollarSign, Users, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Campaign {
  id: string;
  name: string;
  targetSegment: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "scheduled";
  beforeRFM: { r: number; f: number; m: number };
  afterRFM: { r: number; f: number; m: number };
  responseRate: number;
  revenue: number;
  cost: number;
  roi: number;
  conversions: number;
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Champions VIP Program",
    targetSegment: "Champions",
    startDate: "Oct 1, 2024",
    endDate: "Oct 31, 2024",
    status: "completed",
    beforeRFM: { r: 4.8, f: 4.9, m: 4.7 },
    afterRFM: { r: 4.9, f: 5.0, m: 4.9 },
    responseRate: 78,
    revenue: 285000,
    cost: 15000,
    roi: 1800,
    conversions: 342
  },
  {
    id: "2",
    name: "At Risk Win-Back",
    targetSegment: "At Risk",
    startDate: "Sep 15, 2024",
    endDate: "Oct 15, 2024",
    status: "completed",
    beforeRFM: { r: 2.1, f: 3.8, m: 3.5 },
    afterRFM: { r: 3.2, f: 4.1, m: 3.8 },
    responseRate: 34,
    revenue: 142000,
    cost: 28000,
    roi: 407,
    conversions: 186
  },
  {
    id: "3",
    name: "New Customer Onboarding",
    targetSegment: "New Customers",
    startDate: "Oct 10, 2024",
    endDate: "Nov 10, 2024",
    status: "active",
    beforeRFM: { r: 4.5, f: 1.2, m: 2.1 },
    afterRFM: { r: 4.6, f: 1.8, m: 2.6 },
    responseRate: 52,
    revenue: 89000,
    cost: 12000,
    roi: 642,
    conversions: 245
  },
  {
    id: "4",
    name: "Hibernating Reactivation",
    targetSegment: "Hibernating",
    startDate: "Sep 1, 2024",
    endDate: "Sep 30, 2024",
    status: "completed",
    beforeRFM: { r: 1.1, f: 1.3, m: 1.2 },
    afterRFM: { r: 2.8, f: 1.9, m: 1.8 },
    responseRate: 12,
    revenue: 34000,
    cost: 8000,
    roi: 325,
    conversions: 78
  },
  {
    id: "5",
    name: "Loyal Customer Cross-Sell",
    targetSegment: "Loyal Customers",
    startDate: "Nov 1, 2024",
    endDate: "Nov 30, 2024",
    status: "scheduled",
    beforeRFM: { r: 4.2, f: 4.8, m: 4.3 },
    afterRFM: { r: 4.2, f: 4.8, m: 4.3 },
    responseRate: 0,
    revenue: 0,
    cost: 18000,
    roi: 0,
    conversions: 0
  },
];

const segmentColors: Record<string, string> = {
  "Champions": "bg-green-100 text-green-800",
  "Loyal Customers": "bg-blue-100 text-blue-800",
  "New Customers": "bg-purple-100 text-purple-800",
  "At Risk": "bg-orange-100 text-orange-800",
  "Hibernating": "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  "active": "bg-blue-100 text-blue-800",
  "completed": "bg-green-100 text-green-800",
  "scheduled": "bg-gray-100 text-gray-800",
};

export function CampaignImpactTracker() {
  const [selectedCampaign, setSelectedCampaign] = useState(campaigns[0].id);
  const [filterStatus, setFilterStatus] = useState("all");

  const campaign = campaigns.find(c => c.id === selectedCampaign) || campaigns[0];
  
  const filteredCampaigns = campaigns.filter(c => 
    filterStatus === "all" || c.status === filterStatus
  );

  const totalRevenue = campaigns.filter(c => c.status === "completed").reduce((sum, c) => sum + c.revenue, 0);
  const totalCost = campaigns.filter(c => c.status === "completed").reduce((sum, c) => sum + c.cost, 0);
  const avgROI = campaigns.filter(c => c.status === "completed").reduce((sum, c) => sum + c.roi, 0) / campaigns.filter(c => c.status === "completed").length;

  // Prepare data for comparison chart
  const comparisonData = [
    {
      metric: "Recency",
      before: campaign.beforeRFM.r,
      after: campaign.afterRFM.r,
    },
    {
      metric: "Frequency",
      before: campaign.beforeRFM.f,
      after: campaign.afterRFM.f,
    },
    {
      metric: "Monetary",
      before: campaign.beforeRFM.m,
      after: campaign.afterRFM.m,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Campaign Revenue</p>
              <p className="text-3xl mb-1">${(totalRevenue / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-600">From completed campaigns</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average ROI</p>
              <p className="text-3xl mb-1">{avgROI.toFixed(0)}%</p>
              <p className="text-sm text-gray-600">Across all campaigns</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
              <p className="text-3xl mb-1">{campaigns.filter(c => c.status === "active").length}</p>
              <p className="text-sm text-gray-600">Currently running</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Campaign Details */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3>Campaign Performance Analysis</h3>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Campaign List */}
        <div className="space-y-3 mb-6">
          {filteredCampaigns.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCampaign(c.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCampaign === c.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-sm">{c.name}</h4>
                    <Badge className={segmentColors[c.targetSegment]}>{c.targetSegment}</Badge>
                    <Badge className={statusColors[c.status]}>{c.status}</Badge>
                  </div>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Period</p>
                      <p>{c.startDate}</p>
                    </div>
                    {c.status !== "scheduled" && (
                      <>
                        <div>
                          <p className="text-gray-600">Response Rate</p>
                          <p>{c.responseRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Revenue</p>
                          <p>${(c.revenue / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-gray-600">ROI</p>
                          <p className="text-green-600">{c.roi}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Conversions</p>
                          <p>{c.conversions}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Analysis for Selected Campaign */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before/After RFM Comparison */}
        <Card className="p-6">
          <h3 className="mb-4">Before/After RFM Analysis</h3>
          <p className="text-sm text-gray-600 mb-6">{campaign.name}</p>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="before" fill="#94a3b8" name="Before Campaign" />
              <Bar dataKey="after" fill="#3b82f6" name="After Campaign" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {["Recency", "Frequency", "Monetary"].map((metric, idx) => {
              const before = Object.values(campaign.beforeRFM)[idx];
              const after = Object.values(campaign.afterRFM)[idx];
              const change = ((after - before) / before * 100).toFixed(1);
              const isPositive = after > before;
              
              return (
                <div key={metric} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">{metric}</p>
                  <div className="flex items-center justify-center gap-1">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-gray-600'}`}>
                      {isPositive ? '+' : ''}{change}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6">
          <h3 className="mb-4">Campaign Performance Metrics</h3>
          <p className="text-sm text-gray-600 mb-6">{campaign.name}</p>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Response Rate</span>
                <span className="text-xl">{campaign.responseRate}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${campaign.responseRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Revenue Generated</p>
                <p className="text-2xl">${(campaign.revenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-600 mt-1">Campaign cost: ${(campaign.cost / 1000).toFixed(0)}K</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Return on Investment</p>
                <p className="text-2xl text-green-600">{campaign.roi}%</p>
                <p className="text-xs text-gray-600 mt-1">{campaign.conversions} conversions</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Customer Engagement</p>
                  <p className="text-xl">{campaign.conversions} customers</p>
                </div>
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            {campaign.status === "completed" && (
              <div className="pt-4 border-t">
                <h4 className="text-sm mb-3">Key Learnings</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{campaign.responseRate > 50 ? "Strong response rate indicates effective messaging" : "Consider optimizing offer and messaging"}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>RFM improvements show {campaign.afterRFM.f > campaign.beforeRFM.f ? "increased" : "stable"} purchase frequency</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>ROI of {campaign.roi}% {campaign.roi > 400 ? "exceeds" : "meets"} target threshold</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Segment Performance Summary */}
      <Card className="p-6">
        <h3 className="mb-4">Campaign Performance by Segment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from(new Set(campaigns.map(c => c.targetSegment))).map(segment => {
            const segmentCampaigns = campaigns.filter(c => c.targetSegment === segment && c.status === "completed");
            const avgResponse = segmentCampaigns.reduce((sum, c) => sum + c.responseRate, 0) / (segmentCampaigns.length || 1);
            const totalRev = segmentCampaigns.reduce((sum, c) => sum + c.revenue, 0);
            
            return (
              <div key={segment} className="p-4 border rounded-lg">
                <Badge className={`${segmentColors[segment]} mb-2`}>{segment}</Badge>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Avg Response</p>
                    <p>{avgResponse.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Revenue</p>
                    <p>${(totalRev / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Campaigns</p>
                    <p>{segmentCampaigns.length}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

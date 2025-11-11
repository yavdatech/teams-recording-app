import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useState } from "react";
import { Mail, MousePointer, Eye, Share2, Heart, TrendingUp, TrendingDown } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

interface RFMEScore {
  segment: string;
  recency: number;
  frequency: number;
  monetary: number;
  engagement: number;
  rfmeScore: number;
  customerCount: number;
  emailOpenRate: number;
  clickRate: number;
  websiteVisits: number;
  socialEngagement: number;
  avgSessionDuration: number; // minutes
}

const rfmeData: RFMEScore[] = [
  {
    segment: "Champions",
    recency: 4.8,
    frequency: 4.9,
    monetary: 4.7,
    engagement: 4.6,
    rfmeScore: 4.75,
    customerCount: 1245,
    emailOpenRate: 68,
    clickRate: 42,
    websiteVisits: 18,
    socialEngagement: 85,
    avgSessionDuration: 12.5,
  },
  {
    segment: "Loyal Customers",
    recency: 4.2,
    frequency: 4.8,
    monetary: 4.3,
    engagement: 4.1,
    rfmeScore: 4.35,
    customerCount: 2890,
    emailOpenRate: 58,
    clickRate: 35,
    websiteVisits: 14,
    socialEngagement: 72,
    avgSessionDuration: 9.8,
  },
  {
    segment: "Potential Loyalists",
    recency: 4.5,
    frequency: 3.2,
    monetary: 3.1,
    engagement: 3.8,
    rfmeScore: 3.65,
    customerCount: 2150,
    emailOpenRate: 52,
    clickRate: 28,
    websiteVisits: 11,
    socialEngagement: 65,
    avgSessionDuration: 7.2,
  },
  {
    segment: "New Customers",
    recency: 4.8,
    frequency: 1.5,
    monetary: 2.1,
    engagement: 3.2,
    rfmeScore: 2.9,
    customerCount: 1680,
    emailOpenRate: 48,
    clickRate: 22,
    websiteVisits: 8,
    socialEngagement: 58,
    avgSessionDuration: 5.5,
  },
  {
    segment: "Need Attention",
    recency: 3.2,
    frequency: 3.8,
    monetary: 3.3,
    engagement: 2.4,
    rfmeScore: 3.18,
    customerCount: 1420,
    emailOpenRate: 32,
    clickRate: 15,
    websiteVisits: 5,
    socialEngagement: 38,
    avgSessionDuration: 4.2,
  },
  {
    segment: "At Risk",
    recency: 2.1,
    frequency: 3.8,
    monetary: 3.5,
    engagement: 1.8,
    rfmeScore: 2.8,
    customerCount: 1340,
    emailOpenRate: 22,
    clickRate: 8,
    websiteVisits: 2,
    socialEngagement: 25,
    avgSessionDuration: 2.8,
  },
  {
    segment: "Can't Lose Them",
    recency: 1.5,
    frequency: 4.2,
    monetary: 4.1,
    engagement: 1.2,
    rfmeScore: 2.75,
    customerCount: 520,
    emailOpenRate: 18,
    clickRate: 5,
    websiteVisits: 1,
    socialEngagement: 15,
    avgSessionDuration: 1.5,
  },
  {
    segment: "Hibernating",
    recency: 1.1,
    frequency: 1.3,
    monetary: 1.2,
    engagement: 0.5,
    rfmeScore: 1.03,
    customerCount: 323,
    emailOpenRate: 8,
    clickRate: 2,
    websiteVisits: 0.5,
    socialEngagement: 5,
    avgSessionDuration: 0.8,
  },
];

const engagementChannels = [
  {
    channel: "Email",
    icon: Mail,
    metrics: ["Open Rate", "Click Rate", "Conversion Rate"],
    color: "#3b82f6",
  },
  {
    channel: "Website",
    icon: MousePointer,
    metrics: ["Visit Frequency", "Session Duration", "Pages/Visit"],
    color: "#10b981",
  },
  {
    channel: "Social Media",
    icon: Share2,
    metrics: ["Likes", "Shares", "Comments"],
    color: "#a855f7",
  },
  {
    channel: "Product Views",
    icon: Eye,
    metrics: ["Views", "Wishlist Adds", "Reviews"],
    color: "#f59e0b",
  },
];

const segmentColors: Record<string, string> = {
  "Champions": "bg-green-100 text-green-800",
  "Loyal Customers": "bg-blue-100 text-blue-800",
  "Potential Loyalists": "bg-indigo-100 text-indigo-800",
  "New Customers": "bg-purple-100 text-purple-800",
  "Need Attention": "bg-yellow-100 text-yellow-800",
  "At Risk": "bg-orange-100 text-orange-800",
  "Can't Lose Them": "bg-red-100 text-red-800",
  "Hibernating": "bg-gray-100 text-gray-800",
};

export function EngagementMetrics() {
  const [selectedSegment, setSelectedSegment] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState("overview");

  const filteredData = selectedSegment === "all" 
    ? rfmeData 
    : rfmeData.filter(d => d.segment === selectedSegment);

  const avgEngagement = rfmeData.reduce((sum, d) => sum + d.engagement, 0) / rfmeData.length;
  const avgRFME = rfmeData.reduce((sum, d) => sum + d.rfmeScore, 0) / rfmeData.length;
  const highEngagementSegments = rfmeData.filter(d => d.engagement > avgEngagement).length;

  // Prepare radar chart data
  const radarData = selectedSegment === "all"
    ? [
        { metric: "Recency", value: rfmeData.reduce((sum, d) => sum + d.recency, 0) / rfmeData.length },
        { metric: "Frequency", value: rfmeData.reduce((sum, d) => sum + d.frequency, 0) / rfmeData.length },
        { metric: "Monetary", value: rfmeData.reduce((sum, d) => sum + d.monetary, 0) / rfmeData.length },
        { metric: "Engagement", value: avgEngagement },
      ]
    : [
        { metric: "Recency", value: filteredData[0]?.recency || 0 },
        { metric: "Frequency", value: filteredData[0]?.frequency || 0 },
        { metric: "Monetary", value: filteredData[0]?.monetary || 0 },
        { metric: "Engagement", value: filteredData[0]?.engagement || 0 },
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-1">RFME Analysis (Recency, Frequency, Monetary, Engagement)</h3>
            <p className="text-sm text-gray-600">
              Enhanced RFM scoring with customer engagement metrics across multiple channels
            </p>
          </div>
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              {rfmeData.map(d => (
                <SelectItem key={d.segment} value={d.segment}>{d.segment}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Engagement Score</p>
              <p className="text-3xl mb-1">{avgEngagement.toFixed(1)}</p>
              <p className="text-sm text-gray-600">out of 5.0</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg RFME Score</p>
              <p className="text-3xl mb-1">{avgRFME.toFixed(2)}</p>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+8.5% vs RFM only</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">High Engagement Segments</p>
              <p className="text-3xl mb-1">{highEngagementSegments}</p>
              <p className="text-sm text-gray-600">Above average</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Share2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Email Avg Open Rate</p>
              <p className="text-3xl mb-1">
                {(rfmeData.reduce((sum, d) => sum + d.emailOpenRate, 0) / rfmeData.length).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">Across all segments</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* RFME Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="p-6">
          <h3 className="mb-6">
            RFME Dimensions {selectedSegment !== "all" && `- ${selectedSegment}`}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 5]} />
              <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <strong>Insight:</strong> Engagement dimension adds critical context to traditional RFM scoring. 
              {selectedSegment !== "all" 
                ? ` ${selectedSegment} shows ${filteredData[0]?.engagement > 3.5 ? "strong" : "moderate"} engagement levels.`
                : " Overall engagement scores reveal customer interest beyond purchase behavior."
              }
            </p>
          </div>
        </Card>

        {/* Scatter Plot: Monetary vs Engagement */}
        <Card className="p-6">
          <h3 className="mb-6">Monetary Value vs Engagement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="engagement" name="Engagement" domain={[0, 5]} />
              <YAxis dataKey="monetary" name="Monetary" domain={[0, 5]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Segments" data={filteredData} fill="#8b5cf6">
                {filteredData.map((entry, index) => (
                  <circle key={index} r={Math.sqrt(entry.customerCount) / 3} fill="#8b5cf6" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm">
              <strong>Insight:</strong> Circle size represents customer count. High monetary + high engagement 
              segments (top-right) are ideal targets for premium offerings and VIP programs.
            </p>
          </div>
        </Card>
      </div>

      {/* Engagement Channels Breakdown */}
      <Card className="p-6">
        <h3 className="mb-6">Engagement by Channel</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {engagementChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.channel} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: channel.color + '20' }}>
                    <Icon className="w-5 h-5" style={{ color: channel.color }} />
                  </div>
                  <h4 className="text-sm">{channel.channel}</h4>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {channel.metrics.map(metric => (
                    <li key={metric}>• {metric}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detailed Segment Analysis */}
      <Card className="p-6">
        <h3 className="mb-6">Detailed RFME Breakdown by Segment</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Segment</th>
                <th className="text-center p-3">R</th>
                <th className="text-center p-3">F</th>
                <th className="text-center p-3">M</th>
                <th className="text-center p-3">E</th>
                <th className="text-center p-3">RFME</th>
                <th className="text-center p-3">Email Open %</th>
                <th className="text-center p-3">Click %</th>
                <th className="text-center p-3">Website Visits/mo</th>
                <th className="text-center p-3">Social Eng %</th>
                <th className="text-center p-3">Customers</th>
              </tr>
            </thead>
            <tbody>
              {rfmeData.map((segment) => {
                const engagementTrend = segment.engagement > avgEngagement ? "up" : "down";
                
                return (
                  <tr 
                    key={segment.segment} 
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      selectedSegment === segment.segment ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedSegment(segment.segment)}
                  >
                    <td className="p-3">
                      <Badge className={segmentColors[segment.segment]}>
                        {segment.segment}
                      </Badge>
                    </td>
                    <td className="text-center p-3">{segment.recency.toFixed(1)}</td>
                    <td className="text-center p-3">{segment.frequency.toFixed(1)}</td>
                    <td className="text-center p-3">{segment.monetary.toFixed(1)}</td>
                    <td className="text-center p-3">
                      <div className="flex items-center justify-center gap-1">
                        <span>{segment.engagement.toFixed(1)}</span>
                        {engagementTrend === "up" ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {segment.rfmeScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center p-3">{segment.emailOpenRate}%</td>
                    <td className="text-center p-3">{segment.clickRate}%</td>
                    <td className="text-center p-3">{segment.websiteVisits}</td>
                    <td className="text-center p-3">{segment.socialEngagement}%</td>
                    <td className="text-center p-3">{segment.customerCount.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Engagement Improvement Strategies */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h4 className="mb-4">🚀 Engagement Improvement Strategies</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <h5 className="text-sm">Email Engagement</h5>
            </div>
            <ul className="text-sm space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>Personalize subject lines based on RFME score</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>A/B test send times for each segment</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>Create segment-specific content strategies</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <MousePointer className="w-5 h-5 text-green-600" />
              <h5 className="text-sm">Website Engagement</h5>
            </div>
            <ul className="text-sm space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Deploy personalized homepage experiences</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Implement exit-intent popups for low-E segments</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Add interactive product explorers</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5 text-purple-600" />
              <h5 className="text-sm">Social Engagement</h5>
            </div>
            <ul className="text-sm space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Create user-generated content campaigns</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Launch influencer partnerships for high-E segments</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Incentivize reviews and social shares</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Key Findings */}
      <Card className="p-6">
        <h4 className="mb-4">📊 Key Findings: RFM vs RFME</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm mb-3">Why Engagement Matters</h5>
            <ul className="text-sm space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Engagement predicts future purchase behavior better than past purchases alone</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Low-E + High-M customers are at risk despite spending history</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>High-E + Low-M customers show growth potential</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>RFME scoring improves segmentation accuracy by 23%</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm mb-3">Action Priorities</h5>
            <div className="space-y-2">
              <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                <p className="text-sm"><strong>Urgent:</strong> Re-engage "Can't Lose Them" - High M, Low E (1.2)</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                <p className="text-sm"><strong>Important:</strong> Nurture "Need Attention" - Declining E score (2.4)</p>
              </div>
              <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                <p className="text-sm"><strong>Opportunity:</strong> Convert "Potential Loyalists" - Strong E (3.8)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

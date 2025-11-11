import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { TrendingUp, AlertTriangle, Zap, DollarSign, Target, Brain } from "lucide-react";

interface SegmentPrediction {
  segment: string;
  avgCLV: number;
  churnRisk: number;
  nextBestAction: string;
  revenueProjection: number;
  conversionProbability: number;
  recommendedOffer: string;
}

const segmentPredictions: SegmentPrediction[] = [
  {
    segment: "Champions",
    avgCLV: 4850,
    churnRisk: 8,
    nextBestAction: "VIP Loyalty Program Invitation",
    revenueProjection: 1250000,
    conversionProbability: 78,
    recommendedOffer: "Exclusive early access to new products"
  },
  {
    segment: "Loyal Customers",
    avgCLV: 3420,
    churnRisk: 15,
    nextBestAction: "Cross-sell complementary products",
    revenueProjection: 890000,
    conversionProbability: 65,
    recommendedOffer: "Bundle discount (15% off)"
  },
  {
    segment: "Potential Loyalists",
    avgCLV: 1560,
    churnRisk: 28,
    nextBestAction: "Engagement campaign with personalized recommendations",
    revenueProjection: 425000,
    conversionProbability: 52,
    recommendedOffer: "Free shipping on next 2 orders"
  },
  {
    segment: "At Risk",
    avgCLV: 2890,
    churnRisk: 67,
    nextBestAction: "Win-back campaign with special incentive",
    revenueProjection: 180000,
    conversionProbability: 34,
    recommendedOffer: "25% discount + personalized outreach"
  },
  {
    segment: "Can't Lose Them",
    avgCLV: 2340,
    churnRisk: 82,
    nextBestAction: "Urgent retention campaign",
    revenueProjection: 95000,
    conversionProbability: 28,
    recommendedOffer: "50% win-back offer + account manager call"
  },
  {
    segment: "Hibernating",
    avgCLV: 230,
    churnRisk: 91,
    nextBestAction: "Low-cost reactivation email series",
    revenueProjection: 45000,
    conversionProbability: 12,
    recommendedOffer: "One-time 60% discount code"
  },
  {
    segment: "New Customers",
    avgCLV: 450,
    churnRisk: 35,
    nextBestAction: "Onboarding sequence with education content",
    revenueProjection: 320000,
    conversionProbability: 48,
    recommendedOffer: "Second purchase discount (20% off)"
  },
  {
    segment: "Need Attention",
    avgCLV: 1890,
    churnRisk: 45,
    nextBestAction: "Re-engagement campaign with value demonstration",
    revenueProjection: 265000,
    conversionProbability: 41,
    recommendedOffer: "Product recommendations + 10% off"
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

function getRiskColor(risk: number): string {
  if (risk < 25) return "text-green-600";
  if (risk < 50) return "text-yellow-600";
  if (risk < 75) return "text-orange-600";
  return "text-red-600";
}

function getRiskLevel(risk: number): string {
  if (risk < 25) return "Low";
  if (risk < 50) return "Moderate";
  if (risk < 75) return "High";
  return "Critical";
}

export function PredictiveAnalytics() {
  const totalProjectedRevenue = segmentPredictions.reduce((sum, seg) => sum + seg.revenueProjection, 0);
  const highRiskSegments = segmentPredictions.filter(seg => seg.churnRisk > 50);
  const highOpportunitySegments = segmentPredictions.filter(seg => seg.conversionProbability > 50);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Q4 Revenue Projection</p>
              <p className="text-3xl mb-1">${(totalProjectedRevenue / 1000000).toFixed(2)}M</p>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+18.5% vs Q3</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">High Risk Segments</p>
              <p className="text-3xl mb-1">{highRiskSegments.length}</p>
              <p className="text-sm text-orange-600">Require immediate attention</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">High Opportunity Segments</p>
              <p className="text-3xl mb-1">{highOpportunitySegments.length}</p>
              <p className="text-sm text-blue-600">Strong conversion potential</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Predictions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3>AI-Powered Segment Predictions</h3>
        </div>

        <div className="space-y-6">
          {segmentPredictions.map((prediction) => (
            <div key={prediction.segment} className="border-b pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={segmentColors[prediction.segment]}>
                      {prediction.segment}
                    </Badge>
                    <span className={`text-sm ${getRiskColor(prediction.churnRisk)}`}>
                      {getRiskLevel(prediction.churnRisk)} Churn Risk ({prediction.churnRisk}%)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-gray-600">Avg Customer Lifetime Value</p>
                      <p className="text-xl">${prediction.avgCLV.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Q4 Revenue Projection</p>
                      <p className="text-xl">${(prediction.revenueProjection / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Next Best Action */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <p className="text-sm">Next Best Action</p>
                  </div>
                  <p className="text-sm mb-3">{prediction.nextBestAction}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Conversion Probability</span>
                      <span className="font-medium">{prediction.conversionProbability}%</span>
                    </div>
                    <Progress value={prediction.conversionProbability} className="h-2" />
                  </div>
                </div>

                {/* Recommended Offer */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <p className="text-sm">Recommended Offer</p>
                  </div>
                  <p className="text-sm mb-3">{prediction.recommendedOffer}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Expected ROI:</span>
                    <span className="text-sm font-medium text-green-600">
                      {(prediction.conversionProbability * 4).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <h4 className="mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Strategic Recommendations
        </h4>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
              1
            </div>
            <div>
              <p className="text-sm mb-1">
                <strong>Urgent:</strong> Focus on "Can't Lose Them" segment with 82% churn risk
              </p>
              <p className="text-sm text-gray-600">
                Potential revenue at risk: $95,000. Immediate personalized outreach recommended.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
              2
            </div>
            <div>
              <p className="text-sm mb-1">
                <strong>High ROI Opportunity:</strong> Champions segment shows 78% conversion probability
              </p>
              <p className="text-sm text-gray-600">
                VIP program could generate additional $250K in Q4. Start with top 100 customers.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
              3
            </div>
            <div>
              <p className="text-sm mb-1">
                <strong>Growth Opportunity:</strong> New Customers segment needs better onboarding
              </p>
              <p className="text-sm text-gray-600">
                48% conversion probability can be improved to 65%+ with automated education sequences.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
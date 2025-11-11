import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  AlertCircle, 
  TrendingUp, 
  Target, 
  Mail, 
  Gift, 
  Bell,
  Zap,
  Heart
} from "lucide-react";

interface InsightItem {
  type: "critical" | "warning" | "success" | "info";
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
}

const insights: InsightItem[] = [
  {
    type: "critical",
    icon: <AlertCircle className="w-4 h-4" />,
    title: "856 High-Value Customers at Risk",
    description: "These customers haven't purchased in 60+ days but have high lifetime value. Immediate action needed.",
    action: "Launch Win-Back Campaign",
    priority: "high"
  },
  {
    type: "warning",
    icon: <Bell className="w-4 h-4" />,
    title: "1,342 Customers Need Attention",
    description: "Purchase frequency declining. Send personalized offers to re-engage.",
    action: "Create Re-engagement Flow",
    priority: "high"
  },
  {
    type: "success",
    icon: <TrendingUp className="w-4 h-4" />,
    title: "Champions Growing 12.5%",
    description: "Your best customers are growing. Consider a VIP loyalty program.",
    action: "Build VIP Program",
    priority: "medium"
  },
  {
    type: "info",
    icon: <Heart className="w-4 h-4" />,
    title: "987 New Customers This Month",
    description: "Welcome new customers with onboarding sequence to boost retention.",
    action: "Setup Onboarding Email",
    priority: "medium"
  },
  {
    type: "warning",
    icon: <Gift className="w-4 h-4" />,
    title: "1,456 Promising Customers",
    description: "Recent purchasers with potential. Incentivize second purchase within 30 days.",
    action: "Send Discount Code",
    priority: "medium"
  },
  {
    type: "info",
    icon: <Target className="w-4 h-4" />,
    title: "Potential Loyalists Segment",
    description: "1,823 customers ready to become loyal. Focus on customer service excellence.",
    action: "Review Service Touchpoints",
    priority: "low"
  }
];

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800"
};

const typeVariants = {
  critical: "border-red-200 bg-red-50",
  warning: "border-yellow-200 bg-yellow-50",
  success: "border-green-200 bg-green-50",
  info: "border-blue-200 bg-blue-50"
};

export function InsightsPanel() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="mb-1">Actionable Insights</h3>
          <p className="text-sm text-gray-600">AI-powered recommendations for your customer segments</p>
        </div>
        <Zap className="w-5 h-5 text-yellow-500" />
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <Alert key={index} className={typeVariants[insight.type]}>
            <div className="flex items-start gap-3">
              <div className="mt-1">{insight.icon}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <AlertDescription className="mb-0">
                    {insight.title}
                  </AlertDescription>
                  <Badge className={priorityColors[insight.priority]}>
                    {insight.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  {insight.description}
                </p>
                <Button size="sm" variant="outline" className="gap-2">
                  <Mail className="w-3 h-3" />
                  {insight.action}
                </Button>
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
}

import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Calendar, DollarSign, ShoppingBag } from "lucide-react";

interface JourneyEvent {
  date: string;
  segment: string;
  rfmScore: string;
  event: string;
  revenue?: number;
  description: string;
}

interface CustomerJourneyData {
  id: string;
  name: string;
  email: string;
  signupDate: string;
  currentSegment: string;
  totalSpent: number;
  orderCount: number;
  journey: JourneyEvent[];
}

const customerJourneys: CustomerJourneyData[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    signupDate: "Jan 15, 2024",
    currentSegment: "Champions",
    totalSpent: 4850,
    orderCount: 12,
    journey: [
      { date: "Jan 15, 2024", segment: "New Customers", rfmScore: "511", event: "First Purchase", revenue: 125, description: "Signed up and made first purchase of running shoes" },
      { date: "Jan 28, 2024", segment: "New Customers", rfmScore: "522", event: "Second Purchase", revenue: 89, description: "Purchased fitness accessories" },
      { date: "Feb 12, 2024", segment: "Potential Loyalists", rfmScore: "533", event: "Third Purchase", revenue: 245, description: "Bought premium yoga mat set" },
      { date: "Mar 5, 2024", segment: "Loyal Customers", rfmScore: "544", event: "Fourth Purchase", revenue: 320, description: "Large order of athletic wear" },
      { date: "Mar 20, 2024", segment: "Loyal Customers", rfmScore: "545", event: "Regular Purchase", revenue: 180, description: "Repeat purchase of favorite items" },
      { date: "Apr 8, 2024", segment: "Champions", rfmScore: "555", event: "VIP Status", description: "Achieved Champions status, joined loyalty program" },
      { date: "Apr 22, 2024", segment: "Champions", rfmScore: "555", event: "Large Purchase", revenue: 890, description: "Used VIP discount for major purchase" },
      { date: "May 10, 2024", segment: "Champions", rfmScore: "555", event: "Referral", description: "Referred 2 new customers" },
      { date: "Jun 2, 2024", segment: "Champions", rfmScore: "555", event: "Subscription", revenue: 450, description: "Started monthly subscription box" },
      { date: "Oct 28, 2024", segment: "Champions", rfmScore: "555", event: "Latest Purchase", revenue: 1200, description: "Premium product line purchase" },
    ]
  },
  {
    id: "2",
    name: "James Wilson",
    email: "j.wilson@email.com",
    signupDate: "Feb 10, 2024",
    currentSegment: "At Risk",
    totalSpent: 2890,
    orderCount: 8,
    journey: [
      { date: "Feb 10, 2024", segment: "New Customers", rfmScore: "512", event: "First Purchase", revenue: 210, description: "Initial order of electronics accessories" },
      { date: "Feb 25, 2024", segment: "Potential Loyalists", rfmScore: "533", event: "Strong Start", revenue: 340, description: "Quick second purchase" },
      { date: "Mar 18, 2024", segment: "Loyal Customers", rfmScore: "544", event: "Third Purchase", revenue: 425, description: "Purchased premium headphones" },
      { date: "Apr 5, 2024", segment: "Loyal Customers", rfmScore: "545", event: "Regular Purchase", revenue: 195, description: "Phone case and accessories" },
      { date: "May 1, 2024", segment: "Loyal Customers", rfmScore: "544", event: "Purchase", revenue: 380, description: "Smart home devices" },
      { date: "Jun 20, 2024", segment: "Need Attention", rfmScore: "433", event: "Slowing Down", revenue: 145, description: "Longer gap between purchases" },
      { date: "Aug 15, 2024", segment: "At Risk", rfmScore: "254", event: "At Risk", description: "No purchases for 55 days" },
      { date: "Sep 5, 2024", segment: "At Risk", rfmScore: "254", event: "Win-back Email", description: "Received 25% discount offer" },
    ]
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily.d@email.com",
    signupDate: "Mar 5, 2024",
    currentSegment: "Loyal Customers",
    totalSpent: 3450,
    orderCount: 10,
    journey: [
      { date: "Mar 5, 2024", segment: "New Customers", rfmScore: "512", event: "First Purchase", revenue: 185, description: "Home decor items" },
      { date: "Mar 22, 2024", segment: "Potential Loyalists", rfmScore: "523", event: "Second Purchase", revenue: 265, description: "Kitchen accessories" },
      { date: "Apr 10, 2024", segment: "Potential Loyalists", rfmScore: "534", event: "Third Purchase", revenue: 420, description: "Furniture piece" },
      { date: "May 5, 2024", segment: "Loyal Customers", rfmScore: "544", event: "Loyal Status", revenue: 310, description: "Consistent purchasing pattern established" },
      { date: "May 28, 2024", segment: "Loyal Customers", rfmScore: "545", event: "Regular Purchase", revenue: 195, description: "Seasonal items" },
      { date: "Jun 18, 2024", segment: "Loyal Customers", rfmScore: "545", event: "Purchase", revenue: 380, description: "Birthday shopping spree" },
      { date: "Jul 12, 2024", segment: "Loyal Customers", rfmScore: "544", event: "Purchase", revenue: 225, description: "Home office upgrade" },
      { date: "Aug 8, 2024", segment: "Loyal Customers", rfmScore: "545", event: "Purchase", revenue: 340, description: "Back-to-school items" },
      { date: "Sep 15, 2024", segment: "Loyal Customers", rfmScore: "454", event: "Purchase", revenue: 280, description: "Fall home refresh" },
      { date: "Oct 20, 2024", segment: "Loyal Customers", rfmScore: "454", event: "Latest Purchase", revenue: 350, description: "Holiday decorations" },
    ]
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
};

export function CustomerJourney() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerJourneyData>(customerJourneys[0]);

  const filteredCustomers = customerJourneys.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSegmentTrend = () => {
    const segments = selectedCustomer.journey.map(j => j.segment);
    const segmentValues: Record<string, number> = {
      "New Customers": 1,
      "Potential Loyalists": 2,
      "Loyal Customers": 3,
      "Champions": 4,
      "Need Attention": 2,
      "At Risk": 1,
      "Can't Lose Them": 1,
      "Hibernating": 0,
    };
    
    const firstValue = segmentValues[segments[0]] || 0;
    const lastValue = segmentValues[segments[segments.length - 1]] || 0;
    
    return lastValue > firstValue ? "improving" : lastValue < firstValue ? "declining" : "stable";
  };

  const trend = getSegmentTrend();
  const avgOrderValue = selectedCustomer.totalSpent / selectedCustomer.orderCount;
  const daysSinceLastPurchase = 8; // Mock value

  // Calculate predicted next purchase date
  const avgDaysBetweenPurchases = 18; // Mock calculation
  const predictedNextPurchase = `In ~${avgDaysBetweenPurchases - daysSinceLastPurchase} days`;

  return (
    <div className="space-y-6">
      {/* Customer Search */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <h3 className="mb-2">Customer Journey Timeline</h3>
            <p className="text-sm text-gray-600">Visualize individual customer segment evolution and purchase history</p>
          </div>
          <div className="w-full md:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && filteredCustomers.length > 0 && (
              <div className="absolute z-10 mt-1 w-96 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setSearchQuery("");
                    }}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div>{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Customer Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Segment</p>
              <Badge className={`${segmentColors[selectedCustomer.currentSegment]} text-base px-3 py-1`}>
                {selectedCustomer.currentSegment}
              </Badge>
              <div className="flex items-center gap-1 mt-2">
                {trend === "improving" && (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600">Improving</span>
                  </>
                )}
                {trend === "declining" && (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-xs text-red-600">Declining</span>
                  </>
                )}
                {trend === "stable" && (
                  <span className="text-xs text-gray-600">Stable</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-2xl">${selectedCustomer.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">{selectedCustomer.orderCount} orders</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
              <p className="text-2xl">${avgOrderValue.toFixed(0)}</p>
              <p className="text-xs text-gray-600 mt-1">Per transaction</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Next Purchase</p>
              <p className="text-xl">{predictedNextPurchase}</p>
              <p className="text-xs text-gray-600 mt-1">Predicted date</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Journey Timeline */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="mb-1">{selectedCustomer.name}'s Journey</h3>
          <p className="text-sm text-gray-600">Customer since {selectedCustomer.signupDate}</p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Journey events */}
          <div className="space-y-6">
            {selectedCustomer.journey.map((event, index) => (
              <div key={index} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 ${
                    event.revenue ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {event.revenue ? (
                      <DollarSign className="w-6 h-6 text-green-600" />
                    ) : (
                      <Calendar className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                </div>

                {/* Event content */}
                <div className="flex-1 pb-6">
                  <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm">{event.event}</h4>
                          {event.revenue && (
                            <span className="text-green-600 font-medium">+${event.revenue}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{event.date}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={segmentColors[event.segment]}>
                          {event.segment}
                        </Badge>
                        <span className="text-xs text-gray-500">RFM: {event.rfmScore}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 bg-blue-50">
        <h4 className="mb-4">Recommended Actions for {selectedCustomer.name}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedCustomer.currentSegment === "Champions" && (
            <>
              <Button variant="default" className="w-full">Send VIP Exclusive Offer</Button>
              <Button variant="outline" className="w-full">Request Product Review</Button>
              <Button variant="outline" className="w-full">Referral Program Invite</Button>
            </>
          )}
          {selectedCustomer.currentSegment === "At Risk" && (
            <>
              <Button variant="default" className="w-full">Send Win-back Offer (25% Off)</Button>
              <Button variant="outline" className="w-full">Personal Outreach Call</Button>
              <Button variant="outline" className="w-full">Survey - Why Did You Leave?</Button>
            </>
          )}
          {selectedCustomer.currentSegment === "Loyal Customers" && (
            <>
              <Button variant="default" className="w-full">Cross-sell Recommendation</Button>
              <Button variant="outline" className="w-full">Loyalty Program Upgrade</Button>
              <Button variant="outline" className="w-full">Early Access to New Products</Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

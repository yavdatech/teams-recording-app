import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { Package, TrendingUp, Target, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ProductCategory {
  name: string;
  purchaseRate: number;
  avgSpend: number;
  repeatRate: number;
}

interface SegmentAffinityData {
  segment: string;
  topCategories: ProductCategory[];
  avgBasketSize: number;
  crossSellOpportunities: string[];
  recommendedBundles: string[];
}

const segmentAffinityData: SegmentAffinityData[] = [
  {
    segment: "Champions",
    topCategories: [
      { name: "Premium Apparel", purchaseRate: 78, avgSpend: 245, repeatRate: 85 },
      { name: "Premium Electronics", purchaseRate: 65, avgSpend: 420, repeatRate: 72 },
      { name: "Luxury Home Goods", purchaseRate: 58, avgSpend: 310, repeatRate: 68 },
      { name: "Premium Accessories", purchaseRate: 52, avgSpend: 180, repeatRate: 80 },
    ],
    avgBasketSize: 3.8,
    crossSellOpportunities: [
      "Premium Electronics → Premium Accessories (82% affinity)",
      "Premium Apparel → Luxury Home Goods (75% affinity)",
      "All categories → VIP exclusive products (90% conversion)",
    ],
    recommendedBundles: [
      "Premium Tech Lifestyle Bundle: $899",
      "Luxury Home & Living Collection: $1,299",
      "Executive Wardrobe Premium: $749",
    ],
  },
  {
    segment: "Loyal Customers",
    topCategories: [
      { name: "Fashion & Apparel", purchaseRate: 72, avgSpend: 145, repeatRate: 78 },
      { name: "Electronics", purchaseRate: 58, avgSpend: 280, repeatRate: 65 },
      { name: "Home & Kitchen", purchaseRate: 54, avgSpend: 120, repeatRate: 70 },
      { name: "Sports & Outdoors", purchaseRate: 48, avgSpend: 95, repeatRate: 62 },
    ],
    avgBasketSize: 2.9,
    crossSellOpportunities: [
      "Electronics → Tech Accessories (68% affinity)",
      "Fashion → Accessories & Jewelry (72% affinity)",
      "Home & Kitchen → Small Appliances (58% affinity)",
    ],
    recommendedBundles: [
      "Complete Home Office Bundle: $449",
      "Fitness Enthusiast Package: $329",
      "Smart Home Starter Kit: $399",
    ],
  },
  {
    segment: "Potential Loyalists",
    topCategories: [
      { name: "Fashion & Apparel", purchaseRate: 65, avgSpend: 89, repeatRate: 52 },
      { name: "Beauty & Personal Care", purchaseRate: 58, avgSpend: 65, repeatRate: 60 },
      { name: "Home Decor", purchaseRate: 45, avgSpend: 78, repeatRate: 48 },
      { name: "Books & Media", purchaseRate: 38, avgSpend: 42, repeatRate: 55 },
    ],
    avgBasketSize: 2.1,
    crossSellOpportunities: [
      "Fashion → Beauty & Personal Care (65% affinity)",
      "Home Decor → Small Furniture (52% affinity)",
      "Any category → Subscription services (45% conversion)",
    ],
    recommendedBundles: [
      "Style & Beauty Essentials: $159",
      "Home Refresh Bundle: $219",
      "Self-Care Sunday Package: $129",
    ],
  },
  {
    segment: "New Customers",
    topCategories: [
      { name: "Electronics Accessories", purchaseRate: 52, avgSpend: 45, repeatRate: 35 },
      { name: "Fashion Basics", purchaseRate: 48, avgSpend: 52, repeatRate: 38 },
      { name: "Home Essentials", purchaseRate: 42, avgSpend: 38, repeatRate: 32 },
      { name: "Personal Care", purchaseRate: 35, avgSpend: 28, repeatRate: 40 },
    ],
    avgBasketSize: 1.5,
    crossSellOpportunities: [
      "First purchase → Complementary items (55% affinity)",
      "Electronics → Protection & Care products (60% affinity)",
      "Any item → Loyalty program enrollment (70% conversion)",
    ],
    recommendedBundles: [
      "New Customer Welcome Bundle: $79",
      "Starter Essentials Pack: $99",
      "First Order Special: $59",
    ],
  },
  {
    segment: "At Risk",
    topCategories: [
      { name: "Discounted Items", purchaseRate: 45, avgSpend: 52, repeatRate: 25 },
      { name: "Basic Electronics", purchaseRate: 38, avgSpend: 85, repeatRate: 20 },
      { name: "Home Basics", purchaseRate: 32, avgSpend: 42, repeatRate: 22 },
      { name: "Clearance Fashion", purchaseRate: 28, avgSpend: 35, repeatRate: 18 },
    ],
    avgBasketSize: 1.2,
    crossSellOpportunities: [
      "Win-back offer → Previously purchased categories (45% affinity)",
      "Discounted items → Related full-price items (32% affinity)",
      "Any purchase → Loyalty points redemption (85% engagement)",
    ],
    recommendedBundles: [
      "Win-Back Special Bundle: $89 (25% off)",
      "We Miss You Collection: $119 (30% off)",
      "Comeback Offer: $69 (35% off)",
    ],
  },
  {
    segment: "Need Attention",
    topCategories: [
      { name: "Seasonal Items", purchaseRate: 48, avgSpend: 68, repeatRate: 38 },
      { name: "Electronics", purchaseRate: 42, avgSpend: 125, repeatRate: 35 },
      { name: "Fashion", purchaseRate: 38, avgSpend: 72, repeatRate: 40 },
      { name: "Home Goods", purchaseRate: 35, avgSpend: 55, repeatRate: 32 },
    ],
    avgBasketSize: 1.8,
    crossSellOpportunities: [
      "Seasonal items → Evergreen alternatives (50% affinity)",
      "Past favorites → New arrivals in same category (58% affinity)",
      "Any item → Limited-time offers (65% conversion)",
    ],
    recommendedBundles: [
      "Refresh Your Favorites: $149",
      "Seasonal Transition Pack: $129",
      "Re-engagement Special: $99",
    ],
  },
];

const segmentColors: Record<string, string> = {
  "Champions": "bg-green-100 text-green-800",
  "Loyal Customers": "bg-blue-100 text-blue-800",
  "Potential Loyalists": "bg-indigo-100 text-indigo-800",
  "New Customers": "bg-purple-100 text-purple-800",
  "Need Attention": "bg-yellow-100 text-yellow-800",
  "At Risk": "bg-orange-100 text-orange-800",
};

export function ProductAffinity() {
  const [selectedSegment, setSelectedSegment] = useState("Champions");

  const segmentData = segmentAffinityData.find(s => s.segment === selectedSegment) || segmentAffinityData[0];

  // Calculate total potential revenue from recommendations
  const totalBundleValue = segmentData.recommendedBundles.reduce((sum, bundle) => {
    const price = parseInt(bundle.match(/\$(\d+)/)?.[1] || "0");
    return sum + price;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Segment Selector */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-1">Product Affinity by Segment</h3>
            <p className="text-sm text-gray-600">Discover product preferences and cross-sell opportunities for each customer segment</p>
          </div>
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {segmentAffinityData.map(s => (
                <SelectItem key={s.segment} value={s.segment}>{s.segment}</SelectItem>
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
              <p className="text-sm text-gray-600 mb-1">Top Category</p>
              <p className="text-xl mb-1">{segmentData.topCategories[0].name}</p>
              <p className="text-sm text-gray-600">{segmentData.topCategories[0].purchaseRate}% purchase rate</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Basket Size</p>
              <p className="text-3xl mb-1">{segmentData.avgBasketSize}</p>
              <p className="text-sm text-gray-600">items per order</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Repeat Purchase Rate</p>
              <p className="text-3xl mb-1">{segmentData.topCategories[0].repeatRate}%</p>
              <p className="text-sm text-gray-600">for top category</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bundle Opportunity</p>
              <p className="text-3xl mb-1">${totalBundleValue}</p>
              <p className="text-sm text-gray-600">potential value</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top Product Categories */}
      <Card className="p-6">
        <h3 className="mb-6">Top Product Categories for {selectedSegment}</h3>
        
        {/* Purchase Rate Chart */}
        <div className="mb-8">
          <h4 className="text-sm mb-4">Purchase Rate by Category</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={segmentData.topCategories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="purchaseRate" fill="#3b82f6" name="Purchase Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segmentData.topCategories.map((category, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm mb-1">{category.name}</h4>
                  <Badge className="bg-blue-100 text-blue-800">#{index + 1} Category</Badge>
                </div>
                <div className="text-right">
                  <div className="text-xl font-medium">${category.avgSpend}</div>
                  <div className="text-xs text-gray-600">avg spend</div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Purchase Rate</span>
                    <span className="font-medium">{category.purchaseRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${category.purchaseRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Repeat Purchase Rate</span>
                    <span className="font-medium">{category.repeatRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${category.repeatRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cross-Sell Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3>Cross-Sell Opportunities</h3>
          </div>
          <div className="space-y-3">
            {segmentData.crossSellOpportunities.map((opportunity, index) => {
              const [products, affinity] = opportunity.split('(');
              const affinityValue = affinity?.match(/(\d+)%/)?.[1] || "0";
              
              return (
                <div key={index} className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm flex-1">{products.trim()}</p>
                    <Badge className="bg-blue-600 text-white ml-2">
                      {affinityValue}%
                    </Badge>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${affinityValue}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
            <p className="text-yellow-900">
              <strong>💡 Recommendation:</strong> Implement automated product recommendations 
              based on these affinities to increase basket size by 15-25%.
            </p>
          </div>
        </Card>

        {/* Recommended Bundles */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h3>Recommended Product Bundles</h3>
          </div>
          <div className="space-y-3">
            {segmentData.recommendedBundles.map((bundle, index) => {
              const [name, priceStr] = bundle.split(':');
              const price = priceStr?.trim().replace(/[()]/g, '') || "";
              const discount = priceStr?.includes('%') ? priceStr.match(/(\d+)% off/)?.[1] : null;
              
              return (
                <div key={index} className="border-2 border-green-200 rounded-lg p-4 hover:border-green-400 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm mb-1">{name.trim()}</h4>
                      {discount && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          {discount}% OFF
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-medium text-green-600">{price}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                      Create Bundle
                    </button>
                    <button className="px-3 py-2 border border-green-600 text-green-600 text-sm rounded hover:bg-green-50 transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm">
            <p className="text-green-900">
              <strong>💡 Tip:</strong> Bundle promotions increase average order value by 
              20-30% for this segment.
            </p>
          </div>
        </Card>
      </div>

      {/* Segment Comparison */}
      <Card className="p-6">
        <h3 className="mb-6">Product Preferences Across All Segments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Segment</th>
                <th className="text-left p-3">Top Category</th>
                <th className="text-center p-3">Purchase Rate</th>
                <th className="text-center p-3">Avg Spend</th>
                <th className="text-center p-3">Basket Size</th>
                <th className="text-center p-3">Repeat Rate</th>
              </tr>
            </thead>
            <tbody>
              {segmentAffinityData.map((segment) => (
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
                  <td className="p-3">{segment.topCategories[0].name}</td>
                  <td className="text-center p-3">{segment.topCategories[0].purchaseRate}%</td>
                  <td className="text-center p-3">${segment.topCategories[0].avgSpend}</td>
                  <td className="text-center p-3">{segment.avgBasketSize}</td>
                  <td className="text-center p-3">{segment.topCategories[0].repeatRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Items */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <h4 className="mb-4">🎯 Action Items for {selectedSegment}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <h5 className="text-sm mb-2">Immediate Actions</h5>
            <ul className="text-sm space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Launch targeted email campaign featuring top {segmentData.topCategories[0].name}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Create homepage banner with personalized recommendations</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Enable "Frequently Bought Together" for top categories</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg">
            <h5 className="text-sm mb-2">Long-term Strategy</h5>
            <ul className="text-sm space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Develop subscription box for top-performing categories</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Create loyalty rewards program with category-specific perks</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Partner with brands in high-affinity categories for exclusives</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

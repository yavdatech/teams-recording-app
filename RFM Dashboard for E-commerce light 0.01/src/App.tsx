import { RFMMetricsCards } from "./components/RFMMetricsCards";
import { RFMSegmentChart } from "./components/RFMSegmentChart";
import { RFMScoreDistribution } from "./components/RFMScoreDistribution";
import { RFMTrendChart } from "./components/RFMTrendChart";
import { CustomerSegmentTable } from "./components/CustomerSegmentTable";
import { InsightsPanel } from "./components/InsightsPanel";
import { SegmentBreakdown } from "./components/SegmentBreakdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Download, RefreshCw, Filter } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">RFM Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Customer segmentation and actionable insights for e-commerce
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Metrics */}
        <div className="mb-8">
          <RFMMetricsCards />
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RFMSegmentChart />
              <RFMScoreDistribution />
            </div>

            {/* Trends */}
            <RFMTrendChart />

            {/* Quick Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InsightsPanel />
              </div>
              <div>
                <SegmentBreakdown />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SegmentBreakdown />
              <RFMSegmentChart />
            </div>
            <RFMTrendChart />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerSegmentTable />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InsightsPanel />
              </div>
              <div>
                <RFMScoreDistribution />
              </div>
            </div>
            <RFMTrendChart />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

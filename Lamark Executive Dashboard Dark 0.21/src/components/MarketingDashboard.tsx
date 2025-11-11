import { useState } from "react";
import { KPICards } from "./KPICards";
import { PerformanceTrend } from "./PerformanceTrend";
import { ClientTypeComparison } from "./ClientTypeComparison";
import { AccountPerformanceTable } from "./AccountPerformanceTable";
import { DashboardFilters } from "./DashboardFilters";
import { mockData } from "./mockData";

export function MarketingDashboard() {
  const [selectedMonth, setSelectedMonth] = useState("October 2024");
  const [selectedClientType, setSelectedClientType] = useState("All");

  const filteredData = mockData.accounts.filter(
    (account) =>
      selectedClientType === "All" || account.clientType === selectedClientType
  );

  const totalSpend = filteredData.reduce((sum, acc) => sum + acc.spend, 0);
  const totalRevenue = filteredData.reduce((sum, acc) => sum + acc.revenue, 0);
  const totalLeads = filteredData.reduce((sum, acc) => sum + acc.leads, 0);
  const avgROAS = totalRevenue / totalSpend;
  const avgCPL = totalSpend / totalLeads;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Page Header */}
      <div className="bg-white border-b" style={{ borderColor: '#DDDDDE' }}>
        <div className="px-10 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1" style={{ color: '#53565A' }}>Marketing Performance</h1>
              <p className="text-sm" style={{ color: '#75787B' }}>
                Monthly agency performance overview - Comprehensive analysis of paid media campaigns
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border" style={{ borderColor: '#DDDDDE', backgroundColor: '#FAFBFC' }}>
              <div className="w-2 h-2" style={{ backgroundColor: '#16a34a' }}></div>
              <div className="text-sm" style={{ color: '#75787B' }}>
                <span style={{ color: '#53565A' }}>Period:</span> Oct 2024
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-10">
        {/* Filters */}
        <DashboardFilters
          selectedMonth={selectedMonth}
          selectedClientType={selectedClientType}
          onMonthChange={setSelectedMonth}
          onClientTypeChange={setSelectedClientType}
        />

        {/* KPI Cards */}
        <KPICards
          totalSpend={totalSpend}
          avgROAS={avgROAS}
          avgCPL={avgCPL}
          clientCount={filteredData.length}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <PerformanceTrend data={mockData.trends} />
          <ClientTypeComparison
            ecomData={mockData.accounts.filter((a) => a.clientType === "E-commerce")}
            leadGenData={mockData.accounts.filter((a) => a.clientType === "Lead Generation")}
          />
        </div>

        {/* Account Performance Table */}
        <div className="mt-6">
          <AccountPerformanceTable accounts={filteredData} />
        </div>
      </div>

      {/* Mobile Layout */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-mobile {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

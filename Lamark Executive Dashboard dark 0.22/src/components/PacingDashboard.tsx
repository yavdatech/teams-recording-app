import { useState } from "react";
import { PacingKPICards } from "./PacingKPICards";
import { SpendPacingChart } from "./SpendPacingChart";
import { AccountsNeedingAttention } from "./AccountsNeedingAttention";
import { TopPerformingAccounts } from "./TopPerformingAccounts";
import { TopAccountsBySpend } from "./TopAccountsBySpend";
import { ChannelPerformance } from "./ChannelPerformance";
import { PacingFilters } from "./PacingFilters";
import { AccountPerformanceBubbleChart } from "./AccountPerformanceBubbleChart";
import { pacingMockData } from "./pacingMockData";

export function PacingDashboard() {
  const [selectedMonth, setSelectedMonth] = useState("November 2024");
  const [selectedClientType, setSelectedClientType] = useState("All");

  const filteredAccounts = pacingMockData.accounts.filter(
    (account) =>
      selectedClientType === "All" || account.clientType === selectedClientType
  );

  const totalActualSpend = filteredAccounts.reduce(
    (sum, acc) => sum + acc.actualSpend,
    0
  );
  const totalForecastSpend = filteredAccounts.reduce(
    (sum, acc) => sum + acc.forecastSpend,
    0
  );
  const spendPacing = (totalActualSpend / totalForecastSpend) * 100;

  const totalActualRevenue = filteredAccounts.reduce(
    (sum, acc) => sum + acc.actualRevenue,
    0
  );
  const avgActualROAS = totalActualRevenue / totalActualSpend;
  const avgTargetROAS = 4.2;

  const accountsOnTrack = filteredAccounts.filter(
    (acc) => acc.pacingStatus === "On Track"
  ).length;

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0B0D' }}>
      {/* Page Header */}
      <div className="border-b" style={{ backgroundColor: '#141619', borderColor: '#2A2C30' }}>
        <div className="px-10 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1" style={{ color: '#E6EDF3' }}>Pacing Dashboard</h1>
              <p className="text-sm" style={{ color: '#CCCCCC' }}>
                In-month performance forecast & monitoring - Real-time pacing analysis to optimize monthly performance
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border" style={{ borderColor: '#2A2C30', backgroundColor: '#1A1C20' }}>
              <div className="w-2 h-2" style={{ backgroundColor: '#4ade80' }}></div>
              <div className="text-sm" style={{ color: '#CCCCCC' }}>
                <span style={{ color: '#E6EDF3' }}>Last Updated:</span> Nov 18, 2024 • 2:45 PM
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-10">
        {/* Filters */}
        <PacingFilters
          selectedMonth={selectedMonth}
          selectedClientType={selectedClientType}
          onMonthChange={setSelectedMonth}
          onClientTypeChange={setSelectedClientType}
        />

        {/* Executive Insight Card */}
        <div 
          className="mb-8 p-7 border-l-4" 
          style={{ 
            borderLeftColor: '#1D5BEB',
            borderTop: '1px solid #2A2C30',
            borderRight: '1px solid #2A2C30',
            borderBottom: '1px solid #2A2C30',
            backgroundColor: '#141619'
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-3" style={{ color: '#E6EDF3' }}>Executive Summary</h2>
              <p className="text-sm max-w-3xl" style={{ color: '#CCCCCC' }}>
                Portfolio is currently {spendPacing >= 55 && spendPacing <= 65 ? 'on track' : spendPacing < 55 ? 'behind pace' : 'ahead of pace'} with {formatNumber(spendPacing, 1)}% spend pacing. 
                ROAS performance is {avgActualROAS >= avgTargetROAS ? 'exceeding' : 'below'} target at {formatNumber(avgActualROAS, 2)}x vs {formatNumber(avgTargetROAS, 2)}x target.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 border" style={{ backgroundColor: '#1A1C20', borderColor: '#2A2C30' }}>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: '#CCCCCC' }}>Portfolio Health</div>
                <div className="text-xl" style={{ 
                  color: (accountsOnTrack / filteredAccounts.length) >= 0.7 ? '#16a34a' : '#FF0067' 
                }}>
                  {formatNumber((accountsOnTrack / filteredAccounts.length) * 100, 0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <PacingKPICards
            spendPacing={spendPacing}
            actualROAS={avgActualROAS}
            targetROAS={avgTargetROAS}
            accountsOnTrack={accountsOnTrack}
            totalAccounts={filteredAccounts.length}
          />
        </div>

        {/* Spend Pacing Chart and Bubble Chart - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SpendPacingChart data={pacingMockData.dailyPacing} />
          <AccountPerformanceBubbleChart accounts={filteredAccounts} />
        </div>

        {/* Two Column Layout for Attention vs Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AccountsNeedingAttention
            accounts={filteredAccounts
              .filter((acc) => acc.pacingStatus !== "On Track")
              .sort((a, b) => a.pacingPercent - b.pacingPercent)
              .slice(0, 5)}
          />
          <TopPerformingAccounts
            accounts={filteredAccounts
              .sort((a, b) => b.actualROAS - a.actualROAS)
              .slice(0, 5)}
          />
        </div>

        {/* Channel Performance */}
        <div className="mb-10">
          <ChannelPerformance data={pacingMockData.channels} />
        </div>

        {/* Top Accounts by Spend */}
        <div className="mb-10">
          <TopAccountsBySpend
            accounts={filteredAccounts
              .sort((a, b) => b.actualSpend - a.actualSpend)
              .slice(0, 5)}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 py-6 border-t text-center" style={{ borderColor: '#DDDDDE' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-6" style={{ backgroundColor: '#1D5BEB' }}></div>
            <div className="w-2 h-6" style={{ backgroundColor: '#FF0067' }}></div>
          </div>
          <p className="text-sm" style={{ color: '#75787B' }}>
            Powered by <span style={{ color: '#1D5BEB' }}>Lamark Media</span> Analytics Platform
          </p>
        </div>
      </div>
    </div>
  );
}
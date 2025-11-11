import { TrendingUp, TrendingDown, DollarSign, Target, Users } from "lucide-react";

interface KPICardsProps {
  totalSpend: number;
  avgROAS: number;
  avgCPL: number;
  clientCount: number;
}

export function KPICards({
  totalSpend,
  avgROAS,
  avgCPL,
  clientCount,
}: KPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Spend */}
      <div className="bg-white p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-600">Total Spend</span>
          <DollarSign className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-slate-900 mb-1">{formatCurrency(totalSpend)}</div>
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span>12.5% vs last month</span>
        </div>
      </div>

      {/* Average ROAS */}
      <div className="bg-white p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-600">Average ROAS</span>
          <Target className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-slate-900 mb-1">{formatNumber(avgROAS)}x</div>
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span>8.3% vs last month</span>
        </div>
      </div>

      {/* Average CPL */}
      <div className="bg-white p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-600">Average CPL</span>
          <DollarSign className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-slate-900 mb-1">{formatCurrency(avgCPL)}</div>
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span>3.2% vs last month</span>
        </div>
      </div>

      {/* Active Clients */}
      <div className="bg-white p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-600">Active Clients</span>
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-slate-900 mb-1">{clientCount}</div>
        <div className="flex items-center gap-1 text-slate-600">
          <span>Unchanged</span>
        </div>
      </div>
    </div>
  );
}

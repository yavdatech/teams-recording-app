import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface PacingKPICardsProps {
  spendPacing: number;
  actualROAS: number;
  targetROAS: number;
  accountsOnTrack: number;
  totalAccounts: number;
}

export function PacingKPICards({
  spendPacing,
  actualROAS,
  targetROAS,
  accountsOnTrack,
  totalAccounts,
}: PacingKPICardsProps) {
  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const getPacingStatus = (pacing: number) => {
    if (pacing >= 55 && pacing <= 65) return "On Track";
    if (pacing < 55) return "Behind";
    return "Ahead";
  };

  const pacingStatus = getPacingStatus(spendPacing);
  const roasDiff = actualROAS - targetROAS;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {/* Spend Pacing */}
      <div 
        className="bg-white p-7 border-l-4 relative" 
        style={{ borderLeftColor: '#1D5BEB', borderTop: '1px solid #DDDDDE', borderRight: '1px solid #DDDDDE', borderBottom: '1px solid #DDDDDE' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: '#75787B' }}>Spend Pacing</span>
          <div className="p-2" style={{ backgroundColor: '#D2DEFB' }}>
            <Target className="w-5 h-5" style={{ color: '#1D5BEB' }} />
          </div>
        </div>
        <div className="mb-3 text-3xl" style={{ color: '#53565A' }}>
          {formatNumber(spendPacing, 1)}%
        </div>
        <div
          className="flex items-center gap-1 text-sm"
          style={{
            color: pacingStatus === "On Track"
              ? "#16a34a"
              : pacingStatus === "Behind"
              ? "#FF0067"
              : "#f59e0b"
          }}
        >
          {pacingStatus === "Behind" ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          <span>{pacingStatus}</span>
          <span style={{ color: '#989A9C' }}>(Target: 60%)</span>
        </div>
      </div>

      {/* Actual ROAS vs Target */}
      <div 
        className="bg-white p-7 border-l-4 relative" 
        style={{ borderLeftColor: '#4A7CEF', borderTop: '1px solid #DDDDDE', borderRight: '1px solid #DDDDDE', borderBottom: '1px solid #DDDDDE' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: '#75787B' }}>ROAS Performance</span>
          <div className="p-2" style={{ backgroundColor: '#D2DEFB' }}>
            <Target className="w-5 h-5" style={{ color: '#1D5BEB' }} />
          </div>
        </div>
        <div className="mb-3 text-3xl" style={{ color: '#53565A' }}>
          {formatNumber(actualROAS)}x
        </div>
        <div
          className="flex items-center gap-1 text-sm"
          style={{
            color: roasDiff >= 0 ? "#16a34a" : "#FF0067"
          }}
        >
          {roasDiff >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {roasDiff >= 0 ? "+" : ""}
            {formatNumber(roasDiff)}x
          </span>
          <span style={{ color: '#989A9C' }}>vs {formatNumber(targetROAS)}x target</span>
        </div>
      </div>

      {/* Accounts On Track */}
      <div 
        className="bg-white p-7 border-l-4 relative" 
        style={{ borderLeftColor: '#16a34a', borderTop: '1px solid #DDDDDE', borderRight: '1px solid #DDDDDE', borderBottom: '1px solid #DDDDDE' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: '#75787B' }}>On Track</span>
          <div className="p-2" style={{ backgroundColor: '#f0fdf4' }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#16a34a' }} />
          </div>
        </div>
        <div className="mb-3 text-3xl" style={{ color: '#53565A' }}>
          {accountsOnTrack}
        </div>
        <div className="flex items-center gap-1 text-sm" style={{ color: '#75787B' }}>
          <span>
            {formatNumber((accountsOnTrack / totalAccounts) * 100, 0)}% of portfolio
          </span>
          <span style={{ color: '#989A9C' }}>({totalAccounts} total)</span>
        </div>
      </div>

      {/* Accounts Needing Attention */}
      <div 
        className="bg-white p-7 border-l-4 relative" 
        style={{ borderLeftColor: '#FF0067', borderTop: '1px solid #DDDDDE', borderRight: '1px solid #DDDDDE', borderBottom: '1px solid #DDDDDE' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: '#75787B' }}>Needs Attention</span>
          <div className="p-2" style={{ backgroundColor: '#FFCCE1' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#FF0067' }} />
          </div>
        </div>
        <div className="mb-3 text-3xl" style={{ color: '#53565A' }}>
          {totalAccounts - accountsOnTrack}
        </div>
        <div className="flex items-center gap-1 text-sm" style={{ color: '#FF0067' }}>
          <span>Action required</span>
        </div>
      </div>
    </div>
  );
}

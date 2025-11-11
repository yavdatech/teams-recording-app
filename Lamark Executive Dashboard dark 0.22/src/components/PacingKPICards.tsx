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
        className="p-7 border-l-4 relative" 
        style={{ backgroundColor: '#1A1C20', borderLeftColor: '#1D5BEB', borderTop: '1px solid #2A2C30', borderRight: '1px solid #2A2C30', borderBottom: '1px solid #2A2C30' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: '#CCCCCC' }}>Spend Pacing</span>
          <div className="p-2" style={{ backgroundColor: '#1A2433' }}>
            <Target className="w-5 h-5" style={{ color: '#1D5BEB' }} />
          </div>
        </div>
        <div className="mb-3 text-3xl" style={{ color: '#E6EDF3' }}>
          {formatNumber(spendPacing, 1)}%
        </div>
        <div
          className="flex items-center gap-1 text-sm"
          style={{
            color: pacingStatus === "On Track"
              ? "#4ade80"
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
          <span style={{ color: '#666668' }}>(Target: 60%)</span>
        </div>
      </div>

      {/* Actual ROAS vs Target */}
      <div 
        className="p-7 border-l-4 relative" 
        style={{ backgroundColor: '#1A1C20', borderLeftColor: '#4A7CEF', borderTop: '1px solid #2A2C30', borderRight: '1px solid #2A2C30', borderBottom: '1px solid #2A2C30' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: '#CCCCCC' }}>ROAS Performance</span>
          <div className="p-2" style={{ backgroundColor: '#1A2433' }}>
            <Target className="w-5 h-5" style={{ color: '#1D5BEB' }} />
          </div>
        </div>
        <div className="mb-3 text-3xl" style={{ color: '#E6EDF3' }}>
          {formatNumber(actualROAS)}x
        </div>
        <div
          className="flex items-center gap-1 text-sm"
          style={{
            color: roasDiff >= 0 ? "#4ade80" : "#FF0067"
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
          <span style={{ color: '#666668' }}>vs {formatNumber(targetROAS)}x target</span>
        </div>
      </div>

      {/* Accounts On Track */}
      <div 
        className="p-7 border-l-4 relative" 
        style={{ backgroundColor: '#1A1C20', borderLeftColor: '#4ade80', borderTop: '1px solid #2A2C30', borderRight: '1px solid #2A2C30', borderBottom: '1px solid #2A2C30' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: '#CCCCCC' }}>On Track</span>
          <div className="p-2" style={{ backgroundColor: '#1a4d2e' }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#4ade80' }} />
          </div>
        </div>
        <div className="mb-3 text-3xl" style={{ color: '#E6EDF3' }}>
          {accountsOnTrack}
        </div>
        <div className="flex items-center gap-1 text-sm" style={{ color: '#CCCCCC' }}>
          <span>
            {formatNumber((accountsOnTrack / totalAccounts) * 100, 0)}% of portfolio
          </span>
          <span style={{ color: '#666668' }}>({totalAccounts} total)</span>
        </div>
      </div>

      {/* Accounts Needing Attention */}
      <div 
        className="p-7 border-l-4 relative" 
        style={{ backgroundColor: '#1A1C20', borderLeftColor: '#FF0067', borderTop: '1px solid #2A2C30', borderRight: '1px solid #2A2C30', borderBottom: '1px solid #2A2C30' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wide" style={{ color: '#CCCCCC' }}>Needs Attention</span>
          <div className="p-2" style={{ backgroundColor: '#4d1a2e' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#FF0067' }} />
          </div>
        </div>
        <div className="mb-3 text-3xl" style={{ color: '#E6EDF3' }}>
          {totalAccounts - accountsOnTrack}
        </div>
        <div className="flex items-center gap-1 text-sm" style={{ color: '#FF0067' }}>
          <span>Action required</span>
        </div>
      </div>
    </div>
  );
}
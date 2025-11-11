import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { DollarSign } from "lucide-react";
import { Progress } from "./ui/progress";

interface Account {
  accountName: string;
  clientType: string;
  actualSpend: number;
  forecastSpend: number;
  targetSpendEOM?: number;
  actualROAS: number;
  targetROAS: number;
  pacingPercent: number;
  pacingStatus: string;
}

interface TopAccountsBySpendProps {
  accounts: Account[];
}

export function TopAccountsBySpend({ accounts }: TopAccountsBySpendProps) {
  // Calculate target spend for each account (assuming day 18 of 30)
  const currentDay = 18;
  const daysInMonth = 30;
  const targetPacingPercent = (currentDay / daysInMonth) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals);
  };

  const calculateTargetSpend = (forecastSpend: number) => {
    return (forecastSpend / daysInMonth) * currentDay;
  };

  const calculatePacingVsTarget = (forecastSpend: number, targetSpendEOM: number) => {
    // Pacing is now (forecasted spend) / (target spend) * 100
    return (forecastSpend / targetSpendEOM) * 100;
  };

  const getPacingColor = (pacing: number) => {
    if (pacing >= 90 && pacing <= 110) return "#4ade80";
    if (pacing < 90) return "#FF0067";
    return "#FF3385";
  };

  const getRecommendation = (account: Account) => {
    // Calculate days left in month (assuming 30 days)
    const currentDay = 18; // Based on the data
    const daysLeft = 30 - currentDay;
    
    // Calculate daily spend needed
    const spendGap = account.forecastSpend - account.actualSpend;
    const dailySpendNeeded = spendGap / daysLeft;
    const currentDailySpend = account.actualSpend / currentDay;
    const spendChange = dailySpendNeeded - currentDailySpend;
    const spendChangePercent = (spendChange / currentDailySpend) * 100;
    
    // Check if ROAS is better or worse
    const roasTrending = account.actualROAS >= account.targetROAS;
    
    // Generate recommendation
    if (account.pacingPercent >= 55 && account.pacingPercent <= 65 && roasTrending) {
      return {
        text: "Maintain current daily spend",
        color: "#4ade80",
        icon: "✓"
      };
    } else if (account.pacingPercent < 55 && roasTrending) {
      return {
        text: `Increase daily spend by ${formatCurrency(Math.abs(spendChange))} (+${Math.abs(spendChangePercent).toFixed(0)}%)`,
        color: "#1D5BEB",
        icon: "↑"
      };
    } else if (account.pacingPercent < 55 && !roasTrending) {
      return {
        text: `Cautiously increase by ${formatCurrency(Math.abs(spendChange) * 0.5)} - monitor ROAS`,
        color: "#FF0067",
        icon: "⚠"
      };
    } else if (account.pacingPercent > 65 && roasTrending) {
      return {
        text: `Reduce daily spend by ${formatCurrency(Math.abs(spendChange))} to align with target`,
        color: "#f59e0b",
        icon: "↓"
      };
    } else if (account.pacingPercent > 65 && !roasTrending) {
      return {
        text: `Decrease daily spend by ${formatCurrency(Math.abs(spendChange))} - poor ROAS`,
        color: "#FF0067",
        icon: "⚠"
      };
    } else if (roasTrending) {
      return {
        text: "Consider increasing budget - strong ROAS",
        color: "#4ade80",
        icon: "✓"
      };
    } else {
      return {
        text: "Review targeting & creative - low ROAS",
        color: "#FF0067",
        icon: "⚠"
      };
    }
  };

  return (
    <div className="border" style={{ backgroundColor: '#1A1A1C', borderColor: '#2A2A2C' }}>
      <div className="p-7 border-b" style={{ borderColor: '#2A2A2C', backgroundColor: '#1A1F2E' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2" style={{ backgroundColor: '#1A2433' }}>
            <DollarSign className="w-5 h-5" style={{ color: '#1D5BEB' }} />
          </div>
          <h3 style={{ color: '#E5E5E5' }}>Top 5 Accounts by Spend</h3>
        </div>
        <p className="text-sm" style={{ color: '#B8B8B8' }}>
          High-value accounts with actionable daily spending recommendations
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: '#2A2A2C' }}>
              <TableHead style={{ color: '#B8B8B8' }}>Account Name</TableHead>
              <TableHead style={{ color: '#B8B8B8' }}>Type</TableHead>
              <TableHead className="text-right" style={{ color: '#B8B8B8' }}>Actual Spend</TableHead>
              <TableHead className="text-right" style={{ color: '#B8B8B8' }}>Target Spend</TableHead>
              <TableHead className="text-right" style={{ color: '#B8B8B8' }}>Forecast</TableHead>
              <TableHead style={{ color: '#B8B8B8' }}>Pacing</TableHead>
              <TableHead className="text-right" style={{ color: '#B8B8B8' }}>ROAS</TableHead>
              <TableHead className="text-right" style={{ color: '#B8B8B8' }}>Target ROAS</TableHead>
              <TableHead style={{ color: '#B8B8B8' }}>Daily Spend Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account, index) => {
              const targetSpendMTD = calculateTargetSpend(account.targetSpendEOM || account.forecastSpend);
              const targetSpendEOM = account.targetSpendEOM || account.forecastSpend;
              const pacingVsTarget = calculatePacingVsTarget(account.forecastSpend, targetSpendEOM);
              const recommendation = getRecommendation(account);
              
              return (
                <TableRow key={index} style={{ borderColor: '#2A2A2C' }}>
                  <TableCell style={{ color: '#E5E5E5' }}>{account.accountName}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex px-2.5 py-1 text-xs"
                      style={{
                        backgroundColor: account.clientType === "E-commerce"
                          ? "#1A2433"
                          : "#4d1a2e",
                        color: account.clientType === "E-commerce"
                          ? "#1D5BEB"
                          : "#FF0067"
                      }}
                    >
                      {account.clientType}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" style={{ color: '#E5E5E5' }}>
                    {formatCurrency(account.actualSpend)}
                  </TableCell>
                  <TableCell className="text-right" style={{ color: '#B8B8B8' }}>
                    {formatCurrency(targetSpendMTD)}
                  </TableCell>
                  <TableCell className="text-right" style={{ color: '#B8B8B8' }}>
                    {formatCurrency(account.forecastSpend)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(pacingVsTarget, 100)}
                        className="w-20 h-2"
                      />
                      <span style={{ color: getPacingColor(pacingVsTarget) }}>
                        {formatNumber(pacingVsTarget)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      style={{
                        color: account.actualROAS >= account.targetROAS
                          ? "#4ade80"
                          : "#FF0067"
                      }}
                    >
                      {formatNumber(account.actualROAS)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-right" style={{ color: '#B8B8B8' }}>
                    {formatNumber(account.targetROAS)}x
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span style={{ color: recommendation.color }}>
                        {recommendation.icon}
                      </span>
                      <span className="text-sm" style={{ color: '#E5E5E5' }}>
                        {recommendation.text}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

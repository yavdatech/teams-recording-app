import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";

interface Account {
  accountName: string;
  clientType: string;
  actualSpend: number;
  forecastSpend: number;
  actualROAS: number;
  targetROAS: number;
  pacingPercent: number;
  pacingStatus: string;
}

interface TopPerformingAccountsProps {
  accounts: Account[];
}

export function TopPerformingAccounts({
  accounts,
}: TopPerformingAccountsProps) {
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

  const getRecommendation = (account: Account) => {
    const roasGap = account.actualROAS - account.targetROAS;
    
    if (roasGap > 0.5) {
      return {
        text: "Consider increasing spend 15-20%",
        icon: "📈",
        color: "#16a34a"
      };
    } else if (roasGap > 0) {
      return {
        text: "Test incremental spend increase",
        icon: "✅",
        color: "#16a34a"
      };
    } else {
      return {
        text: "Maintain current strategy",
        icon: "✓",
        color: "#75787B"
      };
    }
  };

  return (
    <div className="bg-white border" style={{ borderColor: '#DDDDDE' }}>
      <div className="p-6 border-b" style={{ borderColor: '#DDDDDE', backgroundColor: '#F6FFF8' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2" style={{ backgroundColor: '#dcfce7' }}>
            <TrendingUp className="w-5 h-5" style={{ color: '#16a34a' }} />
          </div>
          <h3 style={{ color: '#53565A' }}>Top Performing Accounts</h3>
        </div>
        <p className="text-sm" style={{ color: '#75787B' }}>
          Top 5 accounts by ROAS performance
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Actual ROAS</TableHead>
              <TableHead className="text-right">vs Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account, index) => {
              const recommendation = getRecommendation(account);
              return (
                <TableRow key={index}>
                  <TableCell>
                    <div>{account.accountName}</div>
                    <div style={{ color: '#75787B' }}>
                      {account.clientType}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span style={{ color: '#16a34a' }}>
                      {formatNumber(account.actualROAS)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span style={{ color: '#16a34a' }}>
                      +{formatNumber(account.actualROAS - account.targetROAS)}x
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{ 
                        backgroundColor: '#f0fdf4', 
                        color: '#16a34a', 
                        borderColor: '#86efac' 
                      }}
                    >
                      {account.pacingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{recommendation.icon}</span>
                      <span className="text-sm" style={{ color: recommendation.color }}>
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

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
    <div className="border" style={{ backgroundColor: '#1A1A1C', borderColor: '#2A2A2C' }}>
      <div className="p-6 border-b" style={{ borderColor: '#2A2A2C', backgroundColor: '#19211a' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2" style={{ backgroundColor: '#1a4d2e' }}>
            <TrendingUp className="w-5 h-5" style={{ color: '#4ade80' }} />
          </div>
          <h3 style={{ color: '#E5E5E5' }}>Top Performing Accounts</h3>
        </div>
        <p className="text-sm" style={{ color: '#B8B8B8' }}>
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
                <TableRow key={index} style={{ borderColor: '#2A2A2C' }}>
                  <TableCell style={{ color: '#E5E5E5' }}>
                    <div>{account.accountName}</div>
                    <div style={{ color: '#B8B8B8' }}>
                      {account.clientType}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span style={{ color: '#4ade80' }}>
                      {formatNumber(account.actualROAS)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span style={{ color: '#4ade80' }}>
                      +{formatNumber(account.actualROAS - account.targetROAS)}x
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{ 
                        backgroundColor: '#1a4d2e', 
                        color: '#4ade80', 
                        borderColor: '#2d7a4d' 
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

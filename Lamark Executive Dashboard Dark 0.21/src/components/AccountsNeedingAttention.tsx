import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { AlertCircle } from "lucide-react";
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
  issue: string;
}

interface AccountsNeedingAttentionProps {
  accounts: Account[];
}

export function AccountsNeedingAttention({
  accounts,
}: AccountsNeedingAttentionProps) {
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
    const pacingIssue = account.pacingPercent < 55;
    const roasIssue = roasGap < -0.3;

    if (roasIssue && pacingIssue) {
      return {
        text: "Focus on ROAS & reduce spend",
        icon: "⚠️",
        color: "#FF0067"
      };
    } else if (roasIssue) {
      return {
        text: "Optimize for better ROAS",
        icon: "🎯",
        color: "#FF3385"
      };
    } else if (pacingIssue) {
      return {
        text: "Consider reducing spend",
        icon: "📉",
        color: "#FF3385"
      };
    } else {
      return {
        text: "Monitor performance",
        icon: "👁️",
        color: "#75787B"
      };
    }
  };

  return (
    <div className="bg-white border" style={{ borderColor: '#DDDDDE' }}>
      <div className="p-6 border-b" style={{ borderColor: '#DDDDDE', backgroundColor: '#FFFAFC' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2" style={{ backgroundColor: '#FFCCE1' }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#FF0067' }} />
          </div>
          <h3 style={{ color: '#53565A' }}>Accounts Needing Attention</h3>
        </div>
        <p className="text-sm" style={{ color: '#75787B' }}>
          Top 5 accounts running behind or underperforming
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Pacing %</TableHead>
              <TableHead className="text-right">ROAS Gap</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center" style={{ color: '#75787B' }}>
                  No accounts need attention
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account, index) => {
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
                      <span
                        style={{
                          color: account.pacingPercent < 50 ? "#FF0067" : "#FF3385"
                        }}
                      >
                        {formatNumber(account.pacingPercent)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span style={{ color: '#FF0067' }}>
                        {formatNumber(account.actualROAS - account.targetROAS)}x
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{ 
                          backgroundColor: '#FFCCE1', 
                          color: '#FF0067', 
                          borderColor: '#FF99C2' 
                        }}
                      >
                        {account.issue}
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
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

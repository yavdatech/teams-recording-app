import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface Account {
  accountName: string;
  clientType: string;
  spend: number;
  revenue: number;
  leads: number;
  roas: number;
  cpl: number;
}

interface AccountPerformanceTableProps {
  accounts: Account[];
}

export function AccountPerformanceTable({
  accounts,
}: AccountPerformanceTableProps) {
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

  const getPerformanceIndicator = (roas: number) => {
    if (roas >= 4.0) {
      return <ArrowUp className="w-4 h-4 text-green-600" />;
    } else if (roas >= 2.5) {
      return <Minus className="w-4 h-4 text-slate-400" />;
    } else {
      return <ArrowDown className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-slate-900">Account Level Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Client Type</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="text-right">CPL</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account, index) => (
              <TableRow key={index}>
                <TableCell>{account.accountName}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 text-xs ${
                      account.clientType === "E-commerce"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {account.clientType}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(account.spend)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(account.revenue)}
                </TableCell>
                <TableCell className="text-right">{account.leads}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(account.roas)}x
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(account.cpl)}
                </TableCell>
                <TableCell className="text-center">
                  {getPerformanceIndicator(account.roas)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

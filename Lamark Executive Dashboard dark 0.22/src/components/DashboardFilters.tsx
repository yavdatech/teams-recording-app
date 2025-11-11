import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "lucide-react";

interface DashboardFiltersProps {
  selectedMonth: string;
  selectedClientType: string;
  onMonthChange: (month: string) => void;
  onClientTypeChange: (type: string) => void;
}

export function DashboardFilters({
  selectedMonth,
  selectedClientType,
  onMonthChange,
  onClientTypeChange,
}: DashboardFiltersProps) {
  const months = [
    "October 2024",
    "September 2024",
    "August 2024",
    "July 2024",
    "June 2024",
  ];

  const clientTypes = ["All", "E-commerce", "Lead Generation"];

  return (
    <div className="bg-white p-4 mb-6 border border-slate-200 flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-600" />
        <span className="text-slate-700">Period:</span>
      </div>
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 ml-4">
        <span className="text-slate-700">Client Type:</span>
      </div>
      <Select value={selectedClientType} onValueChange={onClientTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {clientTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

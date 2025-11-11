import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "lucide-react";

interface PacingFiltersProps {
  selectedMonth: string;
  selectedClientType: string;
  onMonthChange: (month: string) => void;
  onClientTypeChange: (type: string) => void;
}

export function PacingFilters({
  selectedMonth,
  selectedClientType,
  onMonthChange,
  onClientTypeChange,
}: PacingFiltersProps) {
  const months = [
    "November 2024",
    "October 2024",
    "September 2024",
    "August 2024",
  ];

  const clientTypes = ["All", "E-commerce", "Lead Generation"];

  return (
    <div className="bg-white p-5 mb-6 border flex flex-wrap gap-4 items-center" style={{ borderColor: '#DDDDDE' }}>
      <div className="flex items-center gap-2">
        <div className="p-2" style={{ backgroundColor: '#D2DEFB' }}>
          <Calendar className="w-4 h-4" style={{ color: '#1D5BEB' }} />
        </div>
        <span style={{ color: '#53565A' }}>Period:</span>
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
        <span style={{ color: '#53565A' }}>Client Type:</span>
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

      <div className="ml-auto flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: '#F8F9FA', color: '#75787B' }}>
        <div className="w-2 h-2" style={{ backgroundColor: '#16a34a' }}></div>
        <span className="text-sm">As of: Nov 18, 2024 (Day 18 of 30)</span>
      </div>
    </div>
  );
}

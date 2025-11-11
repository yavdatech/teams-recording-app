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
    <div className="p-5 mb-6 border flex flex-wrap gap-4 items-center" style={{ backgroundColor: '#1A1A1C', borderColor: '#2A2A2C' }}>
      <div className="flex items-center gap-2">
        <div className="p-2" style={{ backgroundColor: '#1A2433' }}>
          <Calendar className="w-4 h-4" style={{ color: '#1D5BEB' }} />
        </div>
        <span style={{ color: '#E5E5E5' }}>Period:</span>
      </div>
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="w-[180px]" style={{ backgroundColor: '#141416', borderColor: '#2A2A2C', color: '#E5E5E5' }}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent style={{ backgroundColor: '#1A1A1C', borderColor: '#2A2A2C' }}>
          {months.map((month) => (
            <SelectItem key={month} value={month} style={{ color: '#E5E5E5' }}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 ml-4">
        <span style={{ color: '#E5E5E5' }}>Client Type:</span>
      </div>
      <Select value={selectedClientType} onValueChange={onClientTypeChange}>
        <SelectTrigger className="w-[180px]" style={{ backgroundColor: '#141416', borderColor: '#2A2A2C', color: '#E5E5E5' }}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent style={{ backgroundColor: '#1A1A1C', borderColor: '#2A2A2C' }}>
          {clientTypes.map((type) => (
            <SelectItem key={type} value={type} style={{ color: '#E5E5E5' }}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: '#141416', color: '#B8B8B8' }}>
        <div className="w-2 h-2" style={{ backgroundColor: '#4ade80' }}></div>
        <span className="text-sm">As of: Nov 18, 2024 (Day 18 of 30)</span>
      </div>
    </div>
  );
}

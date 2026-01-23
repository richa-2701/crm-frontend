//frontend/components/reports/report-filters.tsx
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Download, FileSpreadsheet } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { ApiUser } from "@/lib/api"

interface ReportFiltersProps {
  users: ApiUser[];
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  dateRange: DateRange | undefined;
  onDateChange: (dateRange: DateRange | undefined) => void;
  isUserSelectionDisabled: boolean;
  reportData?: any;
  isPdfExporting?: boolean;
  isExcelExporting?: boolean;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  loading?: boolean;
  currentUserRole?: string;
}

export function ReportFilters({
  users,
  selectedUserId,
  onUserChange,
  dateRange,
  onDateChange,
  isUserSelectionDisabled,
  reportData,
  isPdfExporting,
  isExcelExporting,
  onExportPdf,
  onExportExcel,
  loading,
  currentUserRole
}: ReportFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 items-end">
      <div className="flex-1 w-full">
        <label className="text-xs font-medium mb-1 block">User</label>
        <Select value={selectedUserId} onValueChange={onUserChange} disabled={isUserSelectionDisabled}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a user" /></SelectTrigger>
          <SelectContent>
            {users.map(u => (<SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 w-full">
        <label className="text-xs font-medium mb-1 block">Date Range</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">
                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date</span>}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={dateRange} onSelect={onDateChange} initialFocus numberOfMonths={2} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Export Buttons */}
      {onExportPdf && onExportExcel && (
        <div className="flex gap-2 w-full lg:w-auto">
          <Button
            onClick={onExportPdf}
            disabled={!reportData || isPdfExporting || loading}
            variant="outline"
            size="sm"
            className="h-9 text-sm flex-1 lg:flex-initial"
          >
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
          {currentUserRole === 'admin' && (
            <Button
              onClick={onExportExcel}
              disabled={isExcelExporting}
              size="sm"
              className="h-9 text-sm flex-1 lg:flex-initial"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Excel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

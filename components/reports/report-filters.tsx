//frontend/components/reports/report-filters.tsx
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon } from "lucide-react"
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
}

export function ReportFilters({ users, selectedUserId, onUserChange, dateRange, onDateChange, isUserSelectionDisabled }: ReportFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium mb-1 block">User</label>
        <Select value={selectedUserId} onValueChange={onUserChange} disabled={isUserSelectionDisabled}>
          <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
          <SelectContent>
            {users.map(u => (<SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <label className="text-sm font-medium mb-1 block">Date Range</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={dateRange} onSelect={onDateChange} initialFocus numberOfMonths={2}/>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
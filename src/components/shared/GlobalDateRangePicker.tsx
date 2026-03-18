import { useState, useRef, useEffect } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type PresetKey = "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "lastMonth" | "custom";

const PRESETS: { key: PresetKey; label: string; getRange: () => DateRange }[] = [
  {
    key: "today",
    label: "Today",
    getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }),
  },
  {
    key: "yesterday",
    label: "Yesterday",
    getRange: () => {
      const d = subDays(new Date(), 1);
      return { from: startOfDay(d), to: endOfDay(d) };
    },
  },
  {
    key: "last7",
    label: "Last 7 Days",
    getRange: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }),
  },
  {
    key: "last30",
    label: "Last 30 Days",
    getRange: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }),
  },
  {
    key: "thisMonth",
    label: "This Month",
    getRange: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }),
  },
  {
    key: "lastMonth",
    label: "Last Month",
    getRange: () => {
      const prev = subMonths(new Date(), 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    },
  },
  {
    key: "custom",
    label: "Custom Range",
    getRange: () => ({ from: undefined, to: undefined }),
  },
];

interface GlobalDateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

const GlobalDateRangePicker = ({
  dateRange,
  onDateRangeChange,
  className,
  align = "start",
}: GlobalDateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>("last7");
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);

  useEffect(() => {
    setTempRange(dateRange);
  }, [dateRange]);

  const handlePreset = (preset: typeof PRESETS[0]) => {
    const range = preset.getRange();
    setActivePreset(preset.key);
    if (preset.key !== "custom") {
      setTempRange(range);
      onDateRangeChange(range);
      setOpen(false);
    } else {
      setTempRange({ from: undefined, to: undefined });
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (!range) return;
    setTempRange(range);
    setActivePreset("custom");
  };

  const handleApply = () => {
    onDateRangeChange(tempRange);
    setOpen(false);
  };

  const displayLabel = () => {
    if (activePreset !== "custom") {
      const preset = PRESETS.find((p) => p.key === activePreset);
      return preset?.label || "Select dates";
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`;
    }
    if (dateRange.from) {
      return `${format(dateRange.from, "MMM d, yyyy")} – ...`;
    }
    return "Select dates";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start text-left font-normal gap-2 min-w-[200px]",
            !dateRange.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="truncate">{displayLabel()}</span>
          <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 flex flex-col sm:flex-row"
        align={align}
        sideOffset={8}
      >
        {/* Presets sidebar */}
        <div className="flex flex-row sm:flex-col gap-1 p-3 sm:border-r border-b sm:border-b-0 border-border overflow-x-auto sm:overflow-x-visible sm:min-w-[140px]">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePreset(preset)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors text-left",
                activePreset === preset.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="p-3">
          <Calendar
            mode="range"
            selected={tempRange as any}
            onSelect={handleCalendarSelect as any}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
            className="pointer-events-auto"
            defaultMonth={tempRange.from || subDays(new Date(), 30)}
          />
          {activePreset === "custom" && (
            <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTempRange(dateRange);
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!tempRange.from || !tempRange.to}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GlobalDateRangePicker;

// Helper hook for easy integration
export const useDateRange = (defaultPreset: PresetKey = "last7") => {
  const preset = PRESETS.find((p) => p.key === defaultPreset)!;
  const [dateRange, setDateRange] = useState<DateRange>(preset.getRange());

  const dateFrom = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const dateTo = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  return { dateRange, setDateRange, dateFrom, dateTo };
};

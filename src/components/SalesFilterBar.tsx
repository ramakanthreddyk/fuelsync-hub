
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface SalesFilterBarProps {
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void;
  productType: string;
  onProductTypeChange: (type: string) => void;
  pumpId: string;
  onPumpIdChange: (id: string) => void;
  nozzleId: string;
  onNozzleIdChange: (id: string) => void;
  pumps: any[];
  nozzles: any[];
  isMobile?: boolean;
}

export function SalesFilterBar({
  dateRange,
  onDateRangeChange,
  productType,
  onProductTypeChange,
  pumpId,
  onPumpIdChange,
  nozzleId,
  onNozzleIdChange,
  pumps,
  nozzles,
  isMobile,
}: SalesFilterBarProps) {
  // Always use "all" as the value for "All..." items; never ""
  // Ensure that we never render SelectItem value="" by accident

  // Patch controlled value logic: if incoming prop is "", switch to "all" (for productType, pump, nozzle).
  // And onValueChange, translate "all" back to "" (or however your logic expects).
  const productTypeValue = productType === "" ? "all" : productType;

  return (
    <div className={`flex flex-wrap gap-2 rounded-lg shadow-sm bg-background px-2 py-2 md:flex-nowrap w-full justify-between items-center ${isMobile ? "flex-col space-y-2" : ""}`}>
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[180px] justify-start text-left"
            >
              {dateRange.start && dateRange.end
                ? `${format(dateRange.start, "dd MMM yyyy")} - ${format(dateRange.end, "dd MMM")}`
                : "Select date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="range"
              selected={{
                from: dateRange.start ?? undefined,
                to: dateRange.end ?? undefined,
              }}
              onSelect={(range: any) => {
                onDateRangeChange({
                  start: range?.from ?? null,
                  end: range?.to ?? null,
                });
              }}
              className="p-3 pointer-events-auto"
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {/* Product Type */}
        <div className="flex flex-col items-start min-w-[120px]">
          <Select
            value={productTypeValue}
            onValueChange={val => onProductTypeChange(val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Petrol">Petrol</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground mt-1">
            Filter sales by fuel type (e.g., Petrol, Diesel).
          </span>
        </div>
        {/* Pump */}
        <div className="flex flex-col items-start min-w-[120px]">
          <Select value={pumpId} onValueChange={onPumpIdChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Pump" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {pumps.filter(pump => pump && pump.id != null && pump.id !== "").map((pump) => (
                <SelectItem key={pump.id} value={String(pump.id)}>
                  {pump.name || `Pump ${pump.pump_sno}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground mt-1">
            Filter sales by a specific pump.
          </span>
        </div>
        {/* Nozzle */}
        <div className="flex flex-col items-start min-w-[120px]">
          <Select value={nozzleId} onValueChange={onNozzleIdChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Nozzle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {nozzles.filter(nozzle => nozzle && nozzle.id != null && nozzle.id !== "").map((nozzle) => (
                <SelectItem key={nozzle.id} value={String(nozzle.id)}>
                  #{nozzle.nozzle_number} ({nozzle.fuel_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground mt-1">
            Filter sales by a specific nozzle on a pump.
          </span>
        </div>
      </div>
    </div>
  );
}

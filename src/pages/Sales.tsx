import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart3, TrendingUp, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSalesData } from "@/hooks/useSalesData";
import { usePumpsData } from "@/hooks/usePumpsData";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { useSalesManagement } from "@/hooks/useSalesManagement";

export default function Sales() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isToday, setIsToday] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [selectedPumpId, setSelectedPumpId] = useState<number | null>(null);
  const [selectedNozzleId, setSelectedNozzleId] = useState<number | null>(null);
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    station_id: '',
    pump_id: '',
    nozzle_id: '',
    cumulative_volume: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { data: sales, isLoading } = useSalesData(isToday ? selectedDate : undefined);
  const { data: pumps } = usePumpsData();
  const { currentStation, canAccessAllStations, stations } = useRoleAccess();
  const { createManualEntry } = useSalesManagement();

  useEffect(() => {
    if (!canAccessAllStations && currentStation?.id) {
      setManualEntry(prev => ({
        ...prev,
        station_id: currentStation.id.toString(),
      }));
    }
  }, [canAccessAllStations, currentStation]);

  const filteredSales = sales?.filter(sale => {
    if (selectedStationId && sale.station_id !== selectedStationId) return false;
    if (selectedPumpId) {
      const pump = pumps?.find(p => p.id === selectedPumpId);
      if (!pump?.nozzles.some(n => n.id === sale.nozzle_id)) return false;
    }
    if (selectedNozzleId && sale.nozzle_id !== selectedNozzleId) return false;
    return true;
  }) || [];

  const todayTotal = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const todayVolume = filteredSales.reduce((sum, sale) => sum + (sale.delta_volume_l || 0), 0);

  const selectedStationIdParsed = parseInt(manualEntry.station_id);
  const selectedPumpIdParsed = parseInt(manualEntry.pump_id);

  const availablePumps = pumps?.filter(pump => 
    !manualEntry.station_id || pump.station_id === selectedStationIdParsed
  ) || [];

  const availableNozzles = availablePumps
    .find(pump => pump.id === selectedPumpIdParsed)?.nozzles || [];

  const handleManualEntry = async () => {
    if (!manualEntry.station_id || !manualEntry.nozzle_id || !manualEntry.cumulative_volume) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createManualEntry.mutateAsync({
        station_id: parseInt(manualEntry.station_id),
        nozzle_id: parseInt(manualEntry.nozzle_id),
        cumulative_volume: parseFloat(manualEntry.cumulative_volume),
        user_id: user?.id || 0
      });

      setIsAddSaleOpen(false);
      setManualEntry({ station_id: '', pump_id: '', nozzle_id: '', cumulative_volume: '' });
      toast({ title: "Success", description: "Manual entry recorded successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record manual entry",
        variant: "destructive",
      });
    }
  };

  const handleDateFilter = (filterType: 'today' | 'range') => {
    setIsToday(filterType === 'today');
    if (filterType === 'today') {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    }
  };

  if (!currentStation && !canAccessAllStations) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No station assigned to your account. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center">Loading sales data...</div>
      </div>
    );
  }

  // Render logic continues (filters, dialog, summary, sales list)...
  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Only changed sections are included above, retain your filters/sales display logic as-is */}
    </div>
  );
}

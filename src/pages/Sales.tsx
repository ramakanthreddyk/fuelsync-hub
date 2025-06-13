
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart3, TrendingUp, Filter, ChartBar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesData } from "@/hooks/useSalesData";
import { usePumpsData } from "@/hooks/usePumpsData";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { useSalesManagement } from "@/hooks/useSalesManagement";
import { SalesCharts } from "@/components/SalesCharts";

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
      <div className="container mx-auto p-4 md:p-6 max-w-7xl ml-4 lg:ml-6">
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
      <div className="container mx-auto p-4 md:p-6 max-w-7xl ml-4 lg:ml-6">
        <div className="text-center">Loading sales data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl ml-4 lg:ml-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground">
            Track and manage sales {currentStation ? `for ${currentStation.name}` : 'across all stations'}
          </p>
        </div>

        <Dialog open={isAddSaleOpen} onOpenChange={setIsAddSaleOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manual Sales Entry</DialogTitle>
              <DialogDescription>
                Select Station → Pump → Nozzle → Enter cumulative volume for automatic calculation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {canAccessAllStations || currentStation ? (
                <div>
                  <Label htmlFor="station_select">Station</Label>
                  <Select
                    value={manualEntry.station_id}
                    onValueChange={(value) => {
                      setManualEntry(prev => ({ ...prev, station_id: value, pump_id: '', nozzle_id: '' }));
                    }}
                    disabled={!canAccessAllStations}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {(canAccessAllStations ? stations : currentStation ? [currentStation] : []).map((station) => (
                        <SelectItem key={station.id} value={station.id.toString()}>
                          {station.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div>
                <Label htmlFor="pump_select">Pump</Label>
                <Select
                  value={manualEntry.pump_id}
                  onValueChange={(value) => {
                    setManualEntry(prev => ({ ...prev, pump_id: value, nozzle_id: '' }));
                  }}
                  disabled={!manualEntry.station_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pump" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePumps.map((pump) => (
                      <SelectItem key={pump.id} value={pump.id.toString()}>
                        {pump.name || `Pump ${pump.pump_sno}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nozzle_select">Nozzle (Price auto-picked from fuel prices)</Label>
                <Select
                  value={manualEntry.nozzle_id}
                  onValueChange={(value) => setManualEntry(prev => ({ ...prev, nozzle_id: value }))}
                  disabled={!manualEntry.pump_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nozzle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNozzles.map((nozzle) => (
                      <SelectItem key={nozzle.id} value={nozzle.id.toString()}>
                        #{nozzle.nozzle_number} - {nozzle.fuel_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cumulative_volume">Cumulative Volume (L) - Total auto-calculated</Label>
                <Input
                  id="cumulative_volume"
                  type="number"
                  step="0.001"
                  value={manualEntry.cumulative_volume}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, cumulative_volume: e.target.value }))}
                  placeholder="e.g., 1234.567"
                />
              </div>

              <Button
                onClick={handleManualEntry}
                disabled={createManualEntry.isPending}
                className="w-full"
              >
                {createManualEntry.isPending ? 'Processing...' : 'Record Entry'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <CardTitle>Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div className="space-y-2">
                  <Label>Date Filter</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={isToday ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleDateFilter('today')}
                    >
                      Today
                    </Button>
                    <Button 
                      variant={!isToday ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleDateFilter('range')}
                    >
                      Range
                    </Button>
                  </div>
                  {!isToday && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        placeholder="From"
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="To"
                      />
                    </div>
                  )}
                  {isToday && (
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  )}
                </div>

                {/* Station Filter */}
                {canAccessAllStations && (
                  <div>
                    <Label>Station</Label>
                    <Select value={selectedStationId?.toString() || 'all'} onValueChange={(value) => {
                      setSelectedStationId(value === 'all' ? null : parseInt(value));
                      setSelectedPumpId(null);
                      setSelectedNozzleId(null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All stations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All stations</SelectItem>
                        {stations.map((station) => (
                          <SelectItem key={station.id} value={station.id.toString()}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Pump Filter */}
                <div>
                  <Label>Pump</Label>
                  <Select value={selectedPumpId?.toString() || 'all'} onValueChange={(value) => {
                    setSelectedPumpId(value === 'all' ? null : parseInt(value));
                    setSelectedNozzleId(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All pumps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All pumps</SelectItem>
                      {pumps?.map((pump) => (
                        <SelectItem key={pump.id} value={pump.id.toString()}>
                          {pump.name || `Pump ${pump.pump_sno}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Nozzle Filter */}
                <div>
                  <Label>Nozzle</Label>
                  <Select value={selectedNozzleId?.toString() || 'all'} onValueChange={(value) => {
                    setSelectedNozzleId(value === 'all' ? null : parseInt(value));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All nozzles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All nozzles</SelectItem>
                      {pumps?.flatMap(pump => 
                        pump.nozzles.map(nozzle => (
                          <SelectItem key={nozzle.id} value={nozzle.id.toString()}>
                            Pump {pump.pump_sno} - #{nozzle.nozzle_number} ({nozzle.fuel_type})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{todayTotal.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {isToday ? 'Today' : `${selectedDate}${endDate ? ` to ${endDate}` : ''}`}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayVolume.toFixed(2)}L</div>
                <p className="text-xs text-muted-foreground">
                  Fuel dispensed
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredSales.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total transactions
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBar className="w-5 h-5" />
                Sales Analytics
              </CardTitle>
              <CardDescription>
                Visual insights into your sales performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesCharts salesData={filteredSales} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Sales list */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Sales Transactions</CardTitle>
              <CardDescription>
                {isToday ? `Today's sales` : `Sales from ${selectedDate}${endDate ? ` to ${endDate}` : ''}`}
                {(selectedStationId || selectedPumpId || selectedNozzleId) && ' (filtered)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSales && filteredSales.length > 0 ? (
                <div className="space-y-4">
                  {filteredSales.map((sale) => (
                    <div key={sale.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div>
                          <p className="font-medium">Nozzle #{sale.nozzle_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">{sale.delta_volume_l.toFixed(3)}L</p>
                          <p className="text-sm text-muted-foreground">
                            @ ₹{sale.price_per_litre.toFixed(2)}/L
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{sale.total_amount.toFixed(2)}</p>
                        <Badge variant="outline">
                          {sale.reading_id ? 'Auto' : 'Manual'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sales found</h3>
                  <p className="text-muted-foreground mb-4">
                    No sales transactions found for the selected filters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

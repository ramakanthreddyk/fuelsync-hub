
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { NozzleReading } from '@/types/api';
import { useToast } from "@/hooks/use-toast";

const NozzleReadings = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [pumpSno, setPumpSno] = useState('');
  const [manualReading, setManualReading] = useState({
    pumpSno: '',
    nozzleId: 1,
    cumulativeVolume: 0,
    readingDate: new Date().toISOString().split('T')[0],
    readingTime: '',
    fuelType: 'Petrol' as 'Petrol' | 'Diesel'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: readingsData, isLoading } = useQuery({
    queryKey: ['nozzle-readings', selectedDate, pumpSno],
    queryFn: async () => {
      const response = await apiService.getNozzleReadings(1, 50, pumpSno, selectedDate);
      return response.data || [];
    }
  });

  const createManualMutation = useMutation({
    mutationFn: (data: typeof manualReading) => apiService.createManualReading(data),
    onSuccess: () => {
      toast({
        title: "Manual Reading Added",
        description: "The nozzle reading has been recorded successfully.",
      });
      setManualReading({
        pumpSno: '',
        nozzleId: 1,
        cumulativeVolume: 0,
        readingDate: new Date().toISOString().split('T')[0],
        readingTime: '',
        fuelType: 'Petrol'
      });
      queryClient.invalidateQueries({ queryKey: ['nozzle-readings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add manual reading.",
        variant: "destructive",
      });
    }
  });

  const handleManualSubmit = () => {
    if (!manualReading.pumpSno || !manualReading.cumulativeVolume) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createManualMutation.mutate(manualReading);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nozzle Readings</h1>
        <p className="text-muted-foreground mt-1">
          View OCR-extracted readings and manually enter pump data.
        </p>
      </div>

      <Tabs defaultValue="readings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="readings">All Readings</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="readings" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pump">Pump Serial Number</Label>
                  <Input
                    id="pump"
                    placeholder="Enter pump S.No."
                    value={pumpSno}
                    onChange={(e) => setPumpSno(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['nozzle-readings'] })}
                    className="w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Readings List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span>
                Nozzle Readings
              </CardTitle>
              <CardDescription>
                All pump nozzle readings from OCR and manual entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <span className="text-2xl">⏳</span>
                  <p className="text-muted-foreground mt-2">Loading readings...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readingsData?.map((reading: NozzleReading) => (
                    <div key={reading.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {reading.isManualEntry ? '✏️' : '📷'}
                        </span>
                        <div>
                          <p className="font-medium">
                            Pump {reading.pumpSno} - Nozzle {reading.nozzleId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reading.readingDate} {reading.readingTime} • {reading.fuelType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reading.isManualEntry ? 'Manual Entry' : 'OCR Extracted'} by {reading.user?.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">{reading.cumulativeVolume}L</p>
                        {reading.litresSold !== undefined && reading.litresSold > 0 && (
                          <>
                            <p className="text-sm text-green-600">
                              +{reading.litresSold}L sold
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ₹{reading.totalAmount?.toFixed(2)}
                            </p>
                          </>
                        )}
                        <Badge variant={reading.isManualEntry ? "secondary" : "default"}>
                          {reading.isManualEntry ? "Manual" : "OCR"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {!readingsData?.length && (
                    <div className="text-center py-8">
                      <span className="text-4xl">📊</span>
                      <p className="text-muted-foreground mt-2">No readings found</p>
                      <p className="text-sm text-muted-foreground">
                        Upload pump images or add manual readings to get started
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          {/* Manual Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✏️</span>
                Manual Entry
              </CardTitle>
              <CardDescription>
                Manually record pump nozzle readings when images are not available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-pump">Pump Serial Number *</Label>
                  <Input
                    id="manual-pump"
                    placeholder="e.g., 1234567"
                    value={manualReading.pumpSno}
                    onChange={(e) => setManualReading({ ...manualReading, pumpSno: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-nozzle">Nozzle ID *</Label>
                  <Select 
                    value={manualReading.nozzleId.toString()} 
                    onValueChange={(value) => setManualReading({ ...manualReading, nozzleId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Nozzle 1</SelectItem>
                      <SelectItem value="2">Nozzle 2</SelectItem>
                      <SelectItem value="3">Nozzle 3</SelectItem>
                      <SelectItem value="4">Nozzle 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-volume">Cumulative Volume (L) *</Label>
                  <Input
                    id="manual-volume"
                    type="number"
                    step="0.001"
                    placeholder="e.g., 12345.67"
                    value={manualReading.cumulativeVolume || ''}
                    onChange={(e) => setManualReading({ ...manualReading, cumulativeVolume: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-fuel">Fuel Type *</Label>
                  <Select 
                    value={manualReading.fuelType} 
                    onValueChange={(value: 'Petrol' | 'Diesel') => setManualReading({ ...manualReading, fuelType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-date">Reading Date *</Label>
                  <Input
                    id="manual-date"
                    type="date"
                    value={manualReading.readingDate}
                    onChange={(e) => setManualReading({ ...manualReading, readingDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-time">Reading Time (Optional)</Label>
                  <Input
                    id="manual-time"
                    type="time"
                    value={manualReading.readingTime}
                    onChange={(e) => setManualReading({ ...manualReading, readingTime: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                onClick={handleManualSubmit} 
                disabled={createManualMutation.isPending}
                className="w-full"
              >
                {createManualMutation.isPending ? (
                  <>
                    <span className="mr-2">⏳</span>
                    Recording...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💾</span>
                    Record Reading
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NozzleReadings;

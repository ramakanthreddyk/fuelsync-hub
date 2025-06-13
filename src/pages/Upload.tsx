
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Upload as UploadIcon, FileText, DollarSign
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useReadingManagement } from "@/hooks/useReadingManagement";
import { usePumpsData } from "@/hooks/usePumpsData";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useSalesManagement } from "@/hooks/useSalesManagement";
import { useAuth } from "@/hooks/useAuth";

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pumpSno, setPumpSno] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [manualData, setManualData] = useState({
    pump_id: '',
    nozzle_id: '',
    cumulative_vol: '',
    reading_date: '',
    reading_time: ''
  });
  const [tenderData, setTenderData] = useState({
    type: '',
    amount: '',
    entry_date: ''
  });

  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedPumpId, setSelectedPumpId] = useState('');

  const userStations = useMemo(() => {
    // Filter or fetch stations owned by the current user
    return allStations.filter(s => s.owner_id === user?.id);
  }, [user, allStations]);

  const stationPumps = useMemo(() => {
    return pumps.filter(p => p.station_id.toString() === selectedStationId);
  }, [pumps, selectedStationId]);

  const pumpNozzles = useMemo(() => {
    return nozzles.filter(n => n.pump_id.toString() === selectedPumpId);
  }, [nozzles, selectedPumpId]);


  const { toast } = useToast();
  const { user } = useAuth();
  const { currentStation } = useRoleAccess();
  const { isLoading, uploadImageForOCR, submitManualReading } = useReadingManagement();
  const { createManualEntry } = useSalesManagement();
  const { data: pumps = [] } = usePumpsData();

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please log in to access the upload functionality.
              </p>
              <Button onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !pumpSno) {
      toast({
        title: "Error",
        description: "Please select a file and pump",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting upload process:', {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      pumpSno,
      userId: user.id
    });

    setIsUploading(true);
    try {
      const result = await uploadImageForOCR(selectedFile, pumpSno);
      if (result) {
        toast({
          title: "Success",
          description: "Receipt uploaded and processed successfully."
        });
        setSelectedFile(null);
        setPumpSno('');
        // Reset file input
        const fileInput = document.getElementById('receipt') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualEntry = async () => {
    if (
      !manualData.pump_id ||
      !manualData.nozzle_id ||
      !manualData.cumulative_vol ||
      !manualData.reading_date ||
      !manualData.reading_time
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!currentStation) {
      toast({
        title: "Error",
        description: "No station selected",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedPump = pumps.find(p => p.id === parseInt(manualData.pump_id));

      const readingData = {
        station_id: currentStation.id,
        pump_sno: selectedPump?.pump_sno ?? '',  // this field is in your table
        nozzle_id: parseInt(manualData.nozzle_id),
        cumulative_vol: parseFloat(manualData.cumulative_vol),
        reading_date: manualData.reading_date,
        reading_time: manualData.reading_time,
        source: 'manual' // required for OCR table
      };

      const result = await submitManualReading(readingData);
      if (result) {
        toast({
          title: "Success",
          description: "Manual reading submitted successfully"
        });
        setManualData({
          pump_id: '',
          nozzle_id: '',
          cumulative_vol: '',
          reading_date: '',
          reading_time: ''
        });
      }
    } catch (error) {
      console.error('Manual entry error:', error);
      toast({
        title: "Error",
        description: "Failed to submit manual reading",
        variant: "destructive"
      });
    }
  };

  const handleTenderEntry = async () => {
    if (!tenderData.type || !tenderData.amount || !tenderData.entry_date) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!currentStation) {
      toast({
        title: "Error",
        description: "No station selected",
        variant: "destructive"
      });
      return;
    }

    try {
      const entryData = {
        station_id: currentStation.id,
        nozzle_id: 1, // Default nozzle for tender entries
        cumulative_volume: parseFloat(tenderData.amount),
        user_id: user?.id || 0
      };

      await createManualEntry.mutateAsync(entryData);
      toast({
        title: "Success",
        description: "Tender entry submitted successfully"
      });
      setTenderData({
        type: '',
        amount: '',
        entry_date: ''
      });
    } catch (error) {
      console.error('Tender entry error:', error);
      toast({
        title: "Error",
        description: "Failed to submit tender entry",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Data Entry</CardTitle>
          <CardDescription>Upload receipts or enter data manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="upload" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="manual">
                <FileText className="mr-2 h-4 w-4" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="tender">
                <DollarSign className="mr-2 h-4 w-4" />
                Tender
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt">Select Receipt Image:</Label>
                  <Input
                    type="file"
                    id="receipt"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pumpSno">Pump Serial Number:</Label>
                  <Select value={pumpSno} onValueChange={setPumpSno} disabled={isUploading}>
                    <SelectTrigger id="pumpSno">
                      <SelectValue placeholder="Select Pump" />
                    </SelectTrigger>
                    <SelectContent>
                      {pumps.map((pump) => (
                        <SelectItem key={pump.id} value={String(pump.pump_sno)}>
                          Pump {pump.pump_sno} - {pump.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile || !pumpSno}
                  className="w-full"
                >
                  {isUploading ? "Processing..." : "Upload & Process"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="station">Select Station:</Label>
                  <Select value={selectedStationId} onValueChange={(value) => {
                    setSelectedStationId(value);
                    setSelectedPumpId('');
                    setManualData(prev => ({ ...prev, nozzle_id: '' }));
                  }}>
                    <SelectTrigger id="station">
                      <SelectValue placeholder="Select your station" />
                    </SelectTrigger>
                    <SelectContent>
                      {userStations.map(station => (
                        <SelectItem key={station.id} value={station.id.toString()}>
                          {station.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStationId && (
                  <div className="space-y-2">
                    <Label htmlFor="pump">Select Pump:</Label>
                    <Select value={selectedPumpId} onValueChange={(value) => {
                      setSelectedPumpId(value);
                      setManualData(prev => ({ ...prev, nozzle_id: '' }));
                    }}>
                      <SelectTrigger id="pump">
                        <SelectValue placeholder="Select pump" />
                      </SelectTrigger>
                      <SelectContent>
                        {stationPumps.map(pump => (
                          <SelectItem key={pump.id} value={pump.id.toString()}>
                            Pump {pump.pump_sno} - {pump.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedPumpId && (
                  <div className="space-y-2">
                    <Label htmlFor="nozzle">Nozzle:</Label>
                    <Select value={manualData.nozzle_id} onValueChange={(value) => setManualData(prev => ({ ...prev, nozzle_id: value }))}>
                      <SelectTrigger id="nozzle">
                        <SelectValue placeholder="Select nozzle" />
                      </SelectTrigger>
                      <SelectContent>
                        {pumpNozzles.map(nozzle => (
                          <SelectItem key={nozzle.id} value={nozzle.id.toString()}>
                            Nozzle {nozzle.nozzle_number} - {nozzle.fuel_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="volume">Cumulative Volume:</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.01"
                    value={manualData.cumulative_vol}
                    onChange={(e) => setManualData(prev => ({ ...prev, cumulative_vol: e.target.value }))}
                    placeholder="Enter volume reading"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Reading Date:</Label>
                    <Input
                      id="date"
                      type="date"
                      value={manualData.reading_date || '2025-06-13'}
                      onChange={(e) => setManualData(prev => ({ ...prev, reading_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Reading Time:</Label>
                    <Input
                      id="time"
                      type="time"
                      value={manualData.reading_time || '19:09'}
                      onChange={(e) => setManualData(prev => ({ ...prev, reading_time: e.target.value }))}
                    />
                  </div>
                </div>

                <Button onClick={handleManualEntry} disabled={isLoading} className="w-full">
                  {isLoading ? "Submitting..." : "Submit Manual Reading"}
                </Button>
              </div>
            </TabsContent>


            <TabsContent value="tender" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenderType">Tender Type:</Label>
                  <Select value={tenderData.type} onValueChange={(value) => setTenderData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger id="tenderType">
                      <SelectValue placeholder="Select tender type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount:</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={tenderData.amount}
                    onChange={(e) => setTenderData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryDate">Entry Date:</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={tenderData.entry_date}
                    onChange={(e) => setTenderData(prev => ({ ...prev, entry_date: e.target.value }))}
                  />
                </div>

                <Button onClick={handleTenderEntry} disabled={createManualEntry.isPending} className="w-full">
                  {createManualEntry.isPending ? "Submitting..." : "Submit Tender Entry"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

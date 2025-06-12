import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Camera, Plus } from "lucide-react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualData, setManualData] = useState({
    pump_sno: '',
    nozzle_number: '',
    cumulative_vol: '',
    reading_date: new Date().toISOString().split('T')[0],
    reading_time: new Date().toTimeString().slice(0, 5)
  });
  const [tenderData, setTenderData] = useState({
    amount: '',
    type: 'cash' as const,
    payer: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const currentStation = user?.stations?.[0];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const handleOCRUpload = async () => {
    if (!selectedFile || !currentStation) return;

    try {
      setLoading(true);
      
      // For now, we'll create a manual entry since OCR processing isn't implemented
      toast({
        title: "OCR Processing",
        description: "OCR processing would happen here. For demo, please use manual entry.",
      });

    } catch (error) {
      console.error('OCR upload error:', error);
      toast({
        title: "Error",
        description: "Failed to process OCR upload",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!currentStation || !manualData.pump_sno || !manualData.nozzle_number || !manualData.cumulative_vol) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First, get the nozzle ID from pump_sno and nozzle_number
      const { data: pumps, error: pumpError } = await supabase
        .from('pumps')
        .select('id')
        .eq('station_id', currentStation.id)
        .eq('pump_sno', manualData.pump_sno)
        .single();

      if (pumpError || !pumps) {
        throw new Error('Pump not found');
      }

      const { data: nozzles, error: nozzleError } = await supabase
        .from('nozzles')
        .select('id')
        .eq('pump_id', pumps.id)
        .eq('nozzle_number', parseInt(manualData.nozzle_number))
        .single();

      if (nozzleError || !nozzles) {
        throw new Error('Nozzle not found');
      }

      // Create OCR reading
      const { error: readingError } = await supabase
        .from('ocr_readings')
        .insert({
          station_id: currentStation.id,
          nozzle_id: nozzles.id,
          cumulative_vol: parseFloat(manualData.cumulative_vol),
          reading_date: manualData.reading_date,
          reading_time: manualData.reading_time,
          source: 'manual_entry',
          created_by: user?.id
        });

      if (readingError) throw readingError;

      toast({
        title: "Success",
        description: "Manual reading recorded successfully",
      });

      // Reset form
      setManualData({
        pump_sno: '',
        nozzle_number: '',
        cumulative_vol: '',
        reading_date: new Date().toISOString().split('T')[0],
        reading_time: new Date().toTimeString().slice(0, 5)
      });

    } catch (error) {
      console.error('Manual entry error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record reading",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTenderEntry = async () => {
    if (!currentStation || !tenderData.amount) {
      toast({
        title: "Missing Information",
        description: "Please enter the tender amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('tender_entries')
        .insert({
          station_id: currentStation.id,
          user_id: user?.id,
          amount: parseFloat(tenderData.amount),
          type: tenderData.type,
          payer: tenderData.payer || null,
          entry_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tender entry recorded successfully",
      });

      // Reset form
      setTenderData({
        amount: '',
        type: 'cash',
        payer: ''
      });

    } catch (error) {
      console.error('Tender entry error:', error);
      toast({
        title: "Error",
        description: "Failed to record tender entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentStation) {
    return (
      <div className="container mx-auto p-6">
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Entry</h1>
        <p className="text-muted-foreground">Record pump readings and tender entries</p>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="ocr">OCR Upload</TabsTrigger>
          <TabsTrigger value="tender">Tender Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Manual Reading Entry
              </CardTitle>
              <CardDescription>
                Manually enter pump readings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pump_sno">Pump Serial Number</Label>
                  <Input
                    id="pump_sno"
                    value={manualData.pump_sno}
                    onChange={(e) => setManualData(prev => ({ ...prev, pump_sno: e.target.value }))}
                    placeholder="e.g., P001"
                  />
                </div>
                <div>
                  <Label htmlFor="nozzle_number">Nozzle Number</Label>
                  <Input
                    id="nozzle_number"
                    value={manualData.nozzle_number}
                    onChange={(e) => setManualData(prev => ({ ...prev, nozzle_number: e.target.value }))}
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cumulative_vol">Cumulative Volume (Litres)</Label>
                <Input
                  id="cumulative_vol"
                  type="number"
                  step="0.001"
                  value={manualData.cumulative_vol}
                  onChange={(e) => setManualData(prev => ({ ...prev, cumulative_vol: e.target.value }))}
                  placeholder="e.g., 12345.678"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reading_date">Reading Date</Label>
                  <Input
                    id="reading_date"
                    type="date"
                    value={manualData.reading_date}
                    onChange={(e) => setManualData(prev => ({ ...prev, reading_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reading_time">Reading Time</Label>
                  <Input
                    id="reading_time"
                    type="time"
                    value={manualData.reading_time}
                    onChange={(e) => setManualData(prev => ({ ...prev, reading_time: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleManualEntry} disabled={loading} className="w-full">
                {loading ? 'Recording...' : 'Record Reading'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ocr">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                OCR Image Upload
              </CardTitle>
              <CardDescription>
                Upload an image of pump display for automatic reading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Upload Image</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>

              {selectedFile && (
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <Button onClick={handleOCRUpload} disabled={!selectedFile || loading} className="w-full">
                {loading ? 'Processing...' : 'Process Image'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tender">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Tender Entry
              </CardTitle>
              <CardDescription>
                Record cash, card, or UPI payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={tenderData.amount}
                  onChange={(e) => setTenderData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g., 1500.00"
                />
              </div>

              <div>
                <Label htmlFor="type">Payment Type</Label>
                <Select value={tenderData.type} onValueChange={(value: any) => setTenderData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payer">Payer Name (Optional)</Label>
                <Input
                  id="payer"
                  value={tenderData.payer}
                  onChange={(e) => setTenderData(prev => ({ ...prev, payer: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>

              <Button onClick={handleTenderEntry} disabled={loading} className="w-full">
                {loading ? 'Recording...' : 'Record Tender'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

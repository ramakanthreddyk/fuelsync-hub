import React, { useState } from 'react';
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
import { supabase } from "@/integrations/supabase/client";

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pumpSno, setPumpSno] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [manualData, setManualData] = useState({
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

  const { toast } = useToast();
  const { user } = useAuth();
  const { currentStation } = useRoleAccess();
  const { isLoading, uploadImageForOCR, submitManualReading } = useReadingManagement();
  const { createManualEntry } = useSalesManagement();
  const { data: pumps = [] } = usePumpsData();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !pumpSno) {
      toast({ title: "Error", description: "Please select a file and pump", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const result = await uploadImageForOCR(selectedFile, pumpSno);
      if (result) {
        toast({ title: "Success", description: "Receipt uploaded and processed." });
        setSelectedFile(null);
        setPumpSno('');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!currentStation?.id || !user?.id) {
      toast({ title: "Error", description: "Station or user info missing", variant: "destructive" });
      return;
    }
    const result = await createManualEntry.mutateAsync({
      station_id: Number(currentStation.id),
      nozzle_id: Number(manualData.nozzle_id),
      cumulative_volume: Number(manualData.cumulative_vol),
      user_id: user.id
    });
    if (result) {
      toast({ title: "Success", description: "Manual reading saved." });
      setManualData({ nozzle_id: '', cumulative_vol: '', reading_date: '', reading_time: '' });
    }
  };

  const handleTenderEntry = async () => {
    if (!currentStation?.id) {
      toast({ title: "Error", description: "Station info missing", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('tender_entries').insert({
      station_id: Number(currentStation.id),
      type: tenderData.type,
      amount: Number(tenderData.amount),
      entry_date: tenderData.entry_date,
      created_by: user?.id
    });
    if (!error) {
      toast({ title: "Success", description: "Tender entry saved." });
      setTenderData({ type: '', amount: '', entry_date: '' });
    } else {
      toast({ title: "Error", description: "Failed to save tender entry", variant: "destructive" });
    }
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Data Entry</CardTitle>
          <CardDescription>Upload receipts or enter data manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="upload" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upload"><UploadIcon className="mr-2 h-4 w-4" />Upload</TabsTrigger>
              <TabsTrigger value="manual"><FileText className="mr-2 h-4 w-4" />Manual</TabsTrigger>
              <TabsTrigger value="tender"><DollarSign className="mr-2 h-4 w-4" />Tender</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="receipt">Select Receipt:</Label>
                  <Input type="file" id="receipt" onChange={handleFileSelect} />
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="pumpSno">Pump S.No:</Label>
                  <Select value={pumpSno} onValueChange={setPumpSno}>
                    <SelectTrigger id="pumpSno" className="w-[200px]">
                      <SelectValue placeholder="Select Pump" />
                    </SelectTrigger>
                    <SelectContent>
                      {pumps.map((pump) => (
                        <SelectItem key={pump.id} value={String(pump.pump_sno)}>{pump.pump_sno}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !pumpSno}>
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manual">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nozzle ID:</Label>
                    <Input
                      type="number"
                      value={manualData.nozzle_id}
                      onChange={(e) => setManualData({ ...manualData, nozzle_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Volume:</Label>
                    <Input
                      type="number"
                      value={manualData.cumulative_vol}
                      onChange={(e) => setManualData({ ...manualData, cumulative_vol: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date:</Label>
                    <Input
                      type="date"
                      value={manualData.reading_date}
                      onChange={(e) => setManualData({ ...manualData, reading_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Time:</Label>
                    <Input
                      type="time"
                      value={manualData.reading_time}
                      onChange={(e) => setManualData({ ...manualData, reading_time: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleManualEntry} disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Reading"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="tender">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type:</Label>
                    <Select onValueChange={(v) => setTenderData({ ...tenderData, type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount:</Label>
                    <Input
                      type="number"
                      value={tenderData.amount}
                      onChange={(e) => setTenderData({ ...tenderData, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Date:</Label>
                  <Input
                    type="date"
                    value={tenderData.entry_date}
                    onChange={(e) => setTenderData({ ...tenderData, entry_date: e.target.value })}
                  />
                </div>
                <Button onClick={handleTenderEntry}>Submit Tender</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

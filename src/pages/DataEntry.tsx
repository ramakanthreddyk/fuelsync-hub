
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useReadingManagement } from '@/hooks/useReadingManagement';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from '@/components/inputs/CurrencyInput';
import { Textarea } from '@/components/ui/textarea';
import { Upload as UploadIcon } from 'lucide-react';

const useUserStations = () => {
  const [userStations, setUserStations] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('stations').select('id, name').then(({ data }) => setUserStations(data || []));
  }, []);
  return { userStations };
};

interface ManualEntryData {
  station_id: number;
  nozzle_id: number;
  cumulative_vol: number;
  reading_date: string;
  reading_time: string;
}

interface TenderEntryData {
  station_id: number;
  entry_date: string;
  type: 'cash' | 'card' | 'upi' | 'credit';
  payer: string;
  amount: string;
}

interface RefillData {
  station_id: number;
  fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
  quantity_l: number;
  filled_at: string;
}

export default function DataEntry() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userStations } = useUserStations();
  const { session } = useAuth();

  // Reading management for OCR upload
  const { isLoading: ocrLoading, uploadImageForOCR } = useReadingManagement();
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPumpSno, setOcrPumpSno] = useState('');
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Manual Forms Hookups (as per previous version)
  const {
    register: registerManual,
    handleSubmit: handleSubmitManual,
    formState: { errors: manualErrors },
    reset: resetManual,
    setValue: setManualValue,
    watch: watchManual
  } = useForm<ManualEntryData>({
    defaultValues: {
      station_id: userStations[0]?.id || 0,
      nozzle_id: 1,
      cumulative_vol: 0,
      reading_date: format(new Date(), 'yyyy-MM-dd'),
      reading_time: format(new Date(), 'HH:mm'),
    }
  });

  const {
    register: registerTender,
    handleSubmit: handleSubmitTender,
    formState: { errors: tenderErrors },
    reset: resetTender,
    setValue: setTenderValue,
    watch: watchTender
  } = useForm<TenderEntryData>({
    defaultValues: {
      station_id: userStations[0]?.id || 0,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      type: 'cash',
      payer: '',
      amount: ''
    }
  });

  const {
    register: registerRefill,
    handleSubmit: handleSubmitRefill,
    formState: { errors: refillErrors },
    reset: resetRefill,
    setValue: setRefillValue,
    watch: watchRefill
  } = useForm<RefillData>({
    defaultValues: {
      station_id: userStations[0]?.id || 0,
      fuel_type: 'PETROL',
      quantity_l: 0,
      filled_at: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  useEffect(() => {
    // sync forms when stations are ready
    if (userStations.length > 0) {
      setManualValue('station_id', userStations[0].id);
      setTenderValue('station_id', userStations[0].id);
      setRefillValue('station_id', userStations[0].id);
    }
  }, [userStations, setManualValue, setTenderValue, setRefillValue]);

  // --- OCR Upload ---
  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setOcrFile(file || null);
  };
  const handleOcrUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocrFile || !ocrPumpSno) {
      toast.error('Please provide an image/PDF and pump serial number');
      return;
    }
    setOcrResult(null);
    toast.info('Processing OCR upload...');
    const result = await uploadImageForOCR(ocrFile, ocrPumpSno);
    if (result && result.success) {
      setOcrResult(result.data.ocr_preview);
      toast.success(`OCR processed: ${result.data.readings_inserted} readings`);
    } else {
      toast.error('OCR upload failed');
    }
  };

  // -- Manual entry handlers (same as before) --
  const onSubmitManual = async (data: ManualEntryData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/functions/v1/manual-reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        toast.success('Manual reading added successfully');
        resetManual();
      } else {
        throw new Error('Failed to add manual reading');
      }
    } catch (error) {
      toast.error('Error adding manual reading');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitTender = async (data: TenderEntryData) => {
    try {
      setIsSubmitting(true);
      const numericAmount = parseFloat(data.amount.replace(/[^\d.]/g, ''));
      const response = await fetch(`/api/functions/v1/tender-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ ...data, amount: numericAmount })
      });
      if (response.ok) {
        toast.success('Tender entry added successfully');
        resetTender();
      } else {
        throw new Error('Failed to add tender entry');
      }
    } catch (error) {
      toast.error('Error adding tender entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitRefill = async (data: RefillData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/functions/v1/tank-refills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        toast.success('Tank refill added successfully');
        resetRefill();
      } else {
        throw new Error('Failed to add tank refill');
      }
    } catch (error) {
      toast.error('Error adding tank refill');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI Renders ---
  // New styling: Inset card, 2-col on md+, stacked on mobile, modern layout + OCR/Manual tabs with icons.
  return (
    <div className="flex justify-center py-8 px-2">
      <Card className="w-full max-w-3xl shadow-lg animate-fade-in">
        <CardHeader>
          <CardTitle>Data Entry & OCR</CardTitle>
          <CardDescription>
            Enter readings, tender, refill, or upload slip for instant OCR!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ocr" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ocr" className="flex items-center gap-2"><UploadIcon className="w-4 h-4" /> OCR Upload</TabsTrigger>
              <TabsTrigger value="manual">Manual Reading</TabsTrigger>
              <TabsTrigger value="tender">Tender Entry</TabsTrigger>
              <TabsTrigger value="refill">Tank Refill</TabsTrigger>
            </TabsList>
            {/* --- OCR Tab --- */}
            <TabsContent value="ocr">
              <form onSubmit={handleOcrUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ocr-file">Receipt Image/PDF</Label>
                  <Input
                    id="ocr-file"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleOcrFileChange}
                    required
                    className="file:bg-primary file:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ocr-pump-sno">Pump Serial No.</Label>
                  <Input
                    id="ocr-pump-sno"
                    value={ocrPumpSno}
                    onChange={e => setOcrPumpSno(e.target.value)}
                    placeholder="Enter pump S.No"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Button disabled={ocrLoading} className="w-full">
                    {ocrLoading ? "Processing..." : "Upload & Run OCR"}
                  </Button>
                </div>
              </form>
              {/* OCR result preview */}
              {ocrResult && (
                <div className="mt-6 bg-muted/40 p-4 rounded">
                  <h4 className="font-bold mb-2">OCR Preview</h4>
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(ocrResult, null, 2)}</pre>
                </div>
              )}
            </TabsContent>
            {/* --- Manual Tab --- */}
            <TabsContent value="manual">
              <form onSubmit={handleSubmitManual(onSubmitManual)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="manual-station">Station</Label>
                    <Select
                      value={watchManual('station_id')?.toString() || ''}
                      onValueChange={(value) => setManualValue('station_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                      <SelectContent>
                        {userStations.map((station) => (
                          <SelectItem key={station.id} value={station.id.toString()}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-nozzle">Nozzle ID</Label>
                    <Input
                      id="manual-nozzle"
                      type="number"
                      {...registerManual('nozzle_id', { required: 'Nozzle ID is required', valueAsNumber: true })}
                    />
                    {manualErrors.nozzle_id && (
                      <p className="text-sm text-red-600">{manualErrors.nozzle_id.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-volume">Cumulative Volume</Label>
                    <Input
                      id="manual-volume"
                      type="number"
                      step="0.001"
                      {...registerManual('cumulative_vol', { required: 'Volume is required', valueAsNumber: true })}
                    />
                    {manualErrors.cumulative_vol && (
                      <p className="text-sm text-red-600">{manualErrors.cumulative_vol.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-date">Date</Label>
                    <Input
                      id="manual-date"
                      type="date"
                      {...registerManual('reading_date', { required: 'Date is required' })}
                    />
                    {manualErrors.reading_date && (
                      <p className="text-sm text-red-600">{manualErrors.reading_date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-time">Time</Label>
                    <Input
                      id="manual-time"
                      type="time"
                      {...registerManual('reading_time', { required: 'Time is required' })}
                    />
                    {manualErrors.reading_time && (
                      <p className="text-sm text-red-600">{manualErrors.reading_time.message}</p>
                    )}
                  </div>
                </div>
                <Button disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Submitting...' : 'Add Manual Reading'}
                </Button>
              </form>
            </TabsContent>
            {/* --- Tender Entry --- */}
            <TabsContent value="tender">
              <form onSubmit={handleSubmitTender(onSubmitTender)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tender-station">Station</Label>
                    <Select 
                      value={watchTender('station_id')?.toString() || ''} 
                      onValueChange={(value) => setTenderValue('station_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                      <SelectContent>
                        {userStations.map((station) => (
                          <SelectItem key={station.id} value={station.id.toString()}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-date">Date</Label>
                    <Input
                      id="tender-date"
                      type="date"
                      {...registerTender('entry_date', { required: 'Date is required' })}
                    />
                    {tenderErrors.entry_date && (
                      <p className="text-sm text-red-600">{tenderErrors.entry_date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-type">Payment Type</Label>
                    <Select 
                      value={watchTender('type') || ''} 
                      onValueChange={value => setTenderValue('type', value as 'cash' | 'card' | 'upi' | 'credit')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                    {tenderErrors.type && (
                      <p className="text-sm text-red-600">{tenderErrors.type.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-amount">Amount</Label>
                    <CurrencyInput
                      value={watchTender('amount')}
                      onChange={value => setTenderValue('amount', value)}
                      placeholder="₹0.00"
                    />
                    {tenderErrors.amount && (
                      <p className="text-sm text-red-600">{tenderErrors.amount.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tender-payer">Payer Name</Label>
                    <Input
                      id="tender-payer"
                      placeholder="Enter payer name"
                      {...registerTender('payer', { required: 'Payer name is required' })}
                    />
                    {tenderErrors.payer && (
                      <p className="text-sm text-red-600">{tenderErrors.payer.message}</p>
                    )}
                  </div>
                </div>
                <Button disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Submitting...' : 'Add Tender Entry'}
                </Button>
              </form>
            </TabsContent>
            {/* --- Refill Entry --- */}
            <TabsContent value="refill">
              <form onSubmit={handleSubmitRefill(onSubmitRefill)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="refill-station">Station</Label>
                    <Select
                      value={watchRefill('station_id')?.toString() || ''}
                      onValueChange={(value) => setRefillValue('station_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                      <SelectContent>
                        {userStations.map((station) => (
                          <SelectItem key={station.id} value={station.id.toString()}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refill-fuel">Fuel Type</Label>
                    <Select
                      value={watchRefill('fuel_type')}
                      onValueChange={value => setRefillValue('fuel_type', value as 'PETROL' | 'DIESEL' | 'CNG' | 'EV')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PETROL">Petrol</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                        <SelectItem value="CNG">CNG</SelectItem>
                        <SelectItem value="EV">EV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refill-quantity">Quantity (L)</Label>
                    <Input
                      id="refill-quantity"
                      type="number"
                      step="100"
                      {...registerRefill('quantity_l', { required: 'Quantity is required', valueAsNumber: true })}
                    />
                    {refillErrors.quantity_l && (
                      <p className="text-sm text-red-600">{refillErrors.quantity_l.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refill-date">Filled At</Label>
                    <Input
                      id="refill-date"
                      type="date"
                      {...registerRefill('filled_at', { required: 'Date is required' })}
                    />
                    {refillErrors.filled_at && (
                      <p className="text-sm text-red-600">{refillErrors.filled_at.message}</p>
                    )}
                  </div>
                </div>
                <Button disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Submitting...' : 'Add Tank Refill'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useReadingManagement } from '@/hooks/useReadingManagement';
import { supabase } from '@/integrations/supabase/client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from '@/components/inputs/CurrencyInput';
import { Textarea } from '@/components/ui/textarea';
import { Upload as UploadIcon, IndianRupee, Fuel } from 'lucide-react';

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

  // -- Manual entry handlers --
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
  // Layout: Remove Card, maximize width, gentle container with tabs.
  return (
    <div className="flex flex-col items-center bg-gradient-to-tr from-primary/10 via-muted/40 to-secondary/20 min-h-[100vh] py-10 px-2 transition-all duration-500">
      <div className="w-full max-w-4xl animate-fade-in">
        <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-primary">
              <UploadIcon className="w-7 h-7 text-fuel-blue" />
              Data Entry <span className="text-fuel-blue text-lg">•</span>
            </div>
            <div className="mt-1 text-muted-foreground text-base">
              Upload OCR, add readings, tenders, or tank refills quickly.
            </div>
          </div>
          <span className="rounded px-2 py-0.5 text-xs bg-primary/10 text-primary font-medium mt-3 md:mt-0 shadow">
            Fast entry & OCR in one place!
          </span>
        </div>
        <Tabs defaultValue="ocr" className="space-y-6 w-full">
          <TabsList className="grid grid-cols-4 gap-2 md:gap-4 w-full mx-auto mb-4">
            <TabsTrigger value="ocr" className="flex flex-col items-center gap-1 text-sm font-medium">
              <UploadIcon className="w-5 h-5 text-fuel-blue" />
              <span className="text-fuel-blue">OCR Upload</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex flex-col items-center gap-1 text-sm font-medium">
              <span className="inline-block w-5 h-5 bg-fuel-orange/90 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                M
              </span>
              <span className="text-fuel-orange">Manual Reading</span>
            </TabsTrigger>
            <TabsTrigger value="tender" className="flex flex-col items-center gap-1 text-sm font-medium">
              <IndianRupee className="w-5 h-5 text-green-600" />
              <span className="text-green-700">Tender Entry</span>
            </TabsTrigger>
            <TabsTrigger value="refill" className="flex flex-col items-center gap-1 text-sm font-medium">
              <Fuel className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-700">Tank Refill</span>
            </TabsTrigger>
          </TabsList>
          {/* --- OCR Tab --- */}
          <TabsContent value="ocr">
            <div className="rounded-xl p-6 mb-6 shadow-sm bg-sky-50 border border-border/30">
              <h3 className="text-fuel-blue text-xl font-semibold mb-4 flex items-center gap-2">
                <UploadIcon className="w-5 h-5 text-fuel-blue" /> OCR Upload
              </h3>
              <form onSubmit={handleOcrUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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
                <div className="md:col-span-2 mt-2">
                  <Button
                    disabled={ocrLoading}
                    className="w-full text-base py-2"
                  >
                    {ocrLoading ? "Processing..." : "Upload & Run OCR"}
                  </Button>
                </div>
              </form>
              {/* OCR result preview */}
              {ocrResult && (
                <div className="mt-6 bg-muted/50 p-4 rounded border border-muted-foreground/10">
                  <h4 className="font-bold mb-2 text-fuel-blue">OCR Preview</h4>
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(ocrResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </TabsContent>
          {/* --- Manual Tab --- */}
          <TabsContent value="manual">
            <div className="rounded-xl p-6 mb-6 shadow-sm bg-orange-50 border border-border/30">
              <h3 className="text-fuel-orange text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="inline-block w-6 h-6 bg-fuel-orange rounded-full flex items-center justify-center text-white text-sm font-bold">M</span>
                Manual Reading
              </h3>
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
                    <Label htmlFor="manual-volume">Cumulative Volume (L)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">₹</span>
                      <Input
                        id="manual-volume"
                        type="number"
                        step="0.001"
                        className="pl-7"
                        {...registerManual('cumulative_vol', { required: 'Volume is required', valueAsNumber: true })}
                      />
                    </div>
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
                <Button disabled={isSubmitting} className="w-full text-base py-2">
                  {isSubmitting ? 'Submitting...' : 'Add Manual Reading'}
                </Button>
              </form>
            </div>
          </TabsContent>
          {/* --- Tender Entry --- */}
          <TabsContent value="tender">
            <div className="rounded-xl p-6 mb-6 shadow-sm bg-green-50 border border-border/30">
              <h3 className="text-green-700 text-xl font-semibold mb-4 flex items-center gap-2">
                <IndianRupee className="w-6 h-6 text-green-700" />
                Tender Entry
              </h3>
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
                <Button disabled={isSubmitting} className="w-full text-base py-2">
                  {isSubmitting ? 'Submitting...' : 'Add Tender Entry'}
                </Button>
              </form>
            </div>
          </TabsContent>
          {/* --- Refill Entry --- */}
          <TabsContent value="refill">
            <div className="rounded-xl p-6 mb-6 shadow-sm bg-yellow-50 border border-border/30">
              <h3 className="text-yellow-700 text-xl font-semibold mb-4 flex items-center gap-2">
                <Fuel className="w-6 h-6 text-yellow-500" />
                Tank Refill
              </h3>
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
                <Button disabled={isSubmitting} className="w-full text-base py-2">
                  {isSubmitting ? 'Submitting...' : 'Add Tank Refill'}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

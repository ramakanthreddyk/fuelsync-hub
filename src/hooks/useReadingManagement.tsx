import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ManualReadingData {
  station_id: number;
  nozzle_id: number;
  cumulative_vol: number;
  reading_date: string;
  reading_time: string;
}

export interface OCRUploadResult {
  success: boolean;
  data: {
    readings_inserted: number;
    ocr_preview: any;
    readings: any[];
  };
}

export interface ManualReadingResult {
  success: boolean;
  data: any;
}

export const useReadingManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const uploadImageForOCR = async (file: File, pumpSno?: string): Promise<OCRUploadResult | null> => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      if (pumpSno) formData.append("pump_sno", pumpSno);

      const { data, error } = await supabase.functions.invoke("ocr-upload", {
        body: formData as any, // Supabase currently lacks full FormData types
      });

      if (error) throw error;

      toast({
        title: "OCR Processing Complete",
        description: `Successfully processed ${data.inserted} readings`,
      });

      return {
        success: true,
        data: {
          readings_inserted: data.inserted,
          ocr_preview: data.ocr,
          readings: data.ocr.nozzles,
        },
      };
    } catch (error: any) {
      console.error("OCR upload error:", error);
      toast({
        title: "OCR Upload Failed",
        description: error.message || "Unexpected error",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const submitManualReading = async (readingData: ManualReadingData): Promise<ManualReadingResult | null> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('manual-reading', {
        body: readingData,
      });

      if (error) {
        console.error('Manual reading error:', error);
        toast({
          title: "Manual Reading Failed",
          description: error.message || "Failed to save reading",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Reading Saved",
        description: "Manual reading recorded successfully",
      });

      return data;
    } catch (error) {
      console.error('Manual reading error:', error);
      toast({
        title: "Manual Reading Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    uploadImageForOCR,
    submitManualReading,
  };
};

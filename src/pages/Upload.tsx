
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
import { DataEntryStickyBar } from "@/components/DataEntryStickyBar";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useReadingManagement } from "@/hooks/useReadingManagement";
import { useSalesManagement } from "@/hooks/useSalesManagement";
import { useAuth } from "@/hooks/useAuth";

const tenderTypes = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "credit", label: "Credit" },
  { value: "refill", label: "Refill" },
];

// Zod schemas for validation (you can expand as needed)
const tenderSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Amount is required" })
    .positive("Enter a valid amount")
    .refine(val => !isNaN(val), "Amount is required"),
  type: z.string().nonempty("Tender type is required"),
  date: z.date({ required_error: "Date is required" })
});
type TenderFormValues = z.infer<typeof tenderSchema>;

export default function Upload() {
  const [activeTab, setActiveTab] = useState<"ocr" | "manual" | "tender" | "refill">("ocr");
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentStation } = useRoleAccess();
  const { submitManualReading } = useReadingManagement();
  const { createManualEntry } = useSalesManagement();
  // Tender form state/logic
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<TenderFormValues>({
    resolver: zodResolver(tenderSchema),
    defaultValues: {
      amount: "",
      type: "",
      date: undefined,
    } as any,
  });

  // Format INR currency for label
  const currencyValue = watch("amount");
  const formattedINR = typeof currencyValue === "number"
    ? currencyValue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })
    : "";

  // If user is not authenticated, show message
  if (!user) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="bg-muted px-6 py-8 rounded-lg border max-w-sm w-full space-y-4 text-center">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <Button variant="outline" onClick={() => (window.location.href = "/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Tender form submit logic
  const onTenderSubmit = async (values: TenderFormValues) => {
    if (!currentStation) {
      toast({
        title: "Error",
        description: "No station selected.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createManualEntry.mutateAsync({
        station_id: currentStation.id,
        nozzle_id: 1, // Default nozzle for tender entries
        cumulative_volume: values.amount,
        user_id: user?.id || 0,
        type: values.type,
        entry_date: values.date ? format(values.date, "yyyy-MM-dd") : "",
      });
      toast({
        title: "Success",
        description: "Tender entry submitted successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to submit tender entry",
        variant: "destructive",
      });
    }
  };

  // RENDER
  return (
    <div className="w-full max-w-[510px] mx-auto py-6 min-h-[90vh] relative">
      {/* Top Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="ocr">OCR</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="tender">Tender</TabsTrigger>
          <TabsTrigger value="refill">Refill</TabsTrigger>
        </TabsList>
        {/* OCR Mode */}
        <TabsContent value="ocr" className="mt-5">
          {/* Replace with your OCR upload form, styled flat */}
          <div className="bg-muted/50 p-6 rounded-2xl border">
            <h3 className="font-semibold mb-4">Upload Receipt (OCR)</h3>
            <div className="space-y-3">
              {/* ...OCR upload fields (could bring from previous code or componentize)... */}
              <Label htmlFor="ocr-file">Receipt image</Label>
              <Input id="ocr-file" type="file" accept="image/*,.pdf"/>
              <Label className="mt-2" htmlFor="ocr-pump">Pump Serial Number</Label>
              <Input id="ocr-pump" placeholder="e.g., P001" />
              <Button variant="outline" className="w-full mt-4">Upload &amp; Process</Button>
            </div>
          </div>
        </TabsContent>
        {/* Manual Mode */}
        <TabsContent value="manual" className="mt-5">
          <div className="bg-muted/50 p-6 rounded-2xl border">
            <h3 className="font-semibold mb-4">Manual Reading</h3>
            {/* Replace with your manual reading form ... */}
            <div className="space-y-3">
              <Label htmlFor="manual-pump">Pump</Label>
              <Input id="manual-pump" placeholder="Select pump" />
              <Label htmlFor="manual-nozzle">Nozzle</Label>
              <Input id="manual-nozzle" placeholder="Select nozzle" />
              <Label htmlFor="manual-volume">Cumulative Volume (L)</Label>
              <Input id="manual-volume" type="number" step="0.01" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="manual-date">Reading Date</Label>
                  <Input id="manual-date" type="date" />
                </div>
                <div>
                  <Label htmlFor="manual-time">Reading Time</Label>
                  <Input id="manual-time" type="time" />
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">Submit Manual Reading</Button>
            </div>
          </div>
        </TabsContent>
        {/* Tender Mode */}
        <TabsContent value="tender" className="mt-5">
          <form
            onSubmit={handleSubmit(onTenderSubmit)}
            className="bg-muted/50 p-6 rounded-2xl border"
            autoComplete="off"
          >
            <h3 className="font-semibold mb-4">Tender Entry</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tender-type">Tender Type<span className="text-destructive">*</span></Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tender-type">
                        <SelectValue placeholder="Select tender type" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenderTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <span className="block text-xs text-destructive mt-1">{errors.type.message}</span>}
              </div>
              <div>
                <Label htmlFor="tender-amount">Amount (₹)<span className="text-destructive">*</span></Label>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <CurrencyInput
                      {...field}
                      onChange={(e) => {
                        // Only allow digits and dot
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setValue("amount", val, { shouldValidate: true });
                      }}
                    />
                  )}
                />
                {errors.amount && <span className="block text-xs text-destructive mt-1">{errors.amount.message}</span>}
                {currencyValue && !errors.amount && (
                  <span className="block text-xs text-muted-foreground mt-1">INR: {formattedINR}</span>
                )}
              </div>
              <div>
                <Label htmlFor="tender-date">Entry Date<span className="text-destructive">*</span></Label>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={"w-full justify-start text-left font-normal " + (!field.value && "text-muted-foreground")}
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.date && <span className="block text-xs text-destructive mt-1">{errors.date.message}</span>}
              </div>
            </div>
            {/* Sticky Footer Save Bar */}
            <div className="h-16"></div> {/* To allow room for sticky bar */}
            <DataEntryStickyBar isDisabled={isSubmitting} label="Submit Tender Entry" />
          </form>
        </TabsContent>
        {/* Refill Mode (Placeholder for UX parity) */}
        <TabsContent value="refill" className="mt-5">
          <div className="bg-muted/50 p-6 rounded-2xl border">
            <h3 className="font-semibold mb-4">Refill Entry</h3>
            {/* ... add refill fields as required ... */}
            <Label>Coming soon...</Label>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ...end of Upload.tsx

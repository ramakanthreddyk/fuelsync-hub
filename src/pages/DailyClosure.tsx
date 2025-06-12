import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, DollarSign, TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";

interface DailySummary {
  cash: number;
  card: number;
  upi: number;
  credit: number;
  total: number;
}

export default function DailyClosure() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [tenderSummary, setTenderSummary] = useState<DailySummary>({
    cash: 0,
    card: 0,
    upi: 0,
    credit: 0,
    total: 0
  });
  const [salesTotal, setSalesTotal] = useState(0);
  const [existingClosure, setExistingClosure] = useState<any>(null);

  const currentStation = user?.stations?.[0];
  const difference = salesTotal - tenderSummary.total;

  useEffect(() => {
    if (currentStation && selectedDate) {
      loadDayData();
    }
  }, [currentStation, selectedDate]);

  const loadDayData = async () => {
    if (!currentStation) return;

    setIsLoading(true);
    try {
      // Load tender summary
      const { data: tenderData, error: tenderError } = await supabase
        .from('tender_entries')
        .select('type, amount')
        .eq('station_id', currentStation.id)
        .eq('entry_date', selectedDate);

      if (tenderError) throw tenderError;

      const summary = {
        cash: 0,
        card: 0,
        upi: 0,
        credit: 0,
        total: 0
      };

      tenderData?.forEach(entry => {
        const amount = entry.amount || 0;
        if (entry.type === 'cash') summary.cash += amount;
        else if (entry.type === 'card') summary.card += amount;
        else if (entry.type === 'upi') summary.upi += amount;
        else if (entry.type === 'credit') summary.credit += amount;
        summary.total += amount;
      });

      setTenderSummary(summary);

      // Load sales total
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('station_id', currentStation.id)
        .gte('created_at', `${selectedDate}T00:00:00Z`)
        .lt('created_at', `${selectedDate}T23:59:59Z`);

      if (salesError) throw salesError;

      const total = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      setSalesTotal(total);

      // Check if closure already exists
      const { data: closureData } = await supabase
        .from('daily_closure')
        .select('*')
        .eq('station_id', currentStation.id)
        .eq('date', selectedDate)
        .single();

      setExistingClosure(closureData);

    } catch (error: any) {
      console.error('Error loading day data:', error);
      toast({
        title: "Error",
        description: "Failed to load daily data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performDailyClosure = async () => {
    if (!currentStation) return;

    setIsClosing(true);
    try {
      const { error } = await supabase
        .from('daily_closure')
        .insert({
          station_id: currentStation.id,
          date: selectedDate,
          sales_total: salesTotal,
          tender_total: tenderSummary.total,
          difference: difference,
          closed_by: user?.id,
          closed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily closure completed successfully",
      });

      // Reload data to show the closure
      loadDayData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform daily closure",
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
    }
  };

  const getDifferenceDisplay = () => {
    if (Math.abs(difference) < 0.01) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Minus className="h-4 w-4" />
          <span>₹0.00 (Balanced)</span>
        </div>
      );
    } else if (difference > 0) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <TrendingUp className="h-4 w-4" />
          <span>+₹{difference.toFixed(2)} (Excess)</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span>₹{difference.toFixed(2)} (Shortage)</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Daily Closure</h1>
        <p className="text-muted-foreground mt-1">
          Reconcile sales and tender collections for {currentStation?.name || 'your station'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="date">Closure Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <Button onClick={loadDayData} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {existingClosure && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Closure Already Completed
            </CardTitle>
            <CardDescription>
              This day has already been closed on {new Date(existingClosure.closed_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Summary
            </CardTitle>
            <CardDescription>
              Calculated from fuel dispensing records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₹{salesTotal.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total sales for {selectedDate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tender Collections
            </CardTitle>
            <CardDescription>
              Actual money collected by payment method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Cash:</span>
              <span className="font-medium">₹{tenderSummary.cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Card:</span>
              <span className="font-medium">₹{tenderSummary.card.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>UPI:</span>
              <span className="font-medium">₹{tenderSummary.upi.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Credit:</span>
              <span className="font-medium">₹{tenderSummary.credit.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{tenderSummary.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation</CardTitle>
          <CardDescription>
            Compare sales calculations with actual collections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Sales Total</p>
              <p className="text-2xl font-bold text-green-600">₹{salesTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tender Total</p>
              <p className="text-2xl font-bold text-blue-600">₹{tenderSummary.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Difference</p>
              <div className="text-2xl font-bold">
                {getDifferenceDisplay()}
              </div>
            </div>
          </div>

          {Math.abs(difference) > 0.01 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Investigation Required:</strong> There is a {difference > 0 ? 'surplus' : 'shortage'} of ₹{Math.abs(difference).toFixed(2)}. 
                Please verify all entries and investigate the discrepancy before closing.
              </p>
            </div>
          )}

          {!existingClosure && (
            <Button 
              onClick={performDailyClosure} 
              disabled={isClosing}
              className="w-full"
              size="lg"
            >
              {isClosing ? 'Closing...' : 'Perform Daily Closure'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

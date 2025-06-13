
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface OwnerData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface StationData {
  stationName: string;
  brand: 'IOCL' | 'BPCL' | 'HPCL';
  address: string;
}

export function CreateOwnerWizard() {
  const [step, setStep] = useState(1);
  const [ownerData, setOwnerData] = useState<OwnerData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [stationData, setStationData] = useState<StationData>({
    stationName: '',
    brand: 'IOCL',
    address: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOwnerMutation = useMutation({
    mutationFn: async () => {
      return apiClient.superadminRequest('superadmin-owners', {
        method: 'POST',
        body: JSON.stringify({
          ...ownerData,
          ...stationData,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stations'] });
      toast({
        title: "Success",
        description: "Owner and station created successfully",
      });
      // Reset form
      setStep(1);
      setOwnerData({ name: '', email: '', phone: '', password: '' });
      setStationData({ stationName: '', brand: 'IOCL', address: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create owner",
        variant: "destructive",
      });
    },
  });

  const canProceedToStep2 = ownerData.name && ownerData.email && ownerData.password;
  const canSubmit = canProceedToStep2 && stationData.stationName && stationData.address;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Owner + Station</h1>
        <p className="text-muted-foreground">Create a new owner user and their station</p>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          {step > 1 ? <Check className="w-4 h-4" /> : '1'}
        </div>
        <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          {step > 2 ? <Check className="w-4 h-4" /> : '2'}
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Owner Information</CardTitle>
            <CardDescription>Enter the owner's personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={ownerData.name}
                onChange={(e) => setOwnerData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={ownerData.email}
                onChange={(e) => setOwnerData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={ownerData.phone}
                onChange={(e) => setOwnerData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91-9876543210"
              />
            </div>
            <div>
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                value={ownerData.password}
                onChange={(e) => setOwnerData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="temporaryPassword123"
              />
            </div>
            <Button 
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="w-full"
            >
              Next: Station Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Station Information</CardTitle>
            <CardDescription>Enter the station details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stationName">Station Name</Label>
              <Input
                id="stationName"
                value={stationData.stationName}
                onChange={(e) => setStationData(prev => ({ ...prev, stationName: e.target.value }))}
                placeholder="Green Valley IOCL"
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select value={stationData.brand} onValueChange={(value: any) => setStationData(prev => ({ ...prev, brand: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IOCL">IOCL</SelectItem>
                  <SelectItem value="BPCL">BPCL</SelectItem>
                  <SelectItem value="HPCL">HPCL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={stationData.address}
                onChange={(e) => setStationData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street, City, State, PIN"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => createOwnerMutation.mutate()}
                disabled={!canSubmit || createOwnerMutation.isPending}
                className="flex-1"
              >
                {createOwnerMutation.isPending ? 'Creating...' : 'Create Owner + Station'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Fuel, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const confirmUser = async (userEmail: string) => {
    try {
      const response = await fetch(
        `https://untzkhbbsowpkmwrxdws.supabase.co/functions/v1/confirm-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: userEmail }),
        }
      );

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to confirm user');
      }

      return result;
    } catch (error) {
      console.error('Error confirming user:', error);
      throw error;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setConfirmationError(false);
    
    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific confirmation error with auto-retry
      if (error.message?.includes('Email not confirmed') || 
          error.message?.includes('email_not_confirmed')) {
        
        setIsConfirming(true);
        
        try {
          // Attempt to confirm the user automatically
          await confirmUser(email);
          
          toast({
            title: "Account Confirmed",
            description: "Your account has been confirmed. Retrying login...",
          });
          
          // Wait a moment and retry login
          setTimeout(async () => {
            try {
              await login(email, password);
              toast({
                title: "Login Successful",
                description: "Welcome back!",
              });
            } catch (retryError: any) {
              console.error('Retry login error:', retryError);
              setConfirmationError(true);
              toast({
                title: "Login Failed After Confirmation",
                description: "Please contact support if this issue persists.",
                variant: "destructive",
              });
            } finally {
              setIsConfirming(false);
            }
          }, 1000);
          
        } catch (confirmError: any) {
          console.error('Confirmation error:', confirmError);
          setConfirmationError(true);
          setIsConfirming(false);
          toast({
            title: "Account Confirmation Failed",
            description: "Please contact support to confirm your account.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials. Please check your email and password.",
          variant: "destructive",
        });
      }
    } finally {
      if (!isConfirming) {
        setIsLoading(false);
      }
    }
  };

  const demoAccounts = [
    { role: 'Super Admin', email: 'admin@fuelsync.com', password: 'admin123' },
    { role: 'Owner', email: 'rajesh@fuelsync.com', password: 'owner123' },
    { role: 'Employee', email: 'ravi@fuelsync.com', password: 'emp123' }
  ];

  const fillDemo = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setConfirmationError(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 text-white rounded-full">
              <Fuel className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FuelSync</h1>
          <p className="text-gray-600">Fuel Station Management System</p>
        </div>

        {confirmationError && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your account requires email confirmation. Please contact support at{' '}
              <a href="mailto:support@fuelsync.com" className="underline font-medium">
                support@fuelsync.com
              </a>{' '}
              if you continue to experience this issue.
            </AlertDescription>
          </Alert>
        )}

        {isConfirming && (
          <Alert className="border-blue-200 bg-blue-50">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              Confirming your account and retrying login...
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || isConfirming}
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Confirming Account...
                  </>
                ) : isLoading ? (
                  'Signing in...'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo Accounts</CardTitle>
            <CardDescription className="text-xs">
              Click to auto-fill credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoAccounts.map((account, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => fillDemo(account.email, account.password)}
              >
                <div className="text-left">
                  <div className="font-medium">{account.role}</div>
                  <div className="text-muted-foreground">{account.email}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {process.env.NODE_ENV === 'development' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Development Mode</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Email confirmation is disabled with automatic fallback.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

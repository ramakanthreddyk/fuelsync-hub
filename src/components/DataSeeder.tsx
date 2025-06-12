
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, CheckCircle } from 'lucide-react';

export default function DataSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const seedDatabase = async () => {
    try {
      setIsSeeding(true);
      setSeedingStatus('seeding');

      const { data, error } = await supabase.functions.invoke('seed-data');

      if (error) throw error;

      setSeedingStatus('success');
      toast({
        title: 'Success',
        description: 'Database seeded successfully with sample data',
      });

      console.log('Seeding result:', data);
    } catch (error) {
      console.error('Seeding error:', error);
      setSeedingStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to seed database',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup
        </CardTitle>
        <CardDescription>
          Initialize the database with sample data for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={seedDatabase} 
          disabled={isSeeding || seedingStatus === 'success'}
          className="w-full"
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding Database...
            </>
          ) : seedingStatus === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Database Seeded
            </>
          ) : (
            'Seed Database'
          )}
        </Button>
        
        {seedingStatus === 'success' && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
            <p className="font-medium">Sample accounts created:</p>
            <ul className="mt-2 space-y-1">
              <li>• Admin: admin@fuelsync.com (admin123)</li>
              <li>• Owner: rajesh@fuelsync.com (owner123)</li>
              <li>• Employee: ravi@fuelsync.com (emp123)</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { MobileMenuTrigger } from './MobileMenuTrigger';
import FuelSyncLogo from './FuelSyncLogo';

export function AppHeader() {
  const { currentStation } = useRoleAccess();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 flex items-center space-x-2 md:hidden">
          <MobileMenuTrigger />
          <FuelSyncLogo className="h-6 w-6" />
          <span className="font-semibold">FuelSync</span>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {currentStation && (
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-foreground">
                  {currentStation.name}
                </h1>
                <p className="text-sm text-muted-foreground">Station Manager</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { MobileMenuTrigger } from './MobileMenuTrigger';
import FuelSyncLogo from './FuelSyncLogo';

export function AppHeader() {
  const { currentStation } = useRoleAccess();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-2 md:px-4 py-2 md:py-0 flex flex-col md:flex-row items-stretch md:items-center gap-0 md:gap-2">
        {/* Mobile header row */}
        <div className="flex items-center w-full md:hidden h-12">
          <MobileMenuTrigger />
          <div className="ml-3 flex items-center">
            <FuelSyncLogo className="h-7 w-7" />
            <span className="ml-2 font-bold text-lg tracking-tight">FuelSync</span>
          </div>
        </div>
        {/* Mobile: station name row below */}
        {currentStation && (
          <div className="block md:hidden px-2 pb-1 pt-0.5">
            <h1 className="text-base font-semibold text-foreground truncate">{currentStation.name}</h1>
          </div>
        )}
        {/* Desktop header (flex row) */}
        <div className="hidden md:flex flex-1 items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <FuelSyncLogo className="h-7 w-7" />
            <span className="font-bold text-xl tracking-tight">FuelSync</span>
            {currentStation && (
              <span className="ml-6">
                <h1 className="text-lg font-semibold text-foreground">{currentStation.name}</h1>
                <p className="text-sm text-muted-foreground">Station Manager</p>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

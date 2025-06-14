
import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { MobileMenuTrigger } from './MobileMenuTrigger';
import FuelSyncLogo from './FuelSyncLogo';

export function AppHeader() {
  const { currentStation } = useRoleAccess();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-2 md:px-4 py-2 flex flex-col md:flex-row items-stretch md:items-center gap-0 md:gap-2">
        {/* MOBILE HEADER */}
        <div className="flex items-center w-full md:hidden h-12">
          <MobileMenuTrigger />
          {/* Only the icon, no text on mobile */}
          <div className="ml-3 flex items-center">
            <FuelSyncLogo className="h-7 w-7" showText={false} />
          </div>
        </div>
        {/* Mobile: FuelSync and Station Name/Label below the bar */}
        <div className="block md:hidden px-2 pb-1 pt-0.5">
          <span className="font-bold text-fuel-blue text-lg leading-tight">FuelSync</span>
          {currentStation && (
            <div>
              <h1 className="text-base font-semibold text-foreground truncate">{currentStation.name}</h1>
              <span className="text-xs text-fuel-orange font-medium tracking-wider uppercase">Station Manager</span>
            </div>
          )}
        </div>
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex flex-1 items-center justify-between h-14">
          <div className="flex items-center gap-4">
            {/* Full logo with text/labels on desktop */}
            <FuelSyncLogo className="h-7 w-7" size="md" showText={true} />
            {currentStation && (
              <span className="ml-6">
                <h1 className="text-lg font-semibold text-foreground">{currentStation.name}</h1>
                <p className="text-sm text-fuel-orange font-medium tracking-wider uppercase">Station Manager</p>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

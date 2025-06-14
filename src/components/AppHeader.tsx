
import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { MobileMenuTrigger } from './MobileMenuTrigger';
import FuelSyncLogo from './FuelSyncLogo';

export function AppHeader() {
  const { currentStation } = useRoleAccess();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 md:h-14">
        <div className="flex items-center w-full">
          {/* Mobile header */}
          <div className="flex items-center gap-2 md:hidden flex-1">
            <MobileMenuTrigger />
            <FuelSyncLogo className="h-6 w-6" />
            <span className="font-semibold text-base">FuelSync</span>
          </div>
          {/* Mobile: station name below, only if currentStation */}
          <div className="block md:hidden w-full mt-1">
            {currentStation && (
              <div>
                <h1 className="text-base font-semibold text-foreground truncate">
                  {currentStation.name}
                </h1>
                {/* Station label hidden on mobile for more space */}
              </div>
            )}
          </div>
          {/* Desktop header */}
          <div className="hidden md:flex flex-1 items-center justify-between space-x-2">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {currentStation && (
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    {currentStation.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">Station Manager</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

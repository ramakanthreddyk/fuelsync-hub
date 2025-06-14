
import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { MobileMenuTrigger } from './MobileMenuTrigger';
import FuelSyncLogo from './FuelSyncLogo';

export function AppHeader() {
  const { currentStation } = useRoleAccess();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* MOBILE HEADER */}
      <div className="md:hidden flex flex-col w-full">
        <div className="flex items-center h-14 px-3 py-1.5 justify-between gap-2">
          <MobileMenuTrigger />
          <FuelSyncLogo size={38} withText={false} className="mx-auto" />
          <div className="w-8"></div> {/* keeps logo centered */}
        </div>
        <div className="flex flex-col justify-center items-center pb-2 px-3">
          <FuelSyncLogo size={0} withText={true} className="-mt-2" />
          {currentStation && (
            <div className="max-w-full">
              <span className="block text-base font-semibold text-foreground truncate text-center">{currentStation.name}</span>
            </div>
          )}
        </div>
      </div>
      {/* DESKTOP HEADER */}
      <div className="hidden md:flex items-center h-16 w-full px-6">
        <FuelSyncLogo size={46} withText={true} />
        {currentStation && (
          <span className="ml-8 flex flex-col justify-center">
            <span className="text-lg font-semibold text-foreground">{currentStation.name}</span>
          </span>
        )}
      </div>
    </header>
  );
}

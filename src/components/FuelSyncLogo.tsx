
import React from 'react';

export interface FuelSyncLogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

const FuelSyncLogo: React.FC<FuelSyncLogoProps> = ({ size = 40, withText = true, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {/* SVG logo: fuel drop blended w/ sync arrows, on-brand colors */}
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="block" xmlns="http://www.w3.org/2000/svg">
      {/* Drop background */}
      <defs>
        <linearGradient id="fuelLogoBlue" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--fuel-blue))" />
          <stop offset="1" stopColor="hsl(var(--fuel-blue-light))" />
        </linearGradient>
        <linearGradient id="fuelLogoOrange" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--fuel-orange))" />
          <stop offset="1" stopColor="hsl(var(--fuel-orange-light))" />
        </linearGradient>
      </defs>
      <path
        d="M24 3C18 13 9 20.5 9 29C9 38 17 45 24 45C31 45 39 38 39 29C39 20.5 30 13 24 3Z"
        fill="url(#fuelLogoBlue)"
        stroke="hsl(var(--fuel-blue))"
        strokeWidth="2"
        className="drop-shadow"
      />
      {/* Inner sync arrow - orange */}
      <path
        d="M30.5 31C28 35 20 35 17.5 31"
        stroke="url(#fuelLogoOrange)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeDasharray="2.5 2.5"
      />
      <polyline
        points="18.5,29 17.5,31 20,31"
        fill="none"
        stroke="url(#fuelLogoOrange)"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <polyline
        points="29.5,29 30.5,31 28,31"
        fill="none"
        stroke="url(#fuelLogoOrange)"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
    </svg>
    {withText && (
      <div className="flex flex-col ml-1">
        <span className="font-bold text-fuel-blue text-lg leading-none" style={{ letterSpacing: '0.5px' }}>
          FuelSync
        </span>
        <span className="text-xs text-fuel-orange font-semibold tracking-wide -mt-0.5 uppercase">
          Station Manager
        </span>
      </div>
    )}
  </div>
);

export default FuelSyncLogo;

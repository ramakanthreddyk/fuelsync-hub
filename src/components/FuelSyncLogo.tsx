
import React from 'react';

interface FuelSyncLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const FuelSyncLogo: React.FC<FuelSyncLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fuel Drop Background */}
          <defs>
            <linearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--fuel-blue))" />
              <stop offset="100%" stopColor="hsl(var(--fuel-blue-light))" />
            </linearGradient>
            <linearGradient id="syncGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--fuel-orange))" />
              <stop offset="100%" stopColor="hsl(var(--fuel-orange-light))" />
            </linearGradient>
          </defs>
          
          {/* Main Fuel Drop Shape */}
          <path 
            d="M50 15 C35 25, 20 35, 20 55 C20 70, 32.5 85, 50 85 C67.5 85, 80 70, 80 55 C80 35, 65 25, 50 15 Z" 
            fill="url(#fuelGradient)"
            className="drop-shadow-lg"
          />
          
          {/* Sync Arrows */}
          <g fill="url(#syncGradient)" className="animate-pulse-slow">
            {/* Top Arrow */}
            <path d="M45 35 L55 35 L52 30 L58 30 L50 22 L42 30 L48 30 Z" />
            {/* Bottom Arrow */}
            <path d="M55 65 L45 65 L48 70 L42 70 L50 78 L58 70 L52 70 Z" />
            {/* Sync Circle */}
            <circle cx="50" cy="50" r="8" fill="none" stroke="url(#syncGradient)" strokeWidth="2" strokeDasharray="4,2" className="animate-spin" style={{animationDuration: '4s'}} />
          </g>
        </svg>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-fuel-blue leading-none ${textSizeClasses[size]}`}>
            FuelSync
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-fuel-orange font-medium tracking-wider uppercase">
              Station Manager
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FuelSyncLogo;

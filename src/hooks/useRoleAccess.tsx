
import { useAuth } from './useAuth';
import { useMemo } from 'react';

export interface StationAccess {
  id: number;
  name: string;
  brand: string;
  address: string;
}

export interface RoleAccess {
  role: 'superadmin' | 'owner' | 'employee';
  canAccessAllStations: boolean;
  stations: StationAccess[];
  currentStation: StationAccess | null;
  isAdmin: boolean;
  isOwner: boolean;
  isEmployee: boolean;
}

export function useRoleAccess(): RoleAccess {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        role: 'employee',
        canAccessAllStations: false,
        stations: [],
        currentStation: null,
        isAdmin: false,
        isOwner: false,
        isEmployee: true,
      };
    }

    const role = user.role;
    const stations = user.stations || [];
    
    return {
      role,
      canAccessAllStations: role === 'superadmin',
      stations,
      currentStation: stations[0] || null,
      isAdmin: role === 'superadmin',
      isOwner: role === 'owner',
      isEmployee: role === 'employee',
    };
  }, [user]);
}


import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Users, Building2, Fuel, Settings, Plus, BarChart3, LogOut, ArrowLeft } from 'lucide-react';
import FuelSyncLogo from './FuelSyncLogo';

const superAdminItems = [
  {
    title: "Users",
    url: "/sa/users",
    icon: Users,
  },
  {
    title: "Stations", 
    url: "/sa/stations",
    icon: Building2,
  },
  {
    title: "Pumps",
    url: "/sa/pumps", 
    icon: Fuel,
  },
  {
    title: "Plans",
    url: "/sa/plans",
    icon: Settings,
  },
  {
    title: "Create Owner",
    url: "/sa/create-owner",
    icon: Plus,
  },
  {
    title: "Analytics",
    url: "/sa/analytics", 
    icon: BarChart3,
  },
];

export function SuperAdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Sidebar className="w-64">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <FuelSyncLogo className="h-8" />
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {superAdminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
        <p className="text-xs text-muted-foreground px-2 pb-2">
          Super Admin Panel
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

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
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Upload, 
  TrendingUp, 
  Calendar, 
  Fuel, 
  DollarSign, 
  FileText, 
  Users, 
  Building2, 
  Settings,
  Shield
} from 'lucide-react';
import { FuelSyncLogo } from './FuelSyncLogo';

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Upload OCR",
      url: "/upload",
      icon: Upload,
    },
    {
      title: "Sales",
      url: "/sales", 
      icon: TrendingUp,
    },
    {
      title: "Daily Closure",
      url: "/daily-closure",
      icon: Calendar,
    },
    {
      title: "Pumps",
      url: "/pumps",
      icon: Fuel,
    },
    {
      title: "Prices",
      url: "/prices",
      icon: DollarSign,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
    },
  ];

  // Add admin items for owners and superadmins
  if (user?.role === 'owner' || user?.role === 'superadmin') {
    menuItems.push(
      {
        title: "Manage Users",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Manage Stations",
        url: "/admin/stations", 
        icon: Building2,
      }
    );
  }

  // Add super admin link for superadmins
  if (user?.role === 'superadmin') {
    menuItems.push({
      title: "Super Admin",
      url: "/sa/users",
      icon: Shield,
    });
  }

  menuItems.push({
    title: "Settings",
    url: "/settings",
    icon: Settings,
  });

  return (
    <Sidebar className="w-64">
      <SidebarHeader>
        <Link to="/dashboard">
          <FuelSyncLogo className="h-8" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>FuelSync</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
        <p className="text-xs text-muted-foreground">
          FuelSync &copy; {new Date().getFullYear()}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

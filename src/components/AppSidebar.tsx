
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Upload,
  DollarSign,
  Fuel,
  FileText,
  Settings,
  LogOut,
  Home
} from "lucide-react";
import FuelSyncLogo from './FuelSyncLogo';
import { apiService } from '@/services/api';
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload Receipt', href: '/upload', icon: Upload },
  { name: 'Sales Analytics', href: '/sales', icon: BarChart3 },
  { name: 'Fuel Prices', href: '/prices', icon: DollarSign },
  { name: 'Pump Management', href: '/pumps', icon: Fuel },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiService.logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Something went wrong during logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-4 py-6 border-b">
            <FuelSyncLogo className="h-8 w-8" />
            <span className="text-xl font-bold">FuelSync</span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/dashboard' && location.pathname === '/');
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="w-full justify-start"
                    >
                      <Link to={item.href} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;

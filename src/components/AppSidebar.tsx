
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import FuelSyncLogo from "./FuelSyncLogo";
import {
  Home,
  Upload,
  BarChart3,
  DollarSign,
  Fuel,
  FileText,
  Settings,
  Users,
  Building2,
  LogOut,
  ClipboardCheck,
} from "lucide-react";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin, isOwner, isEmployee } = useRoleAccess();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    if (isAdmin) {
      return [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Users", url: "/admin/users", icon: Users },
        { title: "Stations", url: "/admin/stations", icon: Building2 },
        { title: "Settings", url: "/settings", icon: Settings },
      ];
    }

    if (isOwner) {
      return [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Pumps", url: "/pumps", icon: Fuel },
        { title: "Sales", url: "/sales", icon: BarChart3 },
        { title: "Daily Closure", url: "/daily-closure", icon: ClipboardCheck },
        { title: "Fuel Prices", url: "/prices", icon: DollarSign },
        { title: "Reports", url: "/reports", icon: FileText },
        { title: "Settings", url: "/settings", icon: Settings },
      ];
    }

    // Employee
    return [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Upload Data", url: "/upload", icon: Upload },
      { title: "Sales", url: "/sales", icon: BarChart3 },
      { title: "Daily Closure", url: "/daily-closure", icon: ClipboardCheck },
      { title: "Reports", url: "/reports", icon: FileText },
      { title: "Settings", url: "/settings", icon: Settings },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <FuelSyncLogo />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={location.pathname === item.url}
                    onClick={() => handleNavigation(item.url)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-4 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

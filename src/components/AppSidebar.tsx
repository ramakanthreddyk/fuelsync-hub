
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import FuelSyncLogo from "./FuelSyncLogo";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import {
  Home,
  Upload,
  TrendingUp,
  DollarSign,
  Settings,
  BarChart3,
  FileText,
  Calendar,
  Fuel,
  LogOut,
  Users,
  Building2
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    roles: ['superadmin', 'owner', 'employee']
  },
  {
    title: "Data Entry",
    url: "/upload",
    icon: Upload,
    roles: ['superadmin', 'owner', 'employee']
  },
  {
    title: "Sales",
    url: "/sales",
    icon: TrendingUp,
    roles: ['superadmin', 'owner', 'employee']
  },
  {
    title: "Fuel Prices",
    url: "/prices",
    icon: DollarSign,
    roles: ['superadmin', 'owner']
  },
  {
    title: "Pumps & Nozzles",
    url: "/pumps",
    icon: Fuel,
    roles: ['superadmin', 'owner']
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    roles: ['superadmin', 'owner']
  },
  {
    title: "Daily Closure",
    url: "/daily-closure",
    icon: Calendar,
    roles: ['superadmin', 'owner', 'employee']
  },
];

const adminMenuItems = [
  {
    title: "Manage Stations",
    url: "/admin/stations",
    icon: Building2,
    roles: ['superadmin']
  },
  {
    title: "Manage Users",
    url: "/admin/users",
    icon: Users,
    roles: ['superadmin']
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { role, currentStation } = useRoleAccess();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(role)
  );

  const filteredAdminItems = adminMenuItems.filter(item => 
    item.roles.includes(role)
  );

  return (
    <Sidebar className="w-56 lg:w-64">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <FuelSyncLogo className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="font-semibold text-lg">FuelSync</span>
            {currentStation && (
              <span className="text-xs text-muted-foreground truncate">
                {currentStation.name}
              </span>
            )}
          </div>
        </div>
        <div className="lg:hidden mt-2">
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full justify-start gap-3 px-3 py-2 rounded-md"
                  >
                    <a href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      className="w-full justify-start gap-3 px-3 py-2 rounded-md"
                    >
                      <a href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/settings'}
                  className="w-full justify-start gap-3 px-3 py-2 rounded-md"
                >
                  <a href="/settings">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          {user && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium truncate">{user.name}</p>
              <p className="capitalize">{role}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

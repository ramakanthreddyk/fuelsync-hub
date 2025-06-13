
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
    <Sidebar className="w-52 lg:w-56">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <FuelSyncLogo className="w-7 h-7" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-base truncate">FuelSync</span>
            {currentStation && (
              <span className="text-xs text-muted-foreground truncate">
                {currentStation.name}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full justify-start gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <a href={item.url}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      className="w-full justify-start gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <a href={item.url}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/settings'}
                  className="w-full justify-start gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <a href="/settings">
                    <Settings className="w-4 h-4 shrink-0" />
                    <span className="truncate">Settings</span>
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
            <div className="text-xs text-sidebar-foreground/80">
              <p className="font-medium truncate">{user.name}</p>
              <p className="capitalize text-sidebar-foreground/60">{role}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-background/50 hover:bg-background border-sidebar-border hover:border-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

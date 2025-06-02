
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import FuelSyncLogo from './FuelSyncLogo';
import { Badge } from "@/components/ui/badge";

// Mock user data - replace with actual auth context
const mockUser = {
  name: "John Doe",
  role: "Pump Owner",
  plan: "Basic",
  email: "john@fuelstation.com"
};

// Navigation items based on user role and plan
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: "📊",
    roles: ["Super Admin", "Pump Owner", "Manager", "Employee"],
    plans: ["Free", "Basic", "Premium"]
  },
  {
    title: "Upload Receipt",
    url: "/upload",
    icon: "📄",
    roles: ["Super Admin", "Pump Owner", "Manager", "Employee"],
    plans: ["Free", "Basic", "Premium"]
  },
  {
    title: "Sales Tracking",
    url: "/sales",
    icon: "💰",
    roles: ["Super Admin", "Pump Owner", "Manager"],
    plans: ["Free", "Basic", "Premium"]
  },
  {
    title: "Fuel Prices",
    url: "/prices",
    icon: "⛽",
    roles: ["Super Admin", "Pump Owner", "Manager"],
    plans: ["Basic", "Premium"]
  },
  {
    title: "Pump Overview",
    url: "/pumps",
    icon: "🏭",
    roles: ["Super Admin", "Pump Owner", "Manager"],
    plans: ["Basic", "Premium"]
  },
  {
    title: "Reports",
    url: "/reports",
    icon: "📈",
    roles: ["Super Admin", "Pump Owner", "Manager"],
    plans: ["Basic", "Premium"]
  },
  {
    title: "Settings",
    url: "/settings",
    icon: "⚙️",
    roles: ["Super Admin", "Pump Owner", "Manager"],
    plans: ["Free", "Basic", "Premium"]
  }
];

const adminItems = [
  {
    title: "User Management",
    url: "/admin/users",
    icon: "👥",
    roles: ["Super Admin"],
    plans: ["Premium"]
  },
  {
    title: "Station Management",
    url: "/admin/stations",
    icon: "🏢",
    roles: ["Super Admin"],
    plans: ["Premium"]
  }
];

export function AppSidebar() {
  const location = useLocation();

  const isItemAccessible = (item: any) => {
    return item.roles.includes(mockUser.role) && item.plans.includes(mockUser.plan);
  };

  const isActiveRoute = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <FuelSyncLogo size="md" />
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-semibold uppercase tracking-wider mb-3">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const accessible = isItemAccessible(item);
                const active = isActiveRoute(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={`
                        relative w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${accessible 
                          ? active 
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg' 
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/40 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      {accessible ? (
                        <Link to={item.url} className="flex items-center gap-3 w-full">
                          <span className="text-lg">{item.icon}</span>
                          <span className="flex-1">{item.title}</span>
                          {!item.plans.includes(mockUser.plan) && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-sidebar-primary text-sidebar-primary">
                              Pro
                            </Badge>
                          )}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-lg opacity-50">{item.icon}</span>
                          <span className="flex-1">{item.title}</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-sidebar-primary/50 text-sidebar-primary/50">
                            {item.plans.includes("Premium") ? "Premium" : "Basic"}
                          </Badge>
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {mockUser.role === "Super Admin" && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-semibold uppercase tracking-wider mb-3">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminItems.map((item) => {
                  const accessible = isItemAccessible(item);
                  const active = isActiveRoute(item.url);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        className={`
                          relative w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                          ${accessible 
                            ? active 
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg' 
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/40 cursor-not-allowed opacity-50'
                          }
                        `}
                      >
                        {accessible ? (
                          <Link to={item.url} className="flex items-center gap-3 w-full">
                            <span className="text-lg">{item.icon}</span>
                            <span className="flex-1">{item.title}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 w-full">
                            <span className="text-lg opacity-50">{item.icon}</span>
                            <span className="flex-1">{item.title}</span>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-sidebar-primary/50 text-sidebar-primary/50">
                              Premium
                            </Badge>
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
              {mockUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {mockUser.name}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {mockUser.role}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/20">
              {mockUser.plan}
            </Badge>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors">
              Profile
            </button>
            <button className="flex-1 px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors">
              Logout
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

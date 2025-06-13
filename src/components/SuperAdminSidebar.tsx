
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Users, Building2, Fuel, Settings, Plus, BarChart3 } from 'lucide-react';

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

  return (
    <Sidebar className="w-64">
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
    </Sidebar>
  );
}


import { Home, Upload, Calculator, Settings, Users, Building2, BarChart3 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";

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
    title: "Daily Closure",
    url: "/closure",
    icon: Calculator,
    roles: ['superadmin', 'owner', 'employee']
  },
];

const adminItems = [
  {
    title: "Manage Users",
    url: "/admin/users",
    icon: Users,
    roles: ['superadmin']
  },
  {
    title: "Manage Stations",
    url: "/admin/stations",
    icon: Building2,
    roles: ['superadmin']
  },
];

const settingsItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ['superadmin', 'owner', 'employee']
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const filterItemsByRole = (items: typeof menuItems) => {
    return items.filter(item => user?.role && item.roles.includes(user.role));
  };

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterItemsByRole(menuItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === 'superadmin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterItemsByRole(adminItems).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => navigate(item.url)}
                      isActive={isActive(item.url)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterItemsByRole(settingsItems).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
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


import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
} from '@/components/ui/sidebar';
import FuelSyncLogo from '@/components/FuelSyncLogo';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  Fuel,
  FileText,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Upload,
} from 'lucide-react';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Base menu items for all authenticated users
  const baseMenuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      url: '/dashboard',
    },
  ];

  // Role-specific menu items
  const getMenuItems = () => {
    switch (user?.role) {
      case 'superadmin':
        return [
          ...baseMenuItems,
          {
            title: 'Manage Users',
            icon: Users,
            url: '/admin/users',
          },
          {
            title: 'Manage Stations',
            icon: Building2,
            url: '/admin/stations',
          },
          {
            title: 'Reports',
            icon: FileText,
            url: '/reports',
          },
          {
            title: 'Settings',
            icon: Settings,
            url: '/settings',
          },
        ];
      case 'owner':
        return [
          ...baseMenuItems,
          {
            title: 'My Stations',
            icon: Building2,
            url: '/stations',
          },
          {
            title: 'Pumps & Nozzles',
            icon: Fuel,
            url: '/pumps',
          },
          {
            title: 'Sales',
            icon: BarChart3,
            url: '/sales',
          },
          {
            title: 'Reports',
            icon: FileText,
            url: '/reports',
          },
          {
            title: 'Settings',
            icon: Settings,
            url: '/settings',
          },
        ];
      case 'employee':
        return [
          ...baseMenuItems,
          {
            title: 'OCR Readings',
            icon: Upload,
            url: '/readings',
          },
          {
            title: 'Sales',
            icon: BarChart3,
            url: '/sales',
          },
          {
            title: 'Settings',
            icon: Settings,
            url: '/settings',
          },
        ];
      default:
        return baseMenuItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <FuelSyncLogo />
          <div>
            <h2 className="text-lg font-semibold">FuelSync</h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    className="w-full justify-start"
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

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <div className="text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

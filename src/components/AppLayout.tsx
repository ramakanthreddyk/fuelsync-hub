
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { 
  BarChart3, 
  Upload, 
  DollarSign, 
  Fuel, 
  Settings, 
  Users, 
  Building, 
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentStation, isAdmin, isOwner, isEmployee } = useRoleAccess();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['all'] },
    { path: '/upload', label: 'Upload', icon: Upload, roles: ['all'] },
    { path: '/sales', label: 'Sales', icon: DollarSign, roles: ['all'] },
    { path: '/daily-closure', label: 'Daily Closure', icon: FileText, roles: ['owner', 'superadmin'] },
    { path: '/pumps', label: 'Pumps', icon: Fuel, roles: ['all'] },
    { path: '/prices', label: 'Fuel Prices', icon: DollarSign, roles: ['owner', 'superadmin'] },
    { path: '/reports', label: 'Reports', icon: FileText, roles: ['owner', 'superadmin'] },
    { path: '/admin/users', label: 'Users', icon: Users, roles: ['superadmin'] },
    { path: '/admin/stations', label: 'Stations', icon: Building, roles: ['superadmin'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['all'] },
  ];

  const canAccessRoute = (roles: string[]) => {
    if (roles.includes('all')) return true;
    if (isAdmin && roles.includes('superadmin')) return true;
    if (isOwner && roles.includes('owner')) return true;
    if (isEmployee && roles.includes('employee')) return true;
    return false;
  };

  const filteredNavItems = navigationItems.filter(item => canAccessRoute(item.roles));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">FuelSync</h2>
        {currentStation && (
          <div className="mt-2">
            <Badge variant="outline">{currentStation.name}</Badge>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || 'employee'}</p>
          </div>
        </div>
        <Button 
          onClick={handleLogout} 
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">FuelSync</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {currentStation && (
            <Badge variant="outline" className="hidden sm:inline-flex">
              {currentStation.name}
            </Badge>
          )}
          <Button onClick={handleLogout} variant="ghost" size="icon">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <Card className="h-full rounded-none border-r">
            <SidebarContent />
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;

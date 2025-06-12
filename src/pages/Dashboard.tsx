
import { useAuth } from '@/hooks/useAuth';
import OwnerDashboard from './OwnerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'superadmin':
      return <AdminDashboard />;
    case 'owner':
      return <OwnerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Invalid Role</h1>
            <p className="text-muted-foreground">Your account role is not recognized</p>
          </div>
        </div>
      );
  }
}

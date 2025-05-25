import React, { useState, ReactNode } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  BarChart3,
  Users,
  Calendar,
  FileText,
  Target,
  Activity as ActivityIcon, // Renamed to avoid conflict with Activity interface
  Zap,
} from 'lucide-react';
import { logoutUser } from '@/services/firebase/authService';
import { useAuth } from '@/services/firebase/AuthProvider';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { id: 'contacts', label: 'Kontakte', icon: Users, path: '/contacts' },
  { id: 'deals', label: 'Pipeline', icon: Target, path: '/deals' }, // Assuming /deals path
  { id: 'activities', label: 'Aktivitäten', icon: ActivityIcon, path: '/activities' }, // Assuming /activities path
  { id: 'assessments', label: 'Assessments', icon: FileText, path: '/assessments' },
  { id: 'calendar', label: 'Kalender', icon: Calendar, path: '/calendar' }, // Assuming /calendar path
  { id: 'settings', label: 'Einstellungen', icon: Settings, path: '/settings' }, // Assuming /settings path
];

const Sidebar: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void; activeTab: string; setActiveTab: (tab: string) => void }> = 
  ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const handleNavigation = (item: NavItem) => {
    setActiveTab(item.id);
    navigate(item.path);
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col h-screen`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center space-x-2" onClick={() => setActiveTab('dashboard')}>
              <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-gray-900">BE_AUTOMATED</span>
            </Link>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </div>
      </div>

      <nav className="mt-8 flex-grow">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              title={item.label} // Tooltip for collapsed sidebar
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                activeTab === item.id ? 'bg-blue-50 text-primary-blue border-r-2 border-primary-blue' : 'text-gray-700'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${activeTab === item.id ? 'text-primary-blue' : 'text-gray-600'}`} />
              {sidebarOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {sidebarOpen && (
        <div className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-primary-blue" />
              <span className="text-sm font-medium text-blue-800">Quick Tip</span>
            </div>
            <p className="text-xs text-blue-700">
              Nutze Assessments als Lead-Magneten für neue Kunden!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const Header: React.FC<{ pageTitle: string }> = ({ pageTitle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/'); 
    } catch (error) {
      console.error("Error signing out (from service): ", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 capitalize">{pageTitle}</h2>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-red rounded-full"></span>
          </button>
          
          <div className="relative group">
            <button className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-md">
              <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.displayName || user?.email || 'User'}</p>
                <p className="text-xs text-gray-600">Be_Automated</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
            {/* Dropdown for logout - simple version */}
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-10">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <LogOut size={16} className="text-gray-600"/>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // Determine activeTab based on current route
  const currentNavItem = navItems.find(item => location.pathname.startsWith(item.path));
  const [activeTab, setActiveTab] = useState(currentNavItem ? currentNavItem.id : 'dashboard');

  // Update activeTab when location changes
  React.useEffect(() => {
    const newCurrentNavItem = navItems.find(item => location.pathname.startsWith(item.path));
    if (newCurrentNavItem) {
      setActiveTab(newCurrentNavItem.id);
    }
  }, [location.pathname]);

  const pageTitle = currentNavItem?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header pageTitle={pageTitle} />
        <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 
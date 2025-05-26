import React, { useState, ReactNode, useEffect } from 'react';
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
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Building,
  BarChart2,
} from 'lucide-react';
import { logoutUser, updateUserProfile } from '@/services/firebase/authService';
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

// NavItem Props Typdefinition
interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
  isSidebarExpanded: boolean;
}

// NavItem Komponente
const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, currentPath, isSidebarExpanded }) => {
  const isActive = currentPath.startsWith(to) && (to !== "/" || currentPath === "/"); // Genauere Prüfung für Root-Pfad
  // Für den Root-Pfad (Dashboard) wollen wir nur aktiv sein, wenn es genau /dashboard (oder /) ist, nicht /dashboardabc
  const isStrictActive = to === "/dashboard" ? currentPath === "/dashboard" || currentPath === "/" : isActive;

  return (
    <Link 
      to={to}
      title={label} 
      className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ease-in-out \
        ${isStrictActive ? 'bg-sky-600 text-white shadow-md' : 'text-slate-300 hover:bg-sky-800 hover:text-white'}
        ${!isSidebarExpanded ? 'justify-center' : ''}
      `}
    >
      <Icon size={isSidebarExpanded ? 20 : 24} className={`${isSidebarExpanded ? 'mr-3' : ''} flex-shrink-0`} />
      {isSidebarExpanded && <span className="truncate">{label}</span>}
    </Link>
  );
};

const MainLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error("Logout Error: ", error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Nutzer';
  const userEmail = user?.email || 'Keine E-Mail hinterlegt';
  const companyName = "BE_AUTOMATED";

  const getPageTitle = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    let title = pathParts.pop() || 'Dashboard'; // Fallback auf Dashboard
    // Spezifische Titelanpassungen, falls nötig
    if (title.toLowerCase() === 'be_automated') title = 'Dashboard';
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  // commonNavItems ist jetzt JSX, das direkt gerendert wird
  const CommonNavItemsComponent: React.FC<{currentPath: string, isSidebarExpanded: boolean}> = ({currentPath, isSidebarExpanded}) => (
    <>
      <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" currentPath={currentPath} isSidebarExpanded={isSidebarExpanded} />
      <NavItem to="/contacts" icon={Users} label="Kontakte" currentPath={currentPath} isSidebarExpanded={isSidebarExpanded} />
      <NavItem to="/deals" icon={BarChart2} label="Deals / Pipeline" currentPath={currentPath} isSidebarExpanded={isSidebarExpanded} />
      <NavItem to="/activities" icon={ActivityIcon} label="Aktivitäten" currentPath={currentPath} isSidebarExpanded={isSidebarExpanded} />
      <NavItem to="/calendar" icon={Calendar} label="Kalender" currentPath={currentPath} isSidebarExpanded={isSidebarExpanded} />
      {/* <NavItem to="/assessments" icon={CheckSquare} label="Assessments" currentPath={currentPath} isSidebarExpanded={isSidebarExpanded} /> */}
      {/* Die obige "Assessments"-Route wird ggf. durch die neuen ersetzt oder umfunktioniert */}
      <NavItem to="/assessment-hub" icon={Briefcase} label="Assessment Hub" currentPath={currentPath} isSidebarExpanded={isSidebarExpanded} />
      <NavItem to="/assessment-results" icon={FileText} label="Assessment Ergebnisse" currentPath={currentPath} isSidebarExpanded={isSidebarExpanded} /> {/* Neuer Navigationspunkt */}
      {/* Zukünftige Navigationspunkte hier einfügen */}
    </>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600"></div></div>; 
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Desktop Sidebar */}
      <aside className={`bg-sky-900 text-white ${isSidebarExpanded ? 'w-64' : 'w-20'} p-4 space-y-2 transition-all duration-300 ease-in-out hidden md:flex flex-col`}>
        <div className={`flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} mb-6`}>
          {isSidebarExpanded && <span className="text-2xl font-semibold text-white"><Link to="/dashboard">{companyName}</Link></span>}
          <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 rounded-md hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
            {isSidebarExpanded ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <nav className="flex-grow">
          <CommonNavItemsComponent currentPath={location.pathname} isSidebarExpanded={isSidebarExpanded} />
        </nav>
        <div>
          <NavItem to="/settings" icon={Settings} label="Einstellungen" currentPath={location.pathname} isSidebarExpanded={isSidebarExpanded} />
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden fixed top-4 left-4 z-30 p-2 bg-sky-600 text-white rounded-md">
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar (Overlay) */}
      <aside className={`bg-sky-900 text-white w-64 p-4 space-y-2 transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-20 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden flex flex-col`}>
        <div className="flex items-center justify-between mb-6">
          <span className="text-2xl font-semibold text-white"><Link to="/dashboard">{companyName}</Link></span>
        </div>
        <nav className="flex-grow" onClick={() => setIsMobileMenuOpen(false)}>
          <CommonNavItemsComponent currentPath={location.pathname} isSidebarExpanded={true} /> {/* Für Mobile Sidebar ist isSidebarExpanded immer true für die Textanzeige */}
        </nav>
        <div onClick={() => setIsMobileMenuOpen(false)}>
          <NavItem to="/settings" icon={Settings} label="Einstellungen" currentPath={location.pathname} isSidebarExpanded={true} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div className="md:hidden w-10 h-10"></div> 
             <div className="text-lg font-semibold text-gray-700">
                {getPageTitle()}
             </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-sky-700">{displayName}</div>
                <div className="text-xs text-gray-500">{userEmail}</div>
              </div>
              <button 
                onClick={handleLogout} 
                title="Abmelden"
                className="p-2 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <LogOut size={22} />
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 
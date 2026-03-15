import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Settings, LogOut, Search, Bell } from 'lucide-react';
import clsx from 'clsx';

export default function DashboardLayout() {
  const navigate = useNavigate();
  // Get user from local storage
  const user = JSON.parse(localStorage.getItem('user') || '{"name": "Guest"}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Team Status', path: '/dashboard/team', icon: Users },
    { name: 'Timeline', path: '/dashboard/timeline', icon: Activity },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <nav className="w-64 flex flex-col border-r border-slate-800 bg-surface/30 backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-primary-400 font-bold text-xl tracking-wide">
            <Activity className="h-6 w-6" />
            <span>TrackAgent</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-500/10 text-primary-400 text-shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 mb-4 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role || 'Admin'}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-surface/30 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex-1 flex max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg leading-5 bg-slate-800/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Search employees, teams..."
                type="search"
              />
            </div>
          </div>
          
          <div className="ml-4 flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

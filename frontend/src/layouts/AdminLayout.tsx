import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  History,
  Receipt,
  User,
  LogOut,
  Menu,
  X,
  Boxes
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSES', 'ACCOUNTS'] },
    { name: 'CRM (Customers)', href: '/customers', icon: Users, roles: ['ADMIN', 'SALES'] },
    { name: 'Inventory (Products)', href: '/products', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSES', 'ACCOUNTS'] },
    { name: 'Stock History', href: '/stock', icon: History, roles: ['ADMIN', 'WAREHOUSES'] },
    { name: 'Sales Challans', href: '/challans', icon: Receipt, roles: ['ADMIN', 'SALES', 'WAREHOUSES', 'ACCOUNTS'] },
    { name: 'User Profile', href: '/profile', icon: User, roles: ['ADMIN', 'SALES', 'WAREHOUSES', 'ACCOUNTS'] },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentRole = user?.role || 'SALES';

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 w-64 glass-panel border-r border-slate-800/60 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60">
          <div className="p-2 bg-brand-500 rounded-lg text-white">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-brand-300 bg-clip-text text-transparent">
              ERP + CRM Portal
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Operations Hub
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Section */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/30">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="h-9 w-9 rounded-full bg-brand-600/30 flex items-center justify-center border border-brand-500/25">
              <span className="font-bold text-brand-300 text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase mt-0.5">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-950/40 border border-rose-900/30 text-rose-300 hover:bg-rose-900/30 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60 glass-panel">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-base font-bold text-slate-200">
              {navigation.find((n) => n.href === location.pathname)?.name || 'Operations'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md hidden sm:inline-block">
              OS Status: production-ready
            </span>
          </div>
        </header>

        {/* Outlet View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

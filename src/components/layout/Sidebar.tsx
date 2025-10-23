import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  FolderOpen, 
  TrendingUp, 
  Settings, 
  LogOut,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/projects', icon: FolderOpen, label: 'Projects' },
    { to: '/analysis', icon: TrendingUp, label: 'Analysis' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (currentUser?.role === 'admin') {
    navItems.splice(-1, 0, { to: '/admin', icon: Users, label: 'Admin' });
  }

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">
          Cost Analysis
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Agile vs Waterfall
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {currentUser?.displayName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {currentUser?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500">
              {currentUser?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
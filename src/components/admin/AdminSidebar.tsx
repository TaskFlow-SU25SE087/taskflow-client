import { Layout, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function AdminSidebar() {
  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col py-6">
      <div className="px-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Admin Menu</h2>
      </div>
      <nav className="flex-1 flex flex-col gap-2 px-2">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
            }`
          }
        >
          <Layout className="h-5 w-5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
            }`
          }
        >
          <Users className="h-5 w-5" />
          User Management
        </NavLink>
        <NavLink
          to="/admin/terms"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
            }`
          }
        >
          <span className="h-5 w-5">📅</span>
          Term Management
        </NavLink>
      </nav>
    </div>
  );
} 
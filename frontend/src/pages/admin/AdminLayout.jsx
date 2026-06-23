import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IoGridOutline, IoPeopleOutline, IoDocumentTextOutline,
  IoFlagOutline, IoShieldOutline, IoLogOutOutline, IoHomeOutline
} from 'react-icons/io5';
import useAuthStore from '../../store/authStore';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminPending from './AdminPending';
import AdminReports from './AdminReports';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: IoGridOutline, end: true },
  { to: '/admin/users', label: 'All Users', icon: IoPeopleOutline },
  { to: '/admin/pending', label: 'Pending Approvals', icon: IoDocumentTextOutline },
  { to: '/admin/reports', label: 'Reports', icon: IoFlagOutline }
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-dark-900">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-dark-800 border-r border-white/5 flex flex-col">
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <IoShieldOutline size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm">Admin Panel</p>
              <p className="text-xs text-white/40">CampusVerse</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5 space-y-1">
          <button onClick={() => navigate('/feed')} className="sidebar-item w-full">
            <IoHomeOutline size={18} /> Back to App
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <IoLogOutOutline size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="pending" element={<AdminPending />} />
          <Route path="reports" element={<AdminReports />} />
        </Routes>
      </main>
    </div>
  );
}

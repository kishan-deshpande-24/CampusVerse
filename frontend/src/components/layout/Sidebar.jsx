import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  IoHomeOutline, IoHome, IoDocumentTextOutline, IoDocumentText,
  IoCalendarOutline, IoCalendar, IoPeopleOutline, IoPeople,
  IoStorefrontOutline, IoStorefront, IoSearchOutline, IoSearch,
  IoStarOutline, IoStar, IoChatbubbleOutline, IoChatbubble,
  IoNotificationsOutline, IoNotifications, IoPersonOutline, IoPerson,
  IoSettingsOutline, IoSettings, IoLogOutOutline, IoShieldOutline,
  IoHelpCircleOutline
} from 'react-icons/io5';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';

const navItems = [
  { to: '/feed', label: 'Feed', icon: IoHomeOutline, activeIcon: IoHome },
  { to: '/notes', label: 'Notes', icon: IoDocumentTextOutline, activeIcon: IoDocumentText },
  { to: '/events', label: 'Events', icon: IoCalendarOutline, activeIcon: IoCalendar },
  { to: '/teams', label: 'Teams', icon: IoPeopleOutline, activeIcon: IoPeople },
  { to: '/marketplace', label: 'Marketplace', icon: IoStorefrontOutline, activeIcon: IoStorefront },
  { to: '/lost-found', label: 'Lost & Found', icon: IoSearchOutline, activeIcon: IoSearch },
  { to: '/reviews', label: 'Reviews', icon: IoStarOutline, activeIcon: IoStar },
  { to: '/messages', label: 'Messages', icon: IoChatbubbleOutline, activeIcon: IoChatbubble },
  { to: '/notifications', label: 'Notifications', icon: IoNotificationsOutline, activeIcon: IoNotifications },
];

export default function Sidebar({ mobile = false, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-black text-white text-lg">C</div>
          <span className="text-xl font-black gradient-text">CampusVerse</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, label, icon: Icon, activeIcon: ActiveIcon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive ? <ActiveIcon size={20} /> : <Icon size={20} />}
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink to="/admin" onClick={onClose} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                <IoShieldOutline size={20} />
                <span>Admin Panel</span>
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/5 mt-2">
        <NavLink to={`/profile/${user?.username}`} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer mb-1">
          <Avatar src={user?.profile_photo} name={user?.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-white/40 truncate">@{user?.username}</p>
          </div>
        </NavLink>
        <div className="flex gap-1">
          <NavLink to="/settings" onClick={onClose} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xs">
            <IoSettingsOutline size={15} /> Settings
          </NavLink>
          <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs">
            <IoLogOutOutline size={15} /> Logout
          </button>
        </div>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-y-0 left-0 z-50 w-72 bg-dark-800 border-r border-white/5 shadow-2xl"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 bg-dark-800 border-r border-white/5 flex-shrink-0">
      {content}
    </aside>
  );
}

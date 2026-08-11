import React from 'react';
import { User } from '../types';
import { LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import bvmLogo from '../assets/images/bvm_school_logo_1786447134638.jpg';

interface NavbarProps {
  user: User | null;
  activePortal: 'student' | 'teacher';
  onPortalSwitch: (portal: 'student' | 'teacher') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, activePortal, onPortalSwitch, onLogout }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1E3A8A] text-white shadow-md border-b border-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white rounded-full p-0.5 shadow-sm shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/80">
            <img
              src={bvmLogo}
              alt="Bal Vidya Mandir School Emblem"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              BVM Test Portal
              <span className="text-blue-200 text-xs sm:text-sm font-normal hidden sm:inline">
                | Examination & Portal
              </span>
            </h1>
            <p className="text-[11px] text-blue-200/90 font-medium hidden md:block">
              School Examination & Online Assessment System
            </p>
          </div>
        </div>

        {/* Portal Selector & User Actions */}
        <div className="flex items-center gap-3">
          {/* Portal Switcher Buttons */}
          <div className="bg-blue-900/60 p-1 rounded-xl border border-blue-700/60 flex items-center gap-1">
            <button
              onClick={() => onPortalSwitch('student')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activePortal === 'student'
                  ? 'bg-white text-[#1E3A8A] font-bold shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Student Portal
            </button>
            <button
              onClick={() => onPortalSwitch('teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activePortal === 'teacher'
                  ? 'bg-white text-[#1E3A8A] font-bold shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Teacher Portal
            </button>
          </div>

          {/* User Info & Logout if logged in */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-blue-800">
              <div className="hidden md:block text-right">
                <p className="text-xs font-medium text-white">{user.name}</p>
                <p className="text-[10px] text-blue-200 uppercase tracking-widest">
                  {user.role === 'teacher'
                    ? 'AI / Computer Teacher'
                    : `Class ${user.class || '-'} (${user.section || '-'})`}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-blue-500 border-2 border-blue-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {getInitials(user.name)}
              </div>

              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-lg bg-blue-900/80 hover:bg-rose-900/60 text-blue-100 hover:text-rose-200 border border-blue-700 hover:border-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

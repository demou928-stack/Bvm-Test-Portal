import React, { useState } from 'react';
import { api, setStoredAuth } from '../../lib/api';
import { User } from '../../types';
import { LogIn, Key, User as UserIcon, ShieldAlert, Sparkles } from 'lucide-react';
import bvmLogo from '../../assets/images/bvm_school_logo_1786447134638.jpg';

interface StudentLoginProps {
  onLoginSuccess: (user: User) => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onLoginSuccess }) => {
  const [studentId, setStudentId] = useState('Bvm');
  const [password, setPassword] = useState('Bvm');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login(studentId, password, 'student');
      if (!data || !data.user) {
        throw new Error('Invalid response from server. Student user profile not returned.');
      }
      setStoredAuth(data.token, data.user);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDefault = () => {
    setStudentId('Bvm');
    setPassword('Bvm');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 border-2 border-blue-600/30 p-1 shadow-md overflow-hidden">
            <img
              src={bvmLogo}
              alt="Bal Vidya Mandir Emblem"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bal Vidya Mandir</h2>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">
            Student Assessment Portal
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access your assigned online tests and examine results
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-xl space-y-2">
            <div className="flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm font-medium">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>{error}</div>
            </div>
            <button
              type="button"
              onClick={handleQuickDefault}
              className="mt-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 underline hover:text-indigo-900 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-fill Default Student Credentials (ID: Bvm | Password: Bvm)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Student ID
            </label>
            <div className="relative">
              <UserIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Student ID (e.g. Bvm or STU801)"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password (e.g. Bvm)"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login to Student Portal
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Helper */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Default Credentials
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              ID: <span className="font-bold text-slate-900 dark:text-white">Bvm</span> | Password: <span className="font-bold text-slate-900 dark:text-white">Bvm</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStudentId('Bvm');
                  setPassword('Bvm');
                  setError(null);
                }}
                className="text-xs px-2.5 py-1 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Use "Bvm / Bvm"
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentId('STU801');
                  setPassword('Bvm');
                  setError(null);
                }}
                className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Use "STU801 / Bvm"
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

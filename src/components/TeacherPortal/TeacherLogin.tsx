import React, { useState } from 'react';
import { api, setStoredAuth } from '../../lib/api';
import { User } from '../../types';
import { ShieldCheck, Key, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import bvmLogo from '../../assets/images/bvm_school_logo_1786447134638.jpg';

interface TeacherLoginProps {
  onLoginSuccess: (user: User) => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLoginSuccess }) => {
  const [teacherId, setTeacherId] = useState('teacher');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login(teacherId, password, 'teacher');
      if (!data || !data.user) {
        throw new Error('Invalid response from server. Teacher profile not returned.');
      }
      setStoredAuth(data.token, data.user);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check teacher credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDefault = () => {
    setTeacherId('teacher');
    setPassword('admin');
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
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
            Teacher Administration Portal
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage online tests, students, question banks and results
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Teacher ID
            </label>
            <div className="relative">
              <UserCheck className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="Enter Teacher ID (e.g. teacher)"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                placeholder="Enter Password"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Login as Teacher
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Default Credentials
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                Teacher ID: <span className="font-bold">teacher</span> | Password: <span className="font-bold">admin</span>
              </div>
            </div>
            <button
              onClick={handleQuickDefault}
              className="text-xs px-2.5 py-1 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fill Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

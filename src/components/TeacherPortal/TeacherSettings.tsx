import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { ShieldCheck, KeyRound, UserCheck, AlertCircle, CheckCircle2, Lock, Save } from 'lucide-react';

interface TeacherSettingsProps {
  currentUser: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const TeacherSettings: React.FC<TeacherSettingsProps> = ({ currentUser, onUserUpdated }) => {
  const [newUserId, setNewUserId] = useState(currentUser.id || 'teacher');
  const [newName, setNewName] = useState(currentUser.name || 'Teacher Account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.updateTeacherCredentials({
        newUserId: newUserId.trim(),
        newName: newName.trim(),
        currentPassword: currentPassword.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      });

      if (res.token) {
        localStorage.setItem('auth_token', res.token);
      }

      setSuccess('Teacher credentials updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (res.user) {
        onUserUpdated(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update teacher credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-extrabold tracking-tight">Teacher Account & Security Settings</h1>
        </div>
        <p className="text-xs text-indigo-200">
          Manage your Teacher User ID, Full Name, and Master Login Password here.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3 text-emerald-800 dark:text-emerald-200 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Teacher Profile Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teacher Login ID / Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="e.g. teacher or ADMIN_MATH"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  This ID is used to login to the Teacher Portal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teacher Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Prof. R.K. Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <KeyRound className="w-4 h-4 text-rose-600" />
              Password Security Settings
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Password <span className="text-slate-400 font-normal">(Required if changing password or ID)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password (default: admin)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Teacher ID & Password Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

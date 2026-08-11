import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DashboardStats, RecentActivity } from '../../types';
import { Users, BookOpen, CheckCircle, Award, FileSpreadsheet, PlusCircle, Activity, TrendingUp, RefreshCw, KeyRound } from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getTeacherDashboard();
      setStats(data.stats);
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <div className="animate-spin border-4 border-blue-600 border-t-transparent rounded-full w-10 h-10 mb-3"></div>
        <p className="text-slate-500 font-medium text-xs">Loading teacher metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Teacher Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Overview of students, examination tests, submission results and performance metrics
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('create_test')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Test
          </button>
          <button
            onClick={() => onNavigate('students')}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
          >
            Manage Students
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-rose-600" />
            Change My ID / Password
          </button>
          <button
            onClick={fetchDashboard}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Students</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats?.totalStudents || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Tests</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats?.totalTests || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Tests</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{stats?.activeTests || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Attempts</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats?.totalAttempts || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Average Score</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats?.averageScore || 0}%</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pass Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{stats?.passPercentage || 0}%</div>
        </div>
      </div>

      {/* Quick Action Cards & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Shortcuts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Quick Actions</h2>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('create_test')}
              className="w-full p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 hover:bg-blue-100 rounded-xl flex items-center justify-between text-left text-xs font-bold text-blue-900 dark:text-blue-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>Create New Online Test</span>
              </div>
              <span className="text-blue-600">→</span>
            </button>

            <button
              onClick={() => onNavigate('students')}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Manage Student Accounts & 45 Generator</span>
              </div>
              <span className="text-slate-400">→</span>
            </button>

            <button
              onClick={() => onNavigate('results')}
              className="w-full p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-100 rounded-xl flex items-center justify-between text-left text-xs font-bold text-emerald-900 dark:text-emerald-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Results to Excel (.xlsx)</span>
              </div>
              <span className="text-emerald-600">→</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Recent Activity Feed
            </h2>
            <span className="text-xs text-slate-400">{activities.length} Events Logged</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity logged yet.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{act.message}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

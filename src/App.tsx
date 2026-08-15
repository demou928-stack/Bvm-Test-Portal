import React, { useState, useEffect } from 'react';
import { User, Test } from './types';
import { getStoredUser, clearStoredAuth, setStoredAuth } from './lib/api';
import { Navbar } from './components/Navbar';
import { StudentLogin } from './components/StudentPortal/StudentLogin';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { TestInterface } from './components/StudentPortal/TestInterface';
import { TestResultView } from './components/StudentPortal/TestResultView';
import { TeacherLogin } from './components/TeacherPortal/TeacherLogin';
import { TeacherDashboard } from './components/TeacherPortal/TeacherDashboard';
import { StudentManagement } from './components/TeacherPortal/StudentManagement';
import { TestManagement } from './components/TeacherPortal/TestManagement';
import { TestEditor } from './components/TeacherPortal/TestEditor';
import { ResultsManagement } from './components/TeacherPortal/ResultsManagement';
import { TeacherSettings } from './components/TeacherPortal/TeacherSettings';
import { LayoutDashboard, Users, BookOpen, PlusCircle, Award, Activity, LogOut, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [activePortal, setActivePortal] = useState<'student' | 'teacher'>(
    user?.role === 'teacher' ? 'teacher' : 'student'
  );

  // Navigation states
  const [teacherTab, setTeacherTab] = useState<'dashboard' | 'students' | 'tests' | 'create_test' | 'results' | 'settings'>('dashboard');
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  // Student specific navigation states
  const [takingTestId, setTakingTestId] = useState<string | null>(null);
  const [takingTestCode, setTakingTestCode] = useState<string | undefined>(undefined);
  const [viewingResultId, setViewingResultId] = useState<string | null>(null);

  useEffect(() => {
    const handleSessionExpired = (e: any) => {
      setUser(null);
      clearStoredAuth();
    };

    window.addEventListener('bvm:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('bvm:session-expired', handleSessionExpired);
    };
  }, []);

  const handleLoginSuccess = (userOrToken: any, loggedInUser?: User) => {
    let userToSet: User | null = null;
    if (typeof userOrToken === 'string' && loggedInUser) {
      setStoredAuth(userOrToken, loggedInUser);
      userToSet = loggedInUser;
    } else if (userOrToken && typeof userOrToken === 'object') {
      userToSet = userOrToken as User;
    }

    if (!userToSet) return;

    setUser(userToSet);
    if (userToSet.role === 'teacher') {
      setActivePortal('teacher');
      setTeacherTab('dashboard');
    } else {
      setActivePortal('student');
      setTakingTestId(null);
      setViewingResultId(null);
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    setTakingTestId(null);
    setViewingResultId(null);
  };

  const handlePortalSwitch = (portal: 'student' | 'teacher') => {
    setActivePortal(portal);
    setTakingTestId(null);
    setViewingResultId(null);
  };

  // If student is actively taking a test, render full screen test interface
  if (takingTestId) {
    return (
      <TestInterface
        testId={takingTestId}
        testCode={takingTestCode}
        onSubmitted={(res) => {
          setTakingTestId(null);
          if (res.resultId) {
            setViewingResultId(res.resultId);
          }
        }}
        onExit={() => setTakingTestId(null)}
      />
    );
  }

  // If student is viewing a result, render full screen scorecard
  if (viewingResultId) {
    return (
      <TestResultView
        resultId={viewingResultId}
        onBack={() => setViewingResultId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <Navbar
        user={user}
        activePortal={activePortal}
        onPortalSwitch={handlePortalSwitch}
        onLogout={handleLogout}
      />

      {/* Main Page Area */}
      <main className="flex-1">
        {/* STUDENT PORTAL VIEWS */}
        {activePortal === 'student' && (
          <div>
            {!user || user.role !== 'student' ? (
              <StudentLogin onLoginSuccess={handleLoginSuccess} />
            ) : (
              <StudentDashboard
                user={user}
                onStartTest={(testId, code) => {
                  setTakingTestId(testId);
                  setTakingTestCode(code);
                }}
                onViewResult={(resId) => setViewingResultId(resId)}
              />
            )}
          </div>
        )}

        {/* TEACHER PORTAL VIEWS */}
        {activePortal === 'teacher' && (
          <div>
            {!user || user.role !== 'teacher' ? (
              <TeacherLogin onLoginSuccess={handleLoginSuccess} />
            ) : (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Left Professional Sidebar */}
                  <aside className="w-full md:w-64 bg-white border border-slate-200 rounded-2xl p-4 space-y-6 shrink-0 shadow-sm">
                    {/* Navigation Items */}
                    <nav className="space-y-1">
                      <button
                        onClick={() => {
                          setEditingTest(null);
                          setTeacherTab('dashboard');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          teacherTab === 'dashboard'
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 rounded-l-none'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-600" />
                        Dashboard Overview
                      </button>

                      <button
                        onClick={() => {
                          setEditingTest(null);
                          setTeacherTab('students');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          teacherTab === 'students'
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 rounded-l-none'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-4 h-4 text-indigo-600" />
                        Student Management
                      </button>

                      <button
                        onClick={() => {
                          setEditingTest(null);
                          setTeacherTab('tests');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          teacherTab === 'tests'
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 rounded-l-none'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        Test Management
                      </button>

                      <button
                        onClick={() => {
                          setEditingTest(null);
                          setTeacherTab('create_test');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          teacherTab === 'create_test'
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 rounded-l-none'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <PlusCircle className="w-4 h-4 text-purple-600" />
                        {editingTest ? 'Edit Test' : 'Create New Test'}
                      </button>

                      <button
                        onClick={() => {
                          setEditingTest(null);
                          setTeacherTab('results');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          teacherTab === 'results'
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 rounded-l-none'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Award className="w-4 h-4 text-amber-600" />
                        Results & Excel Export
                      </button>

                      <button
                        onClick={() => {
                          setEditingTest(null);
                          setTeacherTab('settings');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          teacherTab === 'settings'
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 rounded-l-none'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <KeyRound className="w-4 h-4 text-rose-600" />
                        Teacher Account & Password
                      </button>
                    </nav>

                    {/* Live Portal Status Widget */}
                    <div className="p-4 bg-slate-900 text-white rounded-xl text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Portal Engine Active
                      </div>
                      <div className="text-lg font-extrabold text-white">45 Students Support</div>
                      <p className="text-[10px] text-slate-400">Class 1 to 12 • All Sections</p>
                    </div>
                  </aside>

                  {/* Right Content Area */}
                  <div className="flex-1 w-full min-w-0">
                    {teacherTab === 'dashboard' && (
                      <TeacherDashboard
                        onNavigate={(tab) => setTeacherTab(tab as any)}
                      />
                    )}

                    {teacherTab === 'students' && <StudentManagement />}

                    {teacherTab === 'tests' && (
                      <TestManagement
                        onCreateNew={() => {
                          setEditingTest(null);
                          setTeacherTab('create_test');
                        }}
                        onEditTest={(test) => {
                          setEditingTest(test);
                          setTeacherTab('create_test');
                        }}
                      />
                    )}

                    {teacherTab === 'create_test' && (
                      <TestEditor
                        initialTest={editingTest}
                        onSave={() => {
                          setEditingTest(null);
                          setTeacherTab('tests');
                        }}
                        onCancel={() => {
                          setEditingTest(null);
                          setTeacherTab('tests');
                        }}
                      />
                    )}

                    {teacherTab === 'results' && <ResultsManagement />}

                    {teacherTab === 'settings' && user && (
                      <TeacherSettings
                        currentUser={user}
                        onUserUpdated={(updatedUser) => setUser(updatedUser)}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-bold text-white">BVM Test Portal</span> • School Online Assessment System
            <p className="text-[11px] text-slate-500 mt-0.5">Automated Marking • Instant Results • Multi-Class Administration</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-slate-200">AI / Computer Science Dept.</span>
            <span>•</span>
            <span className="hover:text-slate-200">Class 1 to 12</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Secure Examination</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, TestResult } from '../../types';
import { Badge } from '../Common/Badge';
import { PreTestProfileModal } from './PreTestProfileModal';
import { StudentSetupModal } from './StudentSetupModal';
import { BookOpen, Clock, FileText, CheckCircle2, Award, Calendar, Hash, ArrowRight, RefreshCw, AlertCircle, KeyRound, Edit3, Search } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onStartTest: (testId: string, testCode?: string) => void;
  onViewResult: (resultId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onStartTest, onViewResult }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'results'>('tests');

  // Test Code and Profile Setup State
  const [activeTestCode, setActiveTestCode] = useState<string>(() => sessionStorage.getItem('activeTestCode') || '');
  const [showSetupModal, setShowSetupModal] = useState<boolean>(() => !sessionStorage.getItem('activeTestCode'));

  // Modal State for individual test start confirmation
  const [selectedTestModal, setSelectedTestModal] = useState<any | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStudentDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="animate-spin border-4 border-indigo-600 border-t-transparent rounded-full w-12 h-12 mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Loading Student Portal Dashboard...</p>
      </div>
    );
  }

  const studentInfo = dashboardData?.student || user;
  const rawAvailableTests = dashboardData?.availableTests || [];
  const myResults = dashboardData?.myResults || [];

  // Filter tests strictly by Class, Section, and Unique Test Code
  const availableTests = rawAvailableTests.filter((test: any) => {
    if (!activeTestCode) return false;

    const studentClass = String(studentInfo.class || '').trim();
    const studentSec = String(studentInfo.section || '').trim().toLowerCase();

    const testClass = String(test.class || '').trim();
    const testSec = String(test.section || '').trim().toLowerCase();
    const testCode = String(test.testCode || '').trim().toLowerCase();

    const matchClass = testClass === 'ALL' || testClass === studentClass;
    const matchSection = testSec === 'all' || testSec === studentSec;
    const matchCode = testCode === activeTestCode.trim().toLowerCase();

    return matchClass && matchSection && matchCode;
  });

  const handleSetupSubmitSuccess = (updatedStudent: any, enteredCode: string) => {
    setActiveTestCode(enteredCode);
    sessionStorage.setItem('activeTestCode', enteredCode);
    setShowSetupModal(false);
    if (dashboardData) {
      setDashboardData({
        ...dashboardData,
        student: updatedStudent,
      });
    }
    fetchDashboard();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Setup Modal - Auto Opens right after login if test code not set */}
      <StudentSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        student={studentInfo}
        initialTestCode={activeTestCode}
        onSubmitSuccess={handleSetupSubmitSuccess}
        canCancel={!!activeTestCode}
      />

      {/* Welcome Banner & Profile Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-200 mb-3">
              Student Assessment Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome, {studentInfo.name || 'Student'}!
            </h1>
            <p className="text-indigo-200 text-sm mt-1">
              BVM School Examination System • Registered under Class {studentInfo.class || '8'} ({studentInfo.section || 'Explorer'})
            </p>
          </div>

          {/* Active Test Code & Profile Details Badge */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-indigo-300 font-semibold">Active Filter & Test Code</span>
              <button
                onClick={() => setShowSetupModal(true)}
                className="px-2.5 py-1 bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-400/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Update Details / Code
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/10">
              <div>
                <span className="text-slate-400">Class:</span> <span className="font-bold text-white">{studentInfo.class || '-'}</span>
              </div>
              <div className="w-px h-3 bg-white/20"></div>
              <div>
                <span className="text-slate-400">Section:</span> <span className="font-bold text-emerald-300">{studentInfo.section || '-'}</span>
              </div>
              <div className="w-px h-3 bg-white/20"></div>
              <div>
                <span className="text-slate-400">Roll No:</span> <span className="font-bold text-white">{studentInfo.rollNumber || '-'}</span>
              </div>
              <div className="w-px h-3 bg-white/20"></div>
              <div>
                <span className="text-slate-400">Test Code:</span>{' '}
                <span className="font-mono font-bold text-amber-300 uppercase">
                  {activeTestCode || 'Not Set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Reminder Prompt if no test code active */}
      {!activeTestCode && (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-200 text-sm">Unique Test Code Required</div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Please enter your Student Details & Unique Test Code to view and attempt your examination.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSetupModal(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 shrink-0 flex items-center gap-2 transition-all"
          >
            <Search className="w-4 h-4" />
            Enter Details & Test Code
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'tests'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Assigned Examination ({availableTests.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'results'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            My Test Results ({myResults.length})
          </button>
        </div>

        <button
          onClick={fetchDashboard}
          className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Dashboard"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Available Tests Tab */}
      {activeTab === 'tests' && (
        <div>
          {availableTests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {activeTestCode
                  ? `No Exam Found for Test Code "${activeTestCode}"`
                  : 'No Active Examinations Available'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                {activeTestCode ? (
                  <>
                    There are no active examinations published matching Class{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{studentInfo.class}</span>, Section{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{studentInfo.section}</span>, and Unique Test Code{' '}
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{activeTestCode}</span>.
                  </>
                ) : (
                  'Please enter your Student Details and Unique Test Code using the setup button above.'
                )}
              </p>
              <button
                onClick={() => setShowSetupModal(true)}
                className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                {activeTestCode ? 'Change Test Code or Class Details' : 'Enter Test Details & Code'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTests.map((test: any) => {
                const isCompleted = test.studentStatus === 'Completed';
                const isInProgress = test.studentStatus === 'In Progress';

                return (
                  <div
                    key={test.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-md hover:shadow-lg transition-all p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="purple" size="sm">
                          <Hash className="w-3 h-3" />
                          {test.testCode}
                        </Badge>
                        <Badge
                          variant={isCompleted ? 'success' : isInProgress ? 'warning' : 'info'}
                          size="sm"
                        >
                          {test.studentStatus}
                        </Badge>
                      </div>

                      {/* Test Title */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                        {test.testName}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                        {test.subject} {test.chapter ? `• ${test.chapter}` : ''}
                      </p>

                      {/* Class & Section requirement tag */}
                      <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-lg">
                        <span>Class: <strong>{test.class}</strong></span>
                        <span>•</span>
                        <span>Section: <strong>{test.section}</strong></span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          <span>{test.questionsCount} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>{test.totalMarks} Total Marks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{test.durationMinutes} Minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <span>Till {test.endDate || 'No limit'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      {isCompleted ? (
                        <div className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Test Submitted & Completed
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedTestModal(test)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                            isInProgress
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                          }`}
                        >
                          {isInProgress ? 'Resume Test Attempt' : 'Start Examination'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Results History Tab */}
      {activeTab === 'results' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {myResults.length === 0 ? (
            <div className="text-center py-12 p-6">
              <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No test results submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Test Name</th>
                    <th className="px-6 py-3.5">Subject</th>
                    <th className="px-6 py-3.5">Marks</th>
                    <th className="px-6 py-3.5">Percentage</th>
                    <th className="px-6 py-3.5">Grade</th>
                    <th className="px-6 py-3.5">Result</th>
                    <th className="px-6 py-3.5">Submitted On</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myResults.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{r.testName}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.subject}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {r.marksObtained} / {r.totalMarks}
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{r.percentage}%</td>
                      <td className="px-6 py-4 font-bold">{r.grade}</td>
                      <td className="px-6 py-4">
                        <Badge variant={r.passStatus === 'Pass' ? 'success' : 'danger'} size="sm">
                          {r.passStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{r.submissionDate}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onViewResult(r.id)}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          View Scorecard
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pre-Test Profile Modal (For starting individual exam) */}
      {selectedTestModal && (
        <PreTestProfileModal
          isOpen={!!selectedTestModal}
          onClose={() => setSelectedTestModal(null)}
          student={studentInfo}
          testName={selectedTestModal.testName}
          testCode={selectedTestModal.testCode}
          requireTestCode={true}
          onVerified={(enteredTestCode) => {
            const tId = selectedTestModal.id;
            setSelectedTestModal(null);
            onStartTest(tId, enteredTestCode);
          }}
        />
      )}
    </div>
  );
};

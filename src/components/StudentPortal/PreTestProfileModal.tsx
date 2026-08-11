import React, { useState } from 'react';
import { User, Section } from '../../types';
import { Modal } from '../Common/Modal';
import { api } from '../../lib/api';
import { UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PreTestProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User;
  testName: string;
  testCode: string;
  requireTestCode: boolean;
  onVerified: (enteredTestCode?: string) => void;
}

export const PreTestProfileModal: React.FC<PreTestProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  testName,
  testCode,
  requireTestCode,
  onVerified,
}) => {
  const [studentName, setStudentName] = useState(student.name || '');
  const [studentClass, setStudentClass] = useState(student.class || '8');
  const [section, setSection] = useState<string>(student.section || 'Explorer');
  const [rollNumber, setRollNumber] = useState(student.rollNumber || '1');
  const [enteredTestCode, setEnteredTestCode] = useState(testCode || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentName.trim() || !studentClass.trim() || !section.trim() || !rollNumber.trim()) {
      setError('All student fields (Name, Class, Section, Roll Number) are required.');
      return;
    }

    if (requireTestCode && !enteredTestCode.trim()) {
      setError('Unique Test Code is required to start the test.');
      return;
    }

    setLoading(true);

    try {
      // Update student profile on server right before starting test
      await api.verifyStudentProfile({
        studentName: studentName.trim(),
        studentClass: studentClass.trim(),
        section: section.trim(),
        rollNumber: rollNumber.trim(),
      });

      onVerified(enteredTestCode.trim());
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Details & Examination Setup">
      <div className="space-y-4">
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-start gap-3 text-indigo-900 dark:text-indigo-200 text-sm">
          <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-base">{testName}</div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
              Please enter your Full Name, Class, Section, Roll Number, and Test Code before starting the examination.
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-sm font-medium">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Student Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter your full name (e.g. Rahul Kumar)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Class <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Explorer / A"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 15"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Unique Test Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={`Enter Test Code (e.g. ${testCode})`}
              value={enteredTestCode}
              onChange={(e) => setEnteredTestCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-mono text-sm uppercase tracking-wider focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Enter the Test Code provided by your teacher (Test Code: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{testCode}</span>)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Start Examination
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};


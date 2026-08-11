import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Test } from '../../types';
import { Badge } from '../Common/Badge';
import { BookOpen, Plus, Copy, Trash2, Edit3, Power, Clock, Hash, RefreshCw } from 'lucide-react';

interface TestManagementProps {
  onCreateNew: () => void;
  onEditTest: (test: Test) => void;
}

export const TestManagement: React.FC<TestManagementProps> = ({ onCreateNew, onEditTest }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');

  const fetchTests = async () => {
    setLoading(true);
    try {
      const data = await api.getTests();
      setTests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleToggleStatus = async (test: Test) => {
    const nextStatus = test.status === 'active' ? 'deactivated' : 'active';
    try {
      await api.updateTest(test.id, { status: nextStatus });
      fetchTests();
    } catch (err: any) {
      alert('Failed to update status');
    }
  };

  const handleDuplicate = async (test: Test) => {
    const dupCode = `${test.testCode}-COPY`;
    try {
      await api.createTest({
        ...test,
        testName: `${test.testName} (Copy)`,
        testCode: dupCode,
        status: 'draft',
      });
      fetchTests();
    } catch (err: any) {
      alert('Failed to duplicate test: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    try {
      await api.deleteTest(id);
      fetchTests();
    } catch (err: any) {
      alert('Failed to delete test');
    }
  };

  const filteredTests = tests.filter((t) => {
    const matchClass = filterClass === 'ALL' || t.class === 'ALL' || String(t.class) === String(filterClass);
    const matchSection = filterSection === 'ALL' || t.section === 'ALL' || String(t.section).toLowerCase() === filterSection.toLowerCase();
    return matchClass && matchSection;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Online Test Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, publish, activate, deactivate or modify class-wise online examinations
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Examination Test
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-semibold"
          >
            <option value="ALL">All Classes (1-12)</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>

          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-semibold"
          >
            <option value="ALL">All Sections</option>
            {['Creator', 'Innovator', 'Pathfinder', 'Originator', 'Developer', 'Explorer'].map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchTests} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Test List Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading tests...</div>
      ) : filteredTests.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          No tests found for selected class & section.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="purple" size="sm">
                    <Hash className="w-3 h-3" />
                    {test.testCode}
                  </Badge>

                  <Badge variant={test.status === 'active' ? 'success' : 'neutral'} size="sm">
                    {test.status}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">{test.testName}</h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                  Class {test.class} • Sec {test.section}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t text-xs text-slate-500">
                  <div>Subject: {test.subject}</div>
                  <div>Duration: {test.durationMinutes} mins</div>
                  <div>Questions: {test.questions.length}</div>
                  <div>Marks: {test.totalMarks}</div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(test)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    test.status === 'active'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {test.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(test)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                    title="Duplicate Test"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditTest(test)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                    title="Edit Test"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(test.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                    title="Delete Test"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

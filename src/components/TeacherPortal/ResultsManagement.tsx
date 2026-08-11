import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { TestResult, Section } from '../../types';
import { exportResultsToExcel } from '../../lib/excel';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { FileSpreadsheet, Search, Eye, Edit3, CheckCircle2, Download, RefreshCw, Filter } from 'lucide-react';

const SECTIONS: Section[] = ['Creator', 'Innovator', 'Pathfinder', 'Originator', 'Developer', 'Explorer'];

export const ResultsManagement: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterPassStatus, setFilterPassStatus] = useState('ALL');
  const [filterTestCode, setFilterTestCode] = useState('ALL');

  // Detail & Override Modal
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [overrideQId, setOverrideQId] = useState<string | null>(null);
  const [overrideMarks, setOverrideMarks] = useState<number>(0);
  const [overrideFeedback, setOverrideFeedback] = useState('');

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await api.getResults();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch examination results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult || !overrideQId) return;

    try {
      const updated = await api.overrideMarks(selectedResult.id, overrideQId, overrideMarks, overrideFeedback);
      setSelectedResult(updated);
      setOverrideQId(null);
      setOverrideFeedback('');
      fetchResults();
    } catch (err: any) {
      alert('Failed to override marks: ' + err.message);
    }
  };

  // Filter Results
  const filteredResults = results.filter((r) => {
    const matchSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.testName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchClass = filterClass === 'ALL' || String(r.class) === String(filterClass);
    const matchSection = filterSection === 'ALL' || String(r.section).toLowerCase() === filterSection.toLowerCase();
    const matchPass = filterPassStatus === 'ALL' || r.passStatus === filterPassStatus;
    const matchTest = filterTestCode === 'ALL' || r.testCode === filterTestCode;

    return matchSearch && matchClass && matchSection && matchPass && matchTest;
  });

  const uniqueTestCodes = Array.from(new Set(results.map((r) => r.testCode)));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Examination Results & Excel Export
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View student test submissions, review descriptive answers, and download formatted Excel report sheets
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportResultsToExcel(filteredResults, 'BVM_Filtered_Results')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Filtered Results to Excel (.xlsx)
          </button>

          <button
            onClick={() => exportResultsToExcel(results, 'BVM_All_Results')}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            Export All Results
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name, ID or test title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
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
            {SECTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          <select
            value={filterPassStatus}
            onChange={(e) => setFilterPassStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pass">Pass Only</option>
            <option value="Fail">Fail Only</option>
          </select>

          <select
            value={filterTestCode}
            onChange={(e) => setFilterTestCode(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-semibold font-mono"
          >
            <option value="ALL">All Test Codes</option>
            {uniqueTestCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          <button onClick={fetchResults} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading examination results...</div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No matching test results found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Class / Sec</th>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Test Code</th>
                  <th className="px-6 py-3.5">Test Title</th>
                  <th className="px-6 py-3.5">Marks</th>
                  <th className="px-6 py-3.5">Percentage</th>
                  <th className="px-6 py-3.5">Result</th>
                  <th className="px-6 py-3.5">Submitted Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResults.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{res.studentName}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                      Class {res.class} ({res.section})
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">#{res.rollNumber}</td>
                    <td className="px-6 py-3.5 font-mono text-purple-600 dark:text-purple-400 font-bold">{res.testCode}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">{res.testName}</td>
                    <td className="px-6 py-3.5 font-bold">
                      {res.marksObtained} / {res.totalMarks}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-indigo-600">{res.percentage}%</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={res.passStatus === 'Pass' ? 'success' : 'danger'} size="sm">
                        {res.passStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 text-[11px]">{res.submissionDate}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedResult(res)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-[11px] flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View / Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Result & Review Modal */}
      {selectedResult && (
        <Modal
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          title={`Scorecard: ${selectedResult.studentName} (${selectedResult.testCode})`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border flex flex-wrap justify-between gap-4">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedResult.testName}</div>
                <div className="text-slate-500 mt-0.5">
                  Student: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedResult.studentName}</span> (Class {selectedResult.class} {selectedResult.section} • Roll #{selectedResult.rollNumber})
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Score</div>
                  <div className="text-lg font-bold text-indigo-600">
                    {selectedResult.marksObtained} / {selectedResult.totalMarks} ({selectedResult.percentage}%)
                  </div>
                </div>
                <Badge variant={selectedResult.passStatus === 'Pass' ? 'success' : 'danger'} size="md">
                  {selectedResult.passStatus}
                </Badge>
              </div>
            </div>

            {/* Answer breakdown & override interface */}
            <div className="space-y-3">
              <h3 className="font-bold uppercase tracking-wider text-slate-500">Submitted Answer Breakdown</h3>

              {selectedResult.detailedEvaluations.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border space-y-2">
                  <div className="flex items-start justify-between gap-2 font-bold text-slate-900 dark:text-white">
                    <div>
                      Q{idx + 1}. {item.questionText}
                    </div>
                    <span className="font-mono text-indigo-600">
                      {item.marksObtained} / {item.marks} Marks
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t">
                    <div>
                      <span className="font-semibold text-slate-500">Student Answer: </span>
                      <span className="font-mono font-medium">{item.studentAnswer}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-600">Correct Answer / Model: </span>
                      <span className="font-mono text-emerald-700">{item.correctAnswer}</span>
                    </div>
                    {item.feedback && <div className="text-slate-500 italic">Feedback: {item.feedback}</div>}
                  </div>

                  {/* Override Button for Teacher */}
                  <div className="pt-2 border-t flex justify-end">
                    <button
                      onClick={() => {
                        setOverrideQId(item.questionId);
                        setOverrideMarks(item.marksObtained);
                        setOverrideFeedback(item.feedback || '');
                      }}
                      className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Override Question Marks
                    </button>
                  </div>

                  {/* Override Form Inline */}
                  {overrideQId === item.questionId && (
                    <form onSubmit={handleOverrideSubmit} className="mt-3 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 rounded-lg space-y-2">
                      <div className="font-bold text-indigo-900 dark:text-indigo-200">Override Score for Q{idx + 1}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold">New Marks (Max {item.marks})</label>
                          <input
                            type="number"
                            step="0.5"
                            max={item.marks}
                            min={0}
                            value={overrideMarks}
                            onChange={(e) => setOverrideMarks(Number(e.target.value))}
                            className="w-full p-1.5 border rounded bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold">Teacher Remark / Feedback</label>
                          <input
                            type="text"
                            value={overrideFeedback}
                            onChange={(e) => setOverrideFeedback(e.target.value)}
                            placeholder="Reason for manual override..."
                            className="w-full p-1.5 border rounded bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setOverrideQId(null)}
                          className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-600 text-white font-bold rounded"
                        >
                          Save New Score
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Test, Question, TestAttemptProgress } from '../../types';
import { Clock, ShieldAlert, CheckCircle2, ChevronLeft, ChevronRight, Bookmark, RotateCcw, Send, Check, AlertTriangle } from 'lucide-react';

interface TestInterfaceProps {
  testId: string;
  testCode?: string;
  onSubmitted: (resultData: any) => void;
  onExit: () => void;
}

export const TestInterface: React.FC<TestInterfaceProps> = ({ testId, testCode, onSubmitted, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<TestAttemptProgress | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Initialize or resume attempt
  useEffect(() => {
    let mounted = true;
    async function loadTestAttempt() {
      try {
        const data = await api.startTest(testId, testCode);
        if (!mounted) return;

        setAttempt(data.attempt);
        setTest(data.test);
        setQuestions(data.questions || []);
        setAnswers(data.attempt.answers || {});
        setMarkedForReview(data.attempt.markedForReview || []);
        setTabSwitchCount(data.attempt.tabSwitchCount || 0);

        // Calculate remaining seconds
        const remainingMs = data.attempt.endTime - Date.now();
        setTimeRemaining(Math.max(0, Math.floor(remainingMs / 1000)));

        setLoading(false);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to initialize test attempt.');
          setLoading(false);
        }
      }
    }

    loadTestAttempt();

    return () => {
      mounted = false;
    };
  }, [testId, testCode]);

  // Continuous Countdown Timer
  useEffect(() => {
    if (!attempt || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit(); // Auto submit when time hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt, timeRemaining]);

  // Continuous Auto-Save Answers every 12 seconds to prevent data loss!
  useEffect(() => {
    if (!attempt) return;

    const saveInterval = setInterval(() => {
      api.saveTestProgress(attempt.attemptId, answers, markedForReview, tabSwitchCount)
        .then(() => {
          const nowStr = new Date().toTimeString().split(' ')[0];
          setLastSaved(nowStr);
        })
        .catch((e) => console.error('Auto-save error', e));
    }, 12000);

    return () => clearInterval(saveInterval);
  }, [attempt, answers, markedForReview, tabSwitchCount]);

  // Tab switch detection for exam security
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setShowTabWarning(true);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAutoSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.submitTest(attempt.attemptId, answers, markedForReview);
      onSubmitted(res);
    } catch (err: any) {
      setError('Auto-submit failed: ' + err.message);
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.submitTest(attempt.attemptId, answers, markedForReview);
      setShowSubmitModal(false);
      onSubmitted(res);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="animate-spin border-4 border-indigo-600 border-t-transparent rounded-full w-12 h-12 mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">Securing examination environment & loading test...</p>
      </div>
    );
  }

  if (error || !test || !attempt || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Start Test</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{error || 'Invalid test session.'}</p>
        <button
          onClick={onExit}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id] || '';
  const isMarked = markedForReview.includes(currentQ.id);

  // Format time remaining MM:SS
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const formattedTime = `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;

  const answeredCount = Object.keys(answers).filter((k) => answers[k] && answers[k].trim()).length;
  const markedCount = markedForReview.length;
  const notAnsweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Top Examination Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold truncate max-w-xs sm:max-w-md">{test.testName}</h1>
            <p className="text-xs text-indigo-300">
              Student: <span className="font-semibold text-white">{attempt.studentName}</span> (Class {attempt.class} {attempt.section} • Roll #{attempt.rollNumber})
            </p>
          </div>

          {/* Countdown Timer Display */}
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-xl border font-mono font-bold text-sm flex items-center gap-2 ${
              timeRemaining < 300
                ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                : 'bg-indigo-950/80 text-indigo-200 border-indigo-800'
            }`}>
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{formattedTime}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Area (3 Cols on Desktop) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div>
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg">
                  {currentQ.questionType.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.questionText}
              </h2>

              {currentQ.imageUrl && (
                <div className="max-w-md my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img src={currentQ.imageUrl} alt="Question Diagram" className="w-full object-cover" />
                </div>
              )}

              {/* Answer Input Controls depending on Question Type */}
              <div className="mt-6">
                {currentQ.questionType === 'MCQ' && (
                  <div className="space-y-3">
                    {(currentQ.options || []).map((opt, optIdx) => {
                      const isSelected = currentAnswer === opt;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => setAnswers({ ...answers, [currentQ.id]: opt })}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-semibold shadow-sm'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQ.questionType === 'TRUE_FALSE' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['True', 'False'].map((val) => {
                      const isSelected = currentAnswer === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [currentQ.id]: val })}
                          className={`py-4 px-6 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQ.questionType === 'FILL_IN_BLANKS' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Type your answer below:
                    </label>
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                      placeholder="Type correct term here..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {currentQ.questionType === 'QUESTION_ANSWER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Write your descriptive answer:
                    </label>
                    <textarea
                      rows={5}
                      value={currentAnswer}
                      onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                      placeholder="Type your explanation clearly in your own words..."
                      className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Question Controls */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isMarked) {
                    setMarkedForReview(markedForReview.filter((id) => id !== currentQ.id));
                  } else {
                    setMarkedForReview([...markedForReview, currentQ.id]);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isMarked
                    ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 text-amber-800 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {isMarked ? 'Marked for Review' : 'Mark for Review'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...answers };
                  delete updated[currentQ.id];
                  setAnswers(updated);
                }}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Answer
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shadow-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar (1 Col on Desktop) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Question Palette</h3>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700"></span>
                <span>Unanswered ({notAnsweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500"></span>
                <span>Review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-indigo-600 bg-white dark:bg-slate-900"></span>
                <span>Current</span>
              </div>
            </div>

            {/* Question Grid Buttons */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAns = answers[q.id] && answers[q.id].trim();
                const isMrk = markedForReview.includes(q.id);
                const isCurr = idx === currentIndex;

                let btnClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                if (isAns) btnClass = 'bg-emerald-600 text-white font-bold';
                if (isMrk) btnClass = 'bg-amber-500 text-white font-bold';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${btnClass} ${
                      isCurr ? 'ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Auto-Save Indicator */}
            {lastSaved && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Continuous Progress Saved ({lastSaved})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Switch Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-800 max-w-md w-full p-6 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exam Security Warning</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Tab switching or leaving the test window is monitored. Warning count: <span className="font-bold text-rose-600">{tabSwitchCount}</span>
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="mt-6 w-full py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition-colors"
            >
              I Understand & Resume Test
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Submit Examination?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to finalize and submit your test?
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600 font-semibold">Answered:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-600 font-semibold">Marked for Review:</span>
                <span className="font-bold text-amber-600">{markedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-600 font-semibold">Unanswered:</span>
                <span className="font-bold text-rose-600">{notAnsweredCount}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleManualSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

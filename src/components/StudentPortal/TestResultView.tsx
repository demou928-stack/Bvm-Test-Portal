import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { TestResult } from '../../types';
import { Badge } from '../Common/Badge';
import { CheckCircle2, XCircle, HelpCircle, Award, ArrowLeft, Clock, FileText } from 'lucide-react';

interface TestResultViewProps {
  resultId?: string;
  initialResultData?: any;
  onBack: () => void;
}

export const TestResultView: React.FC<TestResultViewProps> = ({ resultId, initialResultData, onBack }) => {
  const [loading, setLoading] = useState(!initialResultData);
  const [result, setResult] = useState<TestResult | null>(initialResultData?.result || null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(initialResultData?.showCorrectAnswers ?? true);
  const [showResultImmediately, setShowResultImmediately] = useState(initialResultData?.showResultImmediately ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resultId && !initialResultData) {
      api.getStudentResult(resultId)
        .then((data) => {
          setResult(data.result);
          setShowCorrectAnswers(data.showCorrectAnswers);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load test result details');
          setLoading(false);
        });
    }
  }, [resultId, initialResultData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="animate-spin border-4 border-indigo-600 border-t-transparent rounded-full w-12 h-12 mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Evaluating test submission & generating scorecard...</p>
      </div>
    );
  }

  // If teacher turned off immediate result display
  if (!showResultImmediately) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Test Submitted Successfully!</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
          Your examination answers have been recorded in the database. Results will be available after teacher review and evaluation.
        </p>
        <button
          onClick={onBack}
          className="mt-8 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to View Result</h2>
        <p className="text-sm text-rose-600 mt-2">{error || 'Result details unavailable.'}</p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <span className="text-xs font-mono text-slate-500">
          Result ID: {result.id}
        </span>
      </div>

      {/* Score Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full mb-2">
              Official Examination Scorecard
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{result.testName}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Student: <span className="font-semibold text-slate-800 dark:text-slate-200">{result.studentName}</span> • Class {result.class} ({result.section}) • Roll #{result.rollNumber}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 font-medium">Grade</div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{result.grade}</div>
            </div>

            <div className="text-center px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 font-medium">Status</div>
              <Badge variant={result.passStatus === 'Pass' ? 'success' : 'danger'} size="md">
                {result.passStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500">Marks Obtained</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {result.marksObtained} <span className="text-xs text-slate-400">/ {result.totalMarks}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500">Percentage</div>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{result.percentage}%</div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500">Correct Answers</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{result.correctCount}</div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500">Incorrect / Unanswered</div>
            <div className="text-xl font-bold text-rose-600 mt-1">{result.incorrectCount + result.unansweredCount}</div>
          </div>
        </div>
      </div>

      {/* Detailed Question Review List */}
      {showCorrectAnswers && result.detailedEvaluations && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Detailed Answer Evaluation
          </h3>

          <div className="space-y-4">
            {result.detailedEvaluations.map((item, idx) => {
              const isCorrect = item.status === 'correct';
              const isUnans = item.status === 'unanswered';
              const isPending = item.status === 'pending_review';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-sm space-y-2 ${
                    isCorrect
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : isUnans
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      : isPending
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      Q{idx + 1}. {item.questionText}
                    </div>
                    <Badge
                      variant={isCorrect ? 'success' : isPending ? 'warning' : isUnans ? 'neutral' : 'danger'}
                      size="sm"
                    >
                      {item.marksObtained} / {item.marks} Marks
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="font-semibold text-slate-500">Your Answer: </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{item.studentAnswer}</span>
                    </div>

                    <div>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Correct Answer: </span>
                      <span className="font-mono text-emerald-800 dark:text-emerald-300">{item.correctAnswer}</span>
                    </div>

                    {item.feedback && (
                      <div className="text-[11px] text-slate-500 italic mt-1">Note: {item.feedback}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

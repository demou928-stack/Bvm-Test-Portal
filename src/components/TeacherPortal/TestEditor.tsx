import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Test, Question, QuestionType, Section, DifficultyLevel } from '../../types';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Save, ArrowLeft, HelpCircle, Check, Sparkles, BookOpen } from 'lucide-react';

interface TestEditorProps {
  initialTest?: Test | null;
  onSave: () => void;
  onCancel: () => void;
}

const SECTIONS: (Section | 'ALL')[] = ['ALL', 'Creator', 'Innovator', 'Pathfinder', 'Originator', 'Developer', 'Explorer'];

export const TestEditor: React.FC<TestEditorProps> = ({ initialTest, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [testName, setTestName] = useState(initialTest?.testName || '');
  const [subject, setSubject] = useState(initialTest?.subject || 'Computer Science');
  const [chapter, setChapter] = useState(initialTest?.chapter || '');
  const [testClass, setTestClass] = useState(initialTest?.class || '8');
  const [testSection, setTestSection] = useState<Section | 'ALL'>(initialTest?.section || 'Explorer');
  const [testCode, setTestCode] = useState(
    initialTest?.testCode || `BVM-AI-${testClass}${String(testSection).substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [durationMinutes, setDurationMinutes] = useState(initialTest?.durationMinutes || 30);
  const [startDate, setStartDate] = useState(initialTest?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialTest?.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [passingMarks, setPassingMarks] = useState(initialTest?.passingMarks || 4);
  const [instructions, setInstructions] = useState(
    initialTest?.instructions || '1. All questions are compulsory.\n2. Read questions carefully before submitting.'
  );

  // Settings
  const [showResultImmediately, setShowResultImmediately] = useState(initialTest?.settings?.showResultImmediately ?? true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(initialTest?.settings?.showCorrectAnswers ?? true);
  const [questionShuffle, setQuestionShuffle] = useState(initialTest?.settings?.questionShuffle ?? false);
  const [optionShuffle, setOptionShuffle] = useState(initialTest?.settings?.optionShuffle ?? false);
  const [negativeMarking, setNegativeMarking] = useState(initialTest?.settings?.negativeMarking || 0);

  // Questions List
  const [questions, setQuestions] = useState<Partial<Question>[]>(
    initialTest?.questions || [
      {
        id: 'q_1',
        questionType: 'MCQ',
        questionText: 'What does AI stand for?',
        options: ['Artificial Intelligence', 'Automatic Internet', 'Advanced Information', 'Applied Integration'],
        correctAnswer: 'Artificial Intelligence',
        marks: 1,
        order: 1,
        difficulty: 'Easy',
      },
    ]
  );

  // Active question editing state
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(0);

  const calculateTotalMarks = () => questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);

  const handleAddQuestion = (type: QuestionType) => {
    let newQ: Partial<Question> = {
      id: `q_${Date.now()}`,
      questionType: type,
      questionText: 'New Question Text',
      marks: 1,
      order: questions.length + 1,
      difficulty: 'Medium',
    };

    if (type === 'MCQ') {
      newQ.options = ['Option A', 'Option B', 'Option C', 'Option D'];
      newQ.correctAnswer = 'Option A';
    } else if (type === 'TRUE_FALSE') {
      newQ.correctAnswer = 'True';
    } else if (type === 'FILL_IN_BLANKS') {
      newQ.correctAnswer = 'correct answer';
      newQ.acceptedAnswers = ['correct answer', 'Correct Answer'];
    } else if (type === 'QUESTION_ANSWER') {
      newQ.correctAnswer = 'Descriptive expected answer text';
      newQ.acceptedAnswers = ['key concept phrase'];
      newQ.keywords = ['key', 'concept'];
      newQ.marks = 3;
    }

    const updated = [...questions, newQ];
    setQuestions(updated);
    setEditingQuestionIdx(updated.length - 1);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('A test must have at least 1 question.');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setEditingQuestionIdx(Math.max(0, idx - 1));
  };

  const handleDuplicateQuestion = (idx: number) => {
    const q = questions[idx];
    const dup = { ...q, id: `q_${Date.now()}` };
    const updated = [...questions.slice(0, idx + 1), dup, ...questions.slice(idx + 1)];
    setQuestions(updated);
    setEditingQuestionIdx(idx + 1);
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === questions.length - 1)) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
    setEditingQuestionIdx(targetIdx);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!testName.trim() || !testCode.trim()) {
      setError('Test Name and Unique Test Code are required.');
      return;
    }

    setLoading(true);

    const payload: Partial<Test> = {
      testName: testName.trim(),
      testCode: testCode.trim(),
      subject: subject.trim(),
      chapter: chapter.trim(),
      class: testClass,
      section: testSection,
      durationMinutes: Number(durationMinutes) || 30,
      startDate,
      endDate,
      passingMarks: Number(passingMarks) || 4,
      instructions,
      settings: {
        showResultImmediately,
        showCorrectAnswers,
        questionShuffle,
        optionShuffle,
        negativeMarking: Number(negativeMarking) || 0,
        attemptsAllowed: 1,
        requireTestCode: true,
      },
      questions: questions as Question[],
      status: 'active',
    };

    try {
      if (initialTest) {
        await api.updateTest(initialTest.id, payload);
      } else {
        await api.createTest(payload);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save test.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialTest ? 'Edit Examination Test' : 'Create New Examination Test'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Class {testClass} Section {testSection} • Total Questions: {questions.length} • Total Marks: {calculateTotalMarks()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTest}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save & Publish Test'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Main Form Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Test Details & Settings Form (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Test Configuration</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Test Title *</label>
            <input
              type="text"
              required
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. AI & Computer Chapter 1 Test"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unique Test Code *
            </label>
            <input
              type="text"
              required
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 font-mono text-xs font-bold text-blue-900 dark:text-blue-200 uppercase focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Class *</label>
              <select
                value={testClass}
                onChange={(e) => setTestClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="ALL">ALL Classes (1-12)</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Section *</label>
              <select
                value={testSection}
                onChange={(e) => setTestSection(e.target.value as Section | 'ALL')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Passing Marks</label>
              <input
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Negative Marking</label>
              <input
                type="number"
                step="0.25"
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Show Result Immediately</span>
              <input
                type="checkbox"
                checked={showResultImmediately}
                onChange={(e) => setShowResultImmediately(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Show Correct Answers in Review</span>
              <input
                type="checkbox"
                checked={showCorrectAnswers}
                onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Right Col: Questions Builder & Editor (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Question Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Add Question Type:</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddQuestion('MCQ')}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200"
              >
                + MCQ
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('TRUE_FALSE')}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg border border-indigo-200"
              >
                + True / False
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('FILL_IN_BLANKS')}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-200"
              >
                + Fill In Blank
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('QUESTION_ANSWER')}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-lg border border-purple-200"
              >
                + Q & A (Descriptive)
              </button>
            </div>
          </div>

          {/* Question List & Active Form */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isEditing = editingQuestionIdx === idx;

              return (
                <div
                  key={q.id || idx}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-sm ${
                    isEditing
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {/* Header Row */}
                  <div
                    onClick={() => setEditingQuestionIdx(idx)}
                    className="p-4 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-t-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-sm">
                        {q.questionText || 'Empty Question'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[11px]">
                        {q.questionType}
                      </span>
                      <span className="font-bold text-blue-600">{q.marks} Marks</span>

                      <div className="flex items-center gap-1 pl-2 border-l border-slate-300">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, 'up');
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, 'down');
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuestion(idx);
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(idx);
                          }}
                          className="p-1 hover:bg-rose-100 rounded text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Body Editor if Expanded */}
                  {isEditing && (
                    <div className="p-5 space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold mb-1">Question Prompt Text *</label>
                        <textarea
                          rows={2}
                          value={q.questionText}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].questionText = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full p-3 border rounded-xl font-medium"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Marks</label>
                          <input
                            type="number"
                            value={q.marks}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].marks = Number(e.target.value);
                              setQuestions(updated);
                            }}
                            className="w-full p-2 border rounded-xl font-medium"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Optional Image URL</label>
                          <input
                            type="text"
                            value={q.imageUrl || ''}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].imageUrl = e.target.value;
                              setQuestions(updated);
                            }}
                            placeholder="https://..."
                            className="w-full p-2 border rounded-xl font-medium"
                          />
                        </div>
                      </div>

                      {/* Question Specific Fields */}
                      {q.questionType === 'MCQ' && (
                        <div className="space-y-2 pt-2 border-t">
                          <label className="block font-semibold">Options & Correct Answer</label>
                          {(q.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct_${idx}`}
                                checked={q.correctAnswer === opt}
                                onChange={() => {
                                  const updated = [...questions];
                                  updated[idx].correctAnswer = opt;
                                  setQuestions(updated);
                                }}
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  const newOpts = [...(updated[idx].options || [])];
                                  newOpts[optIdx] = e.target.value;
                                  if (updated[idx].correctAnswer === opt) {
                                    updated[idx].correctAnswer = e.target.value;
                                  }
                                  updated[idx].options = newOpts;
                                  setQuestions(updated);
                                }}
                                className="w-full p-2 border rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.questionType === 'TRUE_FALSE' && (
                        <div className="pt-2 border-t">
                          <label className="block font-semibold mb-1">Correct Choice</label>
                          <div className="flex gap-4">
                            {['True', 'False'].map((val) => (
                              <label key={val} className="flex items-center gap-1.5 font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf_${idx}`}
                                  checked={q.correctAnswer === val}
                                  onChange={() => {
                                    const updated = [...questions];
                                    updated[idx].correctAnswer = val;
                                    setQuestions(updated);
                                  }}
                                />
                                {val}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.questionType === 'FILL_IN_BLANKS' && (
                        <div className="pt-2 border-t space-y-2">
                          <label className="block font-semibold">Exact Correct Answer</label>
                          <input
                            type="text"
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].correctAnswer = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full p-2 border rounded-lg font-medium"
                          />

                          <label className="block font-semibold">Accepted Variations (Comma-separated)</label>
                          <input
                            type="text"
                            value={(q.acceptedAnswers || []).join(', ')}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].acceptedAnswers = e.target.value.split(',').map((s) => s.trim());
                              setQuestions(updated);
                            }}
                            placeholder="e.g. machine learning, Machine Learning, ML"
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>
                      )}

                      {q.questionType === 'QUESTION_ANSWER' && (
                        <div className="pt-2 border-t space-y-2">
                          <label className="block font-semibold">Expected / Model Answer</label>
                          <textarea
                            rows={2}
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].correctAnswer = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full p-2 border rounded-lg"
                          />

                          <label className="block font-semibold">Auto-Evaluation Keywords (Comma-separated)</label>
                          <input
                            type="text"
                            value={(q.keywords || []).join(', ')}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].keywords = e.target.value.split(',').map((s) => s.trim());
                              setQuestions(updated);
                            }}
                            placeholder="e.g. intelligence, learn, data, human, computer"
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

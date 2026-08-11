export type Role = 'teacher' | 'student';

export type Section = 'Creator' | 'Innovator' | 'Pathfinder' | 'Originator' | 'Developer' | 'Explorer' | string;

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'FILL_IN_BLANKS' | 'QUESTION_ANSWER';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type TestStatus = 'draft' | 'active' | 'deactivated' | 'completed';

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired';

export interface User {
  id: string;
  studentId?: string;
  name: string;
  role: Role;
  class?: string;
  section?: Section;
  rollNumber?: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface Question {
  id: string;
  testId?: string;
  questionType: QuestionType;
  questionText: string;
  imageUrl?: string;
  options?: string[]; // for MCQ
  correctAnswer: string; // index string for MCQ or 'True'/'False' or exact answer
  acceptedAnswers?: string[]; // for Fill in the Blanks / Q&A
  keywords?: string[]; // for Q&A matching
  marks: number;
  order: number;
  class?: string;
  section?: Section;
  subject?: string;
  chapter?: string;
  difficulty?: DifficultyLevel;
}

export interface TestSettings {
  showResultImmediately: boolean;
  showCorrectAnswers: boolean;
  questionShuffle: boolean;
  optionShuffle: boolean;
  negativeMarking: number;
  attemptsAllowed: number;
  requireTestCode: boolean;
}

export interface Test {
  id: string;
  testCode: string;
  testName: string;
  subject: string;
  chapter: string;
  class: string; // '1'-'12' or 'ALL'
  section: Section | 'ALL';
  durationMinutes: number;
  startDate: string;
  endDate: string;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  settings: TestSettings;
  questions: Question[];
  status: TestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TestAttemptProgress {
  attemptId: string;
  studentId: string;
  testId: string;
  testCode: string;
  studentName: string;
  class: string;
  section: Section;
  rollNumber: string;
  startTime: number;
  endTime: number;
  lastSavedTime: number;
  answers: Record<string, string>;
  markedForReview: string[];
  tabSwitchCount: number;
  status: AttemptStatus;
}

export interface EvaluationItem {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  marksObtained: number;
  studentAnswer: string;
  correctAnswer: string;
  status: 'correct' | 'incorrect' | 'unanswered' | 'pending_review';
  feedback?: string;
}

export interface TestResult {
  id: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  class: string;
  section: Section;
  rollNumber: string;
  testId: string;
  testCode: string;
  testName: string;
  subject: string;
  chapter: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  needsReviewCount: number;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  passStatus: 'Pass' | 'Fail';
  submissionDate: string;
  submissionTime: string;
  detailedEvaluations: EvaluationItem[];
  teacherReviewed?: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  totalTests: number;
  activeTests: number;
  completedTests: number;
  totalAttempts: number;
  averageScore: number;
  passPercentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'test_submitted' | 'test_created' | 'student_added' | 'result_reviewed';
  message: string;
  timestamp: string;
}

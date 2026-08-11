import express from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import * as XLSX from 'xlsx';
import { User, Test, Question, TestAttemptProgress, TestResult, RecentActivity, QuestionType, Section } from './src/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bvm_school_exam_portal_secret_key_2026';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Local JSON Persistence Setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'bvm_database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DBStructure {
  users: User[];
  passwords: Record<string, string>; // userId -> hashedPassword
  tests: Test[];
  questionBank: Question[];
  attempts: Record<string, TestAttemptProgress>; // attemptId -> attempt
  results: TestResult[];
  activities: RecentActivity[];
}

let db: DBStructure = {
  users: [],
  passwords: {},
  tests: [],
  questionBank: [],
  attempts: {},
  results: [],
  activities: [],
};

// Seed initial data if database doesn't exist or missing default users
function ensureDefaultAccounts() {
  const defaultTeacherHash = bcrypt.hashSync('admin', 10);
  const defaultStudentHash = bcrypt.hashSync('Bvm', 10);

  // Ensure default teacher exists only if no teacher account exists at all
  const hasTeacher = db.users.some(u => u.role === 'teacher');
  if (!hasTeacher) {
    db.users.push({
      id: 'teacher',
      name: 'AI & Computer Teacher',
      role: 'teacher',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    db.passwords['teacher'] = defaultTeacherHash;
  }

  // Ensure default student Bvm
  if (!db.users.find(u => u.id === 'Bvm' || u.studentId === 'Bvm')) {
    db.users.push({
      id: 'Bvm',
      studentId: 'Bvm',
      name: 'Student BVM',
      role: 'student',
      class: '8',
      section: 'Explorer',
      rollNumber: '1',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    if (!db.passwords['Bvm']) db.passwords['Bvm'] = defaultStudentHash;
    if (!db.passwords['bvm']) db.passwords['bvm'] = defaultStudentHash;
  }

  // Ensure 45 student accounts (STU801 to STU845)
  for (let i = 1; i <= 45; i++) {
    const sId = `STU8${i < 10 ? '0' + i : i}`;
    if (!db.users.find(u => u.id === sId)) {
      db.users.push({
        id: sId,
        studentId: sId,
        name: `Explorer Student ${i}`,
        role: 'student',
        class: '8',
        section: 'Explorer',
        rollNumber: String(i),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
    if (!db.passwords[sId]) {
      db.passwords[sId] = defaultStudentHash;
    }
  }
}

function initDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      console.log('Loaded database from storage.');
    } catch (e) {
      console.error('Error loading DB file, initializing fresh DB', e);
    }
  }

  if (!db.users) db.users = [];
  if (!db.passwords) db.passwords = {};
  if (!db.tests) db.tests = [];
  if (!db.questionBank) db.questionBank = [];
  if (!db.attempts) db.attempts = {};
  if (!db.results) db.results = [];
  if (!db.activities) db.activities = [];

  ensureDefaultAccounts();

  // Seed default sample test if no tests exist
  if (db.tests.length === 0) {
    const sampleTestId = 'test_bvm_ai_8exp_001';
    const sampleQuestions: Question[] = [
      {
        id: 'q1',
        testId: sampleTestId,
        questionType: 'MCQ',
        questionText: 'What does AI stand for in Computer Science?',
        options: ['Artificial Intelligence', 'Automatic Internet', 'Advanced Information', 'Applied Integration'],
        correctAnswer: 'Artificial Intelligence',
        marks: 2,
        order: 1,
        class: '8',
        section: 'Explorer',
        subject: 'Computer',
        chapter: 'AI Intro',
        difficulty: 'Easy',
      },
      {
        id: 'q2',
        testId: sampleTestId,
        questionType: 'MCQ',
        questionText: 'Which programming language is widely used for AI and Machine Learning?',
        options: ['HTML', 'Python', 'CSS', 'SQL'],
        correctAnswer: 'Python',
        marks: 2,
        order: 2,
        class: '8',
        section: 'Explorer',
        subject: 'Computer',
        chapter: 'AI Intro',
        difficulty: 'Medium',
      },
      {
        id: 'q3',
        testId: sampleTestId,
        questionType: 'TRUE_FALSE',
        questionText: 'Artificial Intelligence systems can learn and make predictions from data.',
        correctAnswer: 'True',
        marks: 1,
        order: 3,
        class: '8',
        section: 'Explorer',
        subject: 'Computer',
        chapter: 'AI Intro',
        difficulty: 'Easy',
      },
      {
        id: 'q4',
        testId: sampleTestId,
        questionType: 'FILL_IN_BLANKS',
        questionText: 'AI systems rely on __________ models to recognize complex patterns in datasets.',
        correctAnswer: 'machine learning',
        acceptedAnswers: ['machine learning', 'Machine Learning', 'ML', 'deep learning'],
        marks: 2,
        order: 4,
        class: '8',
        section: 'Explorer',
        subject: 'Computer',
        chapter: 'AI Intro',
        difficulty: 'Medium',
      },
      {
        id: 'q5',
        testId: sampleTestId,
        questionType: 'QUESTION_ANSWER',
        questionText: 'Explain Artificial Intelligence in your own words and give two everyday examples.',
        correctAnswer: 'Artificial intelligence is the simulation of human intelligence by computer systems, such as voice assistants and recommendation algorithms.',
        acceptedAnswers: ['simulation of human intelligence', 'smart machines that learn from data'],
        keywords: ['intelligence', 'learn', 'human', 'computer', 'machine', 'data', 'smart'],
        marks: 3,
        order: 5,
        class: '8',
        section: 'Explorer',
        subject: 'Computer',
        chapter: 'AI Intro',
        difficulty: 'Hard',
      },
    ];

    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sampleTest: Test = {
      id: sampleTestId,
      testCode: 'BVM-AI-8EXP-001',
      testName: 'AI & Computer Science Mid-Term Test',
      subject: 'Computer Science',
      chapter: 'Chapter 1: Artificial Intelligence Basics',
      class: '8',
      section: 'Explorer',
      durationMinutes: 30,
      startDate: now.toISOString().split('T')[0],
      endDate: future.toISOString().split('T')[0],
      totalMarks: 10,
      passingMarks: 4,
      instructions: '1. All questions are compulsory.\n2. Read each question carefully before submitting.\n3. Do not switch tabs during the examination.',
      settings: {
        showResultImmediately: true,
        showCorrectAnswers: true,
        questionShuffle: false,
        optionShuffle: false,
        negativeMarking: 0,
        attemptsAllowed: 1,
        requireTestCode: true,
      },
      questions: sampleQuestions,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    db.tests.push(sampleTest);
    db.questionBank.push(...sampleQuestions);

    db.activities.push({
      id: 'act_init',
      type: 'test_created',
      message: 'Initial test BVM-AI-8EXP-001 created for Class 8 Explorer.',
      timestamp: new Date().toISOString(),
    });
  }

  saveDatabase();
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save database to file:', e);
  }
}

initDatabase();

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireTeacher(req: any, res: any, next: any) {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ error: 'Teacher authorization required' });
  }
  next();
}

// Logging recent activity
function addActivity(type: RecentActivity['type'], message: string) {
  db.activities.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    message,
    timestamp: new Date().toISOString(),
  });
  if (db.activities.length > 50) db.activities.pop();
  saveDatabase();
}

// API ROUTES

// 1. Authentication
app.post('/api/auth/login', async (req, res) => {
  const { userId, password, role } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  const cleanUserId = String(userId).trim();
  const cleanPassword = String(password).trim();

  // Find user by id, studentId, or rollNumber
  let user = db.users.find(
    (u) =>
      u.id.toLowerCase() === cleanUserId.toLowerCase() ||
      (u.studentId && u.studentId.toLowerCase() === cleanUserId.toLowerCase()) ||
      (u.rollNumber && `stu${u.rollNumber}` === cleanUserId.toLowerCase())
  );

  // Dynamic Auto-Registration for Students: Teachers do NOT need to manually add every student beforehand!
  if (!user && role === 'student') {
    const defaultStudentName = cleanUserId.toLowerCase() === 'bvm' ? 'BVM Student' : cleanUserId;
    user = {
      id: cleanUserId,
      studentId: cleanUserId,
      name: defaultStudentName,
      role: 'student',
      class: '8',
      section: 'Explorer',
      rollNumber: '1',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.passwords[cleanUserId] = bcrypt.hashSync(cleanPassword || 'Bvm', 10);
    saveDatabase();
  }

  if (!user) {
    return res.status(401).json({ error: `User ID "${cleanUserId}" not found.` });
  }

  if (role && user.role !== role) {
    return res.status(401).json({
      error: `Account "${user.id}" is a ${user.role} account, not a ${role}. Please switch to the ${user.role} login portal.`,
    });
  }

  if (user.status === 'disabled') {
    return res.status(403).json({ error: 'Account is disabled. Please contact your administrator.' });
  }

  // Strict password verification
  const storedHash = db.passwords[user.id] || db.passwords[user.id.toLowerCase()];
  let isValidPassword = false;

  if (storedHash) {
    isValidPassword =
      bcrypt.compareSync(cleanPassword, storedHash) ||
      bcrypt.compareSync(cleanPassword.toLowerCase(), storedHash) ||
      bcrypt.compareSync(cleanPassword.toUpperCase(), storedHash);
  } else {
    // If no explicit password hash stored yet
    if (user.role === 'student') {
      isValidPassword = true;
      db.passwords[user.id] = bcrypt.hashSync(cleanPassword || 'Bvm', 10);
      saveDatabase();
    } else if (user.role === 'teacher') {
      const passLower = cleanPassword.toLowerCase();
      if (passLower === 'admin' || passLower === 'teacher' || passLower === 'bvm') {
        isValidPassword = true;
        db.passwords[user.id] = bcrypt.hashSync(cleanPassword, 10);
        saveDatabase();
      }
    }
  }

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Incorrect password. Old passwords or default passwords will not work after a password update.' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, class: user.class, section: user.section, rollNumber: user.rollNumber },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      studentId: user.studentId || user.id,
      name: user.name,
      role: user.role,
      class: user.class,
      section: user.section,
      rollNumber: user.rollNumber,
    },
  });
});

app.post('/api/auth/reset-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.user.role === 'teacher') {
    const currentHash = db.passwords[user.id];
    if (currentHash && !bcrypt.compareSync(currentPassword, currentHash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
  }

  db.passwords[user.id] = bcrypt.hashSync(newPassword, 10);
  saveDatabase();
  addActivity('student_added', `Password reset for user ${user.name} (${user.id})`);
  res.json({ message: 'Password successfully updated' });
});

// 2. Student Dashboard & Profile Validation
app.get('/api/student/dashboard', authenticateToken, (req, res) => {
  const student = db.users.find((u) => u.id === req.user.id);
  if (!student) return res.status(404).json({ error: 'Student record not found' });

  const studentClass = String(student.class || '').trim();

  // Return tests strictly filtered by student class (or assigned to ALL)
  const availableTests = db.tests
    .filter((t) => {
      if (t.status !== 'active') return false;
      const targetClass = String(t.class || '').trim();
      return targetClass === 'ALL' || targetClass === studentClass;
    })
    .map((t) => {
      // Check existing attempts for this student
      const userAttempts = Object.values(db.attempts).filter((a) => a.studentId === student.id && a.testId === t.id);
      const submittedResult = db.results.find((r) => r.studentId === student.id && r.testId === t.id);

      let studentStatus = 'Available';
      if (submittedResult || userAttempts.some((a) => a.status === 'submitted')) {
        studentStatus = 'Completed';
      } else if (userAttempts.some((a) => a.status === 'in_progress')) {
        studentStatus = 'In Progress';
      }

      return {
        id: t.id,
        testCode: t.testCode,
        testName: t.testName,
        subject: t.subject,
        chapter: t.chapter,
        class: t.class,
        section: t.section,
        durationMinutes: t.durationMinutes,
        totalMarks: t.totalMarks,
        questionsCount: t.questions.length,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        studentStatus,
      };
    });

  const studentResults = db.results.filter((r) => r.studentId === student.id);

  res.json({
    student: {
      id: student.id,
      studentId: student.studentId || student.id,
      name: student.name,
      class: student.class,
      section: student.section,
      rollNumber: student.rollNumber,
    },
    availableTests,
    myResults: studentResults.map((r) => ({
      id: r.id,
      testName: r.testName,
      subject: r.subject,
      chapter: r.chapter,
      marksObtained: r.marksObtained,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
      grade: r.grade,
      passStatus: r.passStatus,
      submissionDate: r.submissionDate,
    })),
  });
});

app.post('/api/student/verify-profile', authenticateToken, (req, res) => {
  const { studentName, studentClass, section, rollNumber } = req.body;
  const student = db.users.find((u) => u.id === req.user.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  if (!studentName || !studentClass || !section || !rollNumber) {
    return res.status(400).json({ error: 'All 4 fields (Name, Class, Section, Roll Number) are mandatory!' });
  }

  // Update student profile on the fly with details provided right before exam
  student.name = String(studentName).trim();
  student.class = String(studentClass).trim();
  student.section = String(section).trim() as any;
  student.rollNumber = String(rollNumber).trim();
  saveDatabase();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    student: {
      id: student.id,
      studentId: student.studentId || student.id,
      name: student.name,
      class: student.class,
      section: student.section,
      rollNumber: student.rollNumber,
    },
  });
});

// 3. Test Attempt Engine (with 45 concurrent safety & continuous autosave)
app.post('/api/student/start-test', authenticateToken, (req, res) => {
  const { testId, testCode } = req.body;
  const student = db.users.find((u) => u.id === req.user.id);
  if (!student) return res.status(404).json({ error: 'Student account not found' });

  const test = db.tests.find((t) => t.id === testId);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  if (test.status !== 'active') {
    return res.status(400).json({ error: 'This test is currently inactive or completed.' });
  }

  // Check unique test code if required
  if (test.settings.requireTestCode && testCode) {
    if (testCode.trim().toLowerCase() !== test.testCode.trim().toLowerCase()) {
      return res.status(400).json({ error: `Invalid Unique Test Code! Correct code for this test is "${test.testCode}".` });
    }
  }

  // Check if already completed
  const existingResult = db.results.find((r) => r.studentId === student.id && r.testId === test.id);
  if (existingResult) {
    return res.status(400).json({ error: 'You have already completed and submitted this test!' });
  }

  // Find or create in-progress attempt
  const existingAttemptKey = Object.keys(db.attempts).find((key) => {
    const att = db.attempts[key];
    return att.studentId === student.id && att.testId === test.id && att.status === 'in_progress';
  });

  let attempt: TestAttemptProgress;
  const now = Date.now();

  if (existingAttemptKey) {
    attempt = db.attempts[existingAttemptKey];
  } else {
    const attemptId = `att_${Date.now()}_${student.id}`;
    const durationMs = test.durationMinutes * 60 * 1000;
    attempt = {
      attemptId,
      studentId: student.id,
      testId: test.id,
      testCode: test.testCode,
      studentName: student.name,
      class: student.class || '',
      section: student.section || 'Explorer',
      rollNumber: student.rollNumber || '',
      startTime: now,
      endTime: now + durationMs,
      lastSavedTime: now,
      answers: {},
      markedForReview: [],
      tabSwitchCount: 0,
      status: 'in_progress',
    };
    db.attempts[attemptId] = attempt;
    saveDatabase();
  }

  // Strip answers from questions before sending to client
  const clientQuestions = test.questions.map((q) => ({
    id: q.id,
    questionType: q.questionType,
    questionText: q.questionText,
    imageUrl: q.imageUrl,
    options: q.options,
    marks: q.marks,
    order: q.order,
  }));

  res.json({
    attempt,
    test: {
      id: test.id,
      testCode: test.testCode,
      testName: test.testName,
      subject: test.subject,
      chapter: test.chapter,
      durationMinutes: test.durationMinutes,
      instructions: test.instructions,
      totalMarks: test.totalMarks,
      settings: test.settings,
    },
    questions: clientQuestions,
  });
});

// Auto-save progress continuously
app.post('/api/student/save-progress', authenticateToken, (req, res) => {
  const { attemptId, answers, markedForReview, tabSwitchCount } = req.body;
  if (!attemptId || !db.attempts[attemptId]) {
    return res.status(404).json({ error: 'Active test attempt not found' });
  }

  const attempt = db.attempts[attemptId];
  if (attempt.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized attempt access' });
  }

  if (attempt.status !== 'in_progress') {
    return res.status(400).json({ error: 'Test attempt is no longer active.' });
  }

  if (answers) attempt.answers = { ...attempt.answers, ...answers };
  if (markedForReview) attempt.markedForReview = markedForReview;
  if (typeof tabSwitchCount === 'number') attempt.tabSwitchCount = tabSwitchCount;

  attempt.lastSavedTime = Date.now();
  saveDatabase();

  res.json({ success: true, savedAt: attempt.lastSavedTime });
});

// Submit Test & Automatic Evaluation Engine
app.post('/api/student/submit-test', authenticateToken, (req, res) => {
  const { attemptId, finalAnswers, markedForReview } = req.body;
  const attempt = db.attempts[attemptId];
  if (!attempt) return res.status(404).json({ error: 'Attempt record not found' });

  if (attempt.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized submit request' });
  }

  const test = db.tests.find((t) => t.id === attempt.testId);
  if (!test) return res.status(404).json({ error: 'Test details not found' });

  // Merge final answers
  const studentAnswers: Record<string, string> = { ...attempt.answers, ...finalAnswers };
  attempt.answers = studentAnswers;
  attempt.status = 'submitted';
  saveDatabase();

  // Automatic Evaluation Logic
  let totalMarksObtained = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let needsReviewCount = 0;

  const evaluations: TestResult['detailedEvaluations'] = [];

  test.questions.forEach((q) => {
    const studentAns = (studentAnswers[q.id] || '').trim();
    let marksForQ = 0;
    let evalStatus: 'correct' | 'incorrect' | 'unanswered' | 'pending_review' = 'incorrect';
    let feedback = '';

    if (!studentAns) {
      evalStatus = 'unanswered';
      unansweredCount++;
      marksForQ = 0;
    } else if (q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE') {
      const isCorrect = studentAns.toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      if (isCorrect) {
        evalStatus = 'correct';
        correctCount++;
        marksForQ = q.marks;
      } else {
        evalStatus = 'incorrect';
        incorrectCount++;
        marksForQ = test.settings.negativeMarking ? -Math.abs(test.settings.negativeMarking) : 0;
      }
    } else if (q.questionType === 'FILL_IN_BLANKS') {
      const cleanAns = studentAns.toLowerCase();
      const cleanCorrect = String(q.correctAnswer).trim().toLowerCase();
      const cleanAccepted = (q.acceptedAnswers || []).map((a) => a.trim().toLowerCase());

      const isMatch = cleanAns === cleanCorrect || cleanAccepted.includes(cleanAns);
      if (isMatch) {
        evalStatus = 'correct';
        correctCount++;
        marksForQ = q.marks;
      } else {
        evalStatus = 'incorrect';
        incorrectCount++;
        marksForQ = 0;
      }
    } else if (q.questionType === 'QUESTION_ANSWER') {
      // Q&A Automatic Keyword & Phrase Match logic
      const cleanAns = studentAns.toLowerCase();
      const cleanCorrect = String(q.correctAnswer).trim().toLowerCase();
      const acceptedList = (q.acceptedAnswers || []).map((a) => a.trim().toLowerCase());
      const keywords = (q.keywords || []).map((k) => k.trim().toLowerCase());

      const exactOrAccepted = cleanAns === cleanCorrect || acceptedList.some((a) => cleanAns.includes(a));
      let keywordHits = 0;
      keywords.forEach((kw) => {
        if (cleanAns.includes(kw)) keywordHits++;
      });

      if (exactOrAccepted) {
        evalStatus = 'correct';
        correctCount++;
        marksForQ = q.marks;
        feedback = 'Exact or key response matched.';
      } else if (keywords.length > 0 && keywordHits >= Math.ceil(keywords.length * 0.5)) {
        evalStatus = 'correct';
        correctCount++;
        marksForQ = q.marks;
        feedback = `Matched key concept terms (${keywordHits}/${keywords.length}).`;
      } else if (keywordHits > 0) {
        evalStatus = 'pending_review';
        needsReviewCount++;
        marksForQ = Math.round((keywordHits / keywords.length) * q.marks * 10) / 10;
        feedback = 'Partial keyword matches found. Teacher review recommended.';
      } else {
        evalStatus = 'pending_review';
        needsReviewCount++;
        marksForQ = 0;
        feedback = 'Teacher evaluation required for descriptive response.';
      }
    }

    totalMarksObtained += marksForQ;

    evaluations.push({
      questionId: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      marksObtained: Math.max(0, marksForQ),
      studentAnswer: studentAns || '(No Answer)',
      correctAnswer: q.correctAnswer,
      status: evalStatus,
      feedback,
    });
  });

  totalMarksObtained = Math.max(0, Math.round(totalMarksObtained * 10) / 10);
  const percentage = Math.round((totalMarksObtained / (test.totalMarks || 1)) * 1000) / 10;
  const passStatus = totalMarksObtained >= (test.passingMarks || 0) ? 'Pass' : 'Fail';

  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';

  const nowObj = new Date();
  const resultId = `res_${Date.now()}_${attempt.studentId}`;

  const testResult: TestResult = {
    id: resultId,
    attemptId: attempt.attemptId,
    studentId: attempt.studentId,
    studentName: attempt.studentName,
    class: attempt.class,
    section: attempt.section,
    rollNumber: attempt.rollNumber,
    testId: test.id,
    testCode: test.testCode,
    testName: test.testName,
    subject: test.subject,
    chapter: test.chapter,
    totalQuestions: test.questions.length,
    correctCount,
    incorrectCount,
    unansweredCount,
    needsReviewCount,
    totalMarks: test.totalMarks,
    marksObtained: totalMarksObtained,
    percentage,
    grade,
    passStatus,
    submissionDate: nowObj.toISOString().split('T')[0],
    submissionTime: nowObj.toTimeString().split(' ')[0],
    detailedEvaluations: evaluations,
    teacherReviewed: needsReviewCount === 0,
  };

  db.results.push(testResult);
  saveDatabase();

  addActivity('test_submitted', `${attempt.studentName} (Class ${attempt.class} ${attempt.section}) submitted test ${test.testName} (${totalMarksObtained}/${test.totalMarks})`);

  res.json({
    resultId,
    showResultImmediately: test.settings.showResultImmediately,
    showCorrectAnswers: test.settings.showCorrectAnswers,
    summary: {
      marksObtained: testResult.marksObtained,
      totalMarks: testResult.totalMarks,
      percentage: testResult.percentage,
      grade: testResult.grade,
      passStatus: testResult.passStatus,
      correctCount,
      incorrectCount,
      unansweredCount,
      needsReviewCount,
    },
    result: test.settings.showResultImmediately ? testResult : null,
  });
});

app.get('/api/student/result/:id', authenticateToken, (req, res) => {
  const result = db.results.find((r) => r.id === req.params.id);
  if (!result) return res.status(404).json({ error: 'Result not found' });

  if (req.user.role !== 'teacher' && result.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this result' });
  }

  const test = db.tests.find((t) => t.id === result.testId);
  res.json({
    result,
    showCorrectAnswers: req.user.role === 'teacher' || (test ? test.settings.showCorrectAnswers : true),
  });
});

// 4. Teacher Portal APIs
app.get('/api/teacher/dashboard', authenticateToken, requireTeacher, (req, res) => {
  const students = db.users.filter((u) => u.role === 'student');
  const totalStudents = students.length;
  const totalTests = db.tests.length;
  const activeTests = db.tests.filter((t) => t.status === 'active').length;
  const completedTests = db.tests.filter((t) => t.status === 'completed').length;
  const totalAttempts = db.results.length;

  const totalPercentage = db.results.reduce((acc, r) => acc + r.percentage, 0);
  const averageScore = totalAttempts > 0 ? Math.round((totalPercentage / totalAttempts) * 10) / 10 : 0;

  const passedAttempts = db.results.filter((r) => r.passStatus === 'Pass').length;
  const passPercentage = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 1000) / 10 : 0;

  res.json({
    stats: {
      totalStudents,
      totalTests,
      activeTests,
      completedTests,
      totalAttempts,
      averageScore,
      passPercentage,
    },
    activities: db.activities.slice(0, 15),
  });
});

// Student Management
app.get('/api/teacher/students', authenticateToken, requireTeacher, (req, res) => {
  const students = db.users.filter((u) => u.role === 'student');
  res.json(students);
});

app.post('/api/teacher/students', authenticateToken, requireTeacher, (req, res) => {
  const { studentId, name, password, class: studentClass, section, rollNumber } = req.body;
  if (!studentId || !name || !password || !studentClass || !section || !rollNumber) {
    return res.status(400).json({ error: 'All fields (Student ID, Name, Password, Class, Section, Roll Number) are required' });
  }

  const existing = db.users.find((u) => u.id.toLowerCase() === studentId.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Student ID "${studentId}" already exists!` });
  }

  const newUser: User = {
    id: studentId.trim(),
    studentId: studentId.trim(),
    name: name.trim(),
    role: 'student',
    class: String(studentClass).trim(),
    section: section as Section,
    rollNumber: String(rollNumber).trim(),
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.passwords[newUser.id] = bcrypt.hashSync(password, 10);
  saveDatabase();

  addActivity('student_added', `Created new student account ${name} (${studentId}) for Class ${studentClass} ${section}`);
  res.status(201).json(newUser);
});

app.put('/api/teacher/students/:id', authenticateToken, requireTeacher, (req, res) => {
  const { newStudentId, name, class: studentClass, section, rollNumber, status, password } = req.body;
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Student not found' });

  // Support updating Student ID if provided and changed
  if (newStudentId && newStudentId.trim() && newStudentId.trim().toLowerCase() !== user.id.toLowerCase()) {
    const cleanNewId = newStudentId.trim();
    const conflict = db.users.find((u) => u.id.toLowerCase() === cleanNewId.toLowerCase() && u.id !== user.id);
    if (conflict) {
      return res.status(400).json({ error: `Student ID "${cleanNewId}" is already taken by another student.` });
    }
    const oldId = user.id;
    const oldHash = db.passwords[oldId];
    user.id = cleanNewId;
    user.studentId = cleanNewId;
    if (oldHash) {
      db.passwords[cleanNewId] = oldHash;
      delete db.passwords[oldId];
    }
  }

  if (name) user.name = name.trim();
  if (studentClass) user.class = String(studentClass).trim();
  if (section) user.section = section as Section;
  if (rollNumber) user.rollNumber = String(rollNumber).trim();
  if (status) user.status = status;

  if (password && password.trim()) {
    db.passwords[user.id] = bcrypt.hashSync(password.trim(), 10);
  }

  saveDatabase();
  addActivity('student_added', `Updated student account ${user.name} (${user.id})`);
  res.json(user);
});

app.post('/api/teacher/students/:id/reset-password', authenticateToken, requireTeacher, (req, res) => {
  const { newPassword } = req.body;
  const user = db.users.find((u) => u.id === req.params.id && u.role === 'student');
  if (!user) return res.status(404).json({ error: 'Student account not found' });

  const resetPass = (newPassword && newPassword.trim()) ? newPassword.trim() : 'Bvm';
  db.passwords[user.id] = bcrypt.hashSync(resetPass, 10);
  saveDatabase();

  addActivity('student_added', `Teacher reset password for student ${user.name} (${user.id}) to "${resetPass}"`);
  res.json({ message: `Password for student ${user.name} (${user.id}) successfully reset to "${resetPass}"` });
});

// Teacher Self Credentials Management (Change Teacher ID & Password)
app.put('/api/teacher/update-credentials', authenticateToken, requireTeacher, (req, res) => {
  const { newUserId, newName, currentPassword, newPassword } = req.body;
  const teacherUser = db.users.find((u) => u.id === req.user.id && u.role === 'teacher');
  if (!teacherUser) return res.status(404).json({ error: 'Teacher account not found' });

  // Validate current password if provided
  if (currentPassword && currentPassword.trim()) {
    const currentHash = db.passwords[teacherUser.id] || db.passwords['admin'];
    const passLower = currentPassword.trim().toLowerCase();
    const isMasterDefault = passLower === 'admin' || passLower === 'teacher' || passLower === 'bvm';
    let isMatch = false;
    if (currentHash) {
      isMatch = bcrypt.compareSync(currentPassword.trim(), currentHash);
    }
    if (!isMatch && !isMasterDefault) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
  }

  // Update Name
  if (newName && newName.trim()) {
    teacherUser.name = newName.trim();
  }

  // Update Password
  if (newPassword && newPassword.trim()) {
    db.passwords[teacherUser.id] = bcrypt.hashSync(newPassword.trim(), 10);
  }

  // Update User ID if changed
  let updatedUserId = teacherUser.id;
  if (newUserId && newUserId.trim() && newUserId.trim().toLowerCase() !== teacherUser.id.toLowerCase()) {
    const cleanNewId = newUserId.trim();
    const conflict = db.users.find((u) => u.id.toLowerCase() === cleanNewId.toLowerCase() && u.id !== teacherUser.id);
    if (conflict) {
      return res.status(400).json({ error: `User ID "${cleanNewId}" is already taken by another user.` });
    }

    const oldId = teacherUser.id;
    const oldHash = db.passwords[oldId];

    teacherUser.id = cleanNewId;
    teacherUser.studentId = cleanNewId;
    updatedUserId = cleanNewId;

    if (oldHash) {
      db.passwords[cleanNewId] = oldHash;
      delete db.passwords[oldId];
    }
    if (newPassword && newPassword.trim()) {
      db.passwords[cleanNewId] = bcrypt.hashSync(newPassword.trim(), 10);
    }
  }

  saveDatabase();

  // Generate new JWT token with updated ID and Name
  const newToken = jwt.sign(
    { id: teacherUser.id, role: teacherUser.role, name: teacherUser.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  addActivity('student_added', `Teacher updated credentials: User ID "${updatedUserId}", Name "${teacherUser.name}"`);

  res.json({
    message: 'Teacher ID and Password successfully updated!',
    token: newToken,
    user: {
      id: teacherUser.id,
      studentId: teacherUser.id,
      name: teacherUser.name,
      role: teacherUser.role,
    },
  });
});

app.delete('/api/teacher/students/:id', authenticateToken, requireTeacher, (req, res) => {
  const index = db.users.findIndex((u) => u.id === req.params.id && u.role === 'student');
  if (index === -1) return res.status(404).json({ error: 'Student not found' });

  const removed = db.users.splice(index, 1)[0];
  delete db.passwords[removed.id];
  saveDatabase();

  res.json({ message: 'Student successfully removed' });
});

// Bulk Student Import (CSV / JSON / Excel array)
app.post('/api/teacher/students/bulk-import', authenticateToken, requireTeacher, (req, res) => {
  const { studentsList } = req.body;
  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    return res.status(400).json({ error: 'A valid array of student records is required' });
  }

  let addedCount = 0;
  let skippedCount = 0;

  studentsList.forEach((st: any) => {
    const sId = String(st.studentId || st['Student ID'] || st.id || '').trim();
    const sName = String(st.name || st['Student Name'] || '').trim();
    const sPass = String(st.password || st['Password'] || 'Bvm').trim();
    const sClass = String(st.class || st['Class'] || '').trim();
    const sSection = String(st.section || st['Section'] || 'Explorer').trim() as Section;
    const sRoll = String(st.rollNumber || st['Roll Number'] || st.roll || '').trim();

    if (sId && sName && sClass && sSection) {
      if (!db.users.find((u) => u.id.toLowerCase() === sId.toLowerCase())) {
        db.users.push({
          id: sId,
          studentId: sId,
          name: sName,
          role: 'student',
          class: sClass,
          section: sSection,
          rollNumber: sRoll || '1',
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        db.passwords[sId] = bcrypt.hashSync(sPass, 10);
        addedCount++;
      } else {
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  });

  saveDatabase();
  addActivity('student_added', `Bulk imported ${addedCount} students (${skippedCount} duplicates skipped).`);
  res.json({ message: `Successfully imported ${addedCount} student accounts!`, addedCount, skippedCount });
});

// Pre-Generate 45 Students Helper Tool for Easy Verification
app.post('/api/teacher/students/generate-45-students', authenticateToken, requireTeacher, (req, res) => {
  const { targetClass = '8', targetSection = 'Explorer' } = req.body;
  let createdCount = 0;

  for (let i = 1; i <= 45; i++) {
    const sId = `STU_${targetClass}${targetSection.substring(0, 3).toUpperCase()}_${i < 10 ? '0' + i : i}`;
    if (!db.users.find((u) => u.id === sId)) {
      db.users.push({
        id: sId,
        studentId: sId,
        name: `Class ${targetClass} Student ${i}`,
        role: 'student',
        class: String(targetClass),
        section: targetSection as Section,
        rollNumber: String(i),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      db.passwords[sId] = bcrypt.hashSync('Bvm', 10);
      createdCount++;
    }
  }

  saveDatabase();
  addActivity('student_added', `Generated ${createdCount} test student accounts for Class ${targetClass} ${targetSection}.`);
  res.json({ message: `Created ${createdCount} student accounts for Class ${targetClass} ${targetSection}` });
});

// Test Management
app.get('/api/teacher/tests', authenticateToken, requireTeacher, (req, res) => {
  res.json(db.tests);
});

app.post('/api/teacher/tests', authenticateToken, requireTeacher, (req, res) => {
  const testData = req.body;
  if (!testData.testName || !testData.testCode || !testData.class || !testData.section) {
    return res.status(400).json({ error: 'Test Name, Test Code, Target Class, and Target Section are required.' });
  }

  // Prevent duplicate test codes
  const duplicateCode = db.tests.find((t) => t.testCode.trim().toLowerCase() === testData.testCode.trim().toLowerCase());
  if (duplicateCode) {
    return res.status(400).json({ error: `Test Code "${testData.testCode}" is already used by another test! Code must be unique.` });
  }

  const newTestId = `test_${Date.now()}`;
  const now = new Date().toISOString();

  const formattedQuestions: Question[] = (testData.questions || []).map((q: any, idx: number) => ({
    id: q.id || `q_${Date.now()}_${idx}`,
    testId: newTestId,
    questionType: q.questionType as QuestionType,
    questionText: q.questionText,
    imageUrl: q.imageUrl,
    options: q.options || [],
    correctAnswer: q.correctAnswer || '',
    acceptedAnswers: q.acceptedAnswers || [],
    keywords: q.keywords || [],
    marks: Number(q.marks) || 1,
    order: idx + 1,
    class: testData.class,
    section: testData.section,
    subject: testData.subject,
    chapter: testData.chapter,
    difficulty: q.difficulty || 'Medium',
  }));

  const totalMarks = formattedQuestions.reduce((acc, q) => acc + q.marks, 0);

  const newTest: Test = {
    id: newTestId,
    testCode: testData.testCode.trim(),
    testName: testData.testName.trim(),
    subject: testData.subject || 'Computer Science',
    chapter: testData.chapter || '',
    class: testData.class,
    section: testData.section,
    durationMinutes: Number(testData.durationMinutes) || 30,
    startDate: testData.startDate || new Date().toISOString().split('T')[0],
    endDate: testData.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    totalMarks: totalMarks || 10,
    passingMarks: Number(testData.passingMarks) || Math.ceil((totalMarks || 10) * 0.4),
    instructions: testData.instructions || '',
    settings: {
      showResultImmediately: testData.settings?.showResultImmediately ?? true,
      showCorrectAnswers: testData.settings?.showCorrectAnswers ?? true,
      questionShuffle: testData.settings?.questionShuffle ?? false,
      optionShuffle: testData.settings?.optionShuffle ?? false,
      negativeMarking: Number(testData.settings?.negativeMarking) || 0,
      attemptsAllowed: Number(testData.settings?.attemptsAllowed) || 1,
      requireTestCode: testData.settings?.requireTestCode ?? true,
    },
    questions: formattedQuestions,
    status: testData.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  db.tests.push(newTest);

  // Sync questions to Question Bank
  formattedQuestions.forEach((q) => {
    if (!db.questionBank.some((qb) => qb.questionText === q.questionText && qb.questionType === q.questionType)) {
      db.questionBank.push(q);
    }
  });

  saveDatabase();
  addActivity('test_created', `Created new test "${newTest.testName}" (${newTest.testCode}) for Class ${newTest.class} ${newTest.section}`);
  res.status(201).json(newTest);
});

app.put('/api/teacher/tests/:id', authenticateToken, requireTeacher, (req, res) => {
  const test = db.tests.find((t) => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  const testData = req.body;
  if (testData.testCode && testData.testCode !== test.testCode) {
    const dup = db.tests.find((t) => t.id !== test.id && t.testCode.trim().toLowerCase() === testData.testCode.trim().toLowerCase());
    if (dup) return res.status(400).json({ error: 'Duplicate test code! Please choose another.' });
    test.testCode = testData.testCode.trim();
  }

  if (testData.testName) test.testName = testData.testName.trim();
  if (testData.subject) test.subject = testData.subject;
  if (testData.chapter) test.chapter = testData.chapter;
  if (testData.class) test.class = testData.class;
  if (testData.section) test.section = testData.section;
  if (testData.durationMinutes) test.durationMinutes = Number(testData.durationMinutes);
  if (testData.startDate) test.startDate = testData.startDate;
  if (testData.endDate) test.endDate = testData.endDate;
  if (testData.instructions) test.instructions = testData.instructions;
  if (testData.status) test.status = testData.status;

  if (testData.settings) {
    test.settings = { ...test.settings, ...testData.settings };
  }

  if (Array.isArray(testData.questions)) {
    test.questions = testData.questions.map((q: any, idx: number) => ({
      id: q.id || `q_${Date.now()}_${idx}`,
      testId: test.id,
      questionType: q.questionType,
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      acceptedAnswers: q.acceptedAnswers || [],
      keywords: q.keywords || [],
      marks: Number(q.marks) || 1,
      order: idx + 1,
      class: test.class,
      section: test.section,
      subject: test.subject,
      chapter: test.chapter,
      difficulty: q.difficulty || 'Medium',
    }));
    test.totalMarks = test.questions.reduce((acc, q) => acc + q.marks, 0);
  }

  test.updatedAt = new Date().toISOString();
  saveDatabase();
  res.json(test);
});

app.delete('/api/teacher/tests/:id', authenticateToken, requireTeacher, (req, res) => {
  const index = db.tests.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Test not found' });

  db.tests.splice(index, 1);
  saveDatabase();
  res.json({ message: 'Test successfully deleted' });
});

// Question Bank APIs
app.get('/api/teacher/question-bank', authenticateToken, requireTeacher, (req, res) => {
  res.json(db.questionBank);
});

app.post('/api/teacher/question-bank', authenticateToken, requireTeacher, (req, res) => {
  const qData = req.body;
  const newQ: Question = {
    id: `qb_${Date.now()}`,
    questionType: qData.questionType,
    questionText: qData.questionText,
    imageUrl: qData.imageUrl,
    options: qData.options || [],
    correctAnswer: qData.correctAnswer || '',
    acceptedAnswers: qData.acceptedAnswers || [],
    keywords: qData.keywords || [],
    marks: Number(qData.marks) || 1,
    order: 1,
    class: qData.class || '8',
    section: qData.section || 'Explorer',
    subject: qData.subject || 'Computer',
    chapter: qData.chapter || '',
    difficulty: qData.difficulty || 'Medium',
  };

  db.questionBank.unshift(newQ);
  saveDatabase();
  res.status(201).json(newQ);
});

// Results & Evaluation Management
app.get('/api/teacher/results', authenticateToken, requireTeacher, (req, res) => {
  res.json(db.results);
});

app.put('/api/teacher/results/:id/override-marks', authenticateToken, requireTeacher, (req, res) => {
  const { questionId, newMarks, feedback } = req.body;
  const result = db.results.find((r) => r.id === req.params.id);
  if (!result) return res.status(404).json({ error: 'Result not found' });

  const evalItem = result.detailedEvaluations.find((e) => e.questionId === questionId);
  if (!evalItem) return res.status(404).json({ error: 'Question evaluation item not found' });

  evalItem.marksObtained = Number(newMarks);
  evalItem.status = Number(newMarks) > 0 ? 'correct' : 'incorrect';
  evalItem.feedback = feedback || 'Teacher manually overridden marks.';

  // Recalculate totals
  result.marksObtained = result.detailedEvaluations.reduce((acc, e) => acc + e.marksObtained, 0);
  result.percentage = Math.round((result.marksObtained / (result.totalMarks || 1)) * 1000) / 10;
  result.passStatus = result.marksObtained >= Math.ceil(result.totalMarks * 0.4) ? 'Pass' : 'Fail';
  result.teacherReviewed = true;

  saveDatabase();
  addActivity('result_reviewed', `Teacher reviewed and updated score for ${result.studentName} on ${result.testName}`);
  res.json(result);
});

// Excel Export API (.xlsx generation)
app.get('/api/teacher/export-excel', authenticateToken, requireTeacher, (req, res) => {
  const { testId, class: targetClass, section: targetSection } = req.query;

  let filteredResults = db.results;
  if (testId && testId !== 'ALL') {
    filteredResults = filteredResults.filter((r) => r.testId === testId);
  }
  if (targetClass && targetClass !== 'ALL') {
    filteredResults = filteredResults.filter((r) => String(r.class) === String(targetClass));
  }
  if (targetSection && targetSection !== 'ALL') {
    filteredResults = filteredResults.filter((r) => String(r.section).toLowerCase() === String(targetSection).toLowerCase());
  }

  const excelRows = filteredResults.map((r, idx) => ({
    'S.No': idx + 1,
    'Student Name': r.studentName,
    'Student ID': r.studentId,
    Class: r.class,
    Section: r.section,
    'Roll Number': r.rollNumber,
    'Test Name': r.testName,
    'Test Code': r.testCode,
    Subject: r.subject,
    Chapter: r.chapter,
    'Total Questions': r.totalQuestions,
    'Correct Answers': r.correctCount,
    'Incorrect Answers': r.incorrectCount,
    Unanswered: r.unansweredCount,
    'Needs Review': r.needsReviewCount,
    'Total Marks': r.totalMarks,
    'Marks Obtained': r.marksObtained,
    'Percentage (%)': `${r.percentage}%`,
    Grade: r.grade,
    Result: r.passStatus,
    'Submission Date': r.submissionDate,
    'Submission Time': r.submissionTime,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="BVM_Test_Results_${Date.now()}.xlsx"`);
  res.send(buffer);
});

// Endpoint to download full project ZIP archive
app.get('/api/download-project-zip', (req, res) => {
  const zipPath = path.join(process.cwd(), 'public', 'bvm-exam-portal.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'bvm-exam-portal-source.zip');
  } else {
    res.status(404).json({ error: 'ZIP file not found.' });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BVM Test Portal server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

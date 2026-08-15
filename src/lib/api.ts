import { User, Test, Question, TestAttemptProgress, TestResult, DashboardStats, RecentActivity } from '../types';

const TOKEN_KEY = 'bvm_auth_token';
const USER_KEY = 'bvm_user_info';

export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    return token;
  } catch (e) {
    return null;
  }
}

export function getStoredUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (!data || data === 'undefined' || data === 'null') {
      return null;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing stored user from localStorage:', e);
    try {
      localStorage.removeItem(USER_KEY);
    } catch (_) {}
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  try {
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      clearStoredAuth();
    }
  } catch (e) {
    console.error('Error setting stored auth:', e);
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Error clearing stored auth:', e);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  let data: any = {};

  if (responseText && responseText !== 'undefined' && responseText !== 'null') {
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // If server returned an HTML error page (like 403 Forbidden or 502)
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        if (response.status === 403 || response.status === 401) {
          data = { error: 'Your session has expired or authorization was lost. Please log in again.' };
        } else {
          data = { error: `Server error (${response.status}). Please try again.` };
        }
      } else {
        data = { message: responseText };
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearStoredAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('bvm:session-expired', {
            detail: { message: data?.error || 'Session expired. Please log in again.' },
          })
        );
      }
    }
    throw new Error(data?.error || data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (userId: string, password: string, role: 'student' | 'teacher') =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password, role }),
    }),

  resetPassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Student
  getStudentDashboard: () =>
    request<{
      student: User;
      availableTests: Array<{
        id: string;
        testCode: string;
        testName: string;
        subject: string;
        chapter: string;
        class: string;
        section: string;
        durationMinutes: number;
        totalMarks: number;
        questionsCount: number;
        startDate: string;
        endDate: string;
        status: string;
        studentStatus: string;
      }>;
      myResults: Array<{
        id: string;
        testName: string;
        subject: string;
        chapter: string;
        marksObtained: number;
        totalMarks: number;
        percentage: number;
        grade: string;
        passStatus: 'Pass' | 'Fail';
        submissionDate: string;
      }>;
    }>('/api/student/dashboard'),

  verifyStudentProfile: (profile: { studentName: string; studentClass: string; section: string; rollNumber: string } | any) =>
    request<{ success: boolean; message: string; student?: User }>('/api/student/verify-profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),

  startTest: (testId: string, testCode?: string) =>
    request<{
      attempt: TestAttemptProgress;
      test: Test;
      questions: Question[];
    }>('/api/student/start-test', {
      method: 'POST',
      body: JSON.stringify({ testId, testCode }),
    }),

  saveTestProgress: (attemptId: string, answers: Record<string, string>, markedForReview: string[], tabSwitchCount: number) =>
    request<{ success: boolean; savedAt: number }>('/api/student/save-progress', {
      method: 'POST',
      body: JSON.stringify({ attemptId, answers, markedForReview, tabSwitchCount }),
    }),

  submitTest: (attemptId: string, finalAnswers: Record<string, string>, markedForReview: string[]) =>
    request<{
      resultId: string;
      showResultImmediately: boolean;
      showCorrectAnswers: boolean;
      summary: any;
      result: TestResult | null;
    }>('/api/student/submit-test', {
      method: 'POST',
      body: JSON.stringify({ attemptId, finalAnswers, markedForReview }),
    }),

  getStudentResult: (resultId: string) =>
    request<{ result: TestResult; showCorrectAnswers: boolean }>(`/api/student/result/${resultId}`),

  // Teacher
  getTeacherDashboard: () =>
    request<{ stats: DashboardStats; activities: RecentActivity[] }>('/api/teacher/dashboard'),

  getStudents: () => request<User[]>('/api/teacher/students'),

  addStudent: (data: { studentId: string; name: string; password: string; class: string; section: string; rollNumber: string }) =>
    request<User>('/api/teacher/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudent: (id: string, data: Partial<User> & { newStudentId?: string; password?: string }) =>
    request<User>(`/api/teacher/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetStudentPassword: (id: string, newPassword?: string) =>
    request<{ message: string }>(`/api/teacher/students/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  updateTeacherCredentials: (data: { newUserId?: string; newName?: string; currentPassword?: string; newPassword?: string }) =>
    request<{ message: string; token: string; user: User }>('/api/teacher/update-credentials', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string) =>
    request<{ message: string }>(`/api/teacher/students/${id}`, {
      method: 'DELETE',
    }),

  bulkImportStudents: (studentsList: any[]) =>
    request<{ message: string; addedCount: number; skippedCount: number }>('/api/teacher/students/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ studentsList }),
    }),

  generate45Students: (targetClass: string, targetSection: string) =>
    request<{ message: string }>('/api/teacher/students/generate-45-students', {
      method: 'POST',
      body: JSON.stringify({ targetClass, targetSection }),
    }),

  getTests: () => request<Test[]>('/api/teacher/tests'),

  createTest: (testData: Partial<Test>) =>
    request<Test>('/api/teacher/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    }),

  updateTest: (id: string, testData: Partial<Test>) =>
    request<Test>(`/api/teacher/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
    }),

  deleteTest: (id: string) =>
    request<{ message: string }>(`/api/teacher/tests/${id}`, {
      method: 'DELETE',
    }),

  getQuestionBank: () => request<Question[]>('/api/teacher/question-bank'),

  addQuestionToBank: (q: Partial<Question>) =>
    request<Question>('/api/teacher/question-bank', {
      method: 'POST',
      body: JSON.stringify(q),
    }),

  getResults: () => request<TestResult[]>('/api/teacher/results'),

  overrideMarks: (resultId: string, questionId: string, newMarks: number, feedback?: string) =>
    request<TestResult>(`/api/teacher/results/${resultId}/override-marks`, {
      method: 'PUT',
      body: JSON.stringify({ questionId, newMarks, feedback }),
    }),
};

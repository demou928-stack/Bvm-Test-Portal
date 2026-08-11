import * as XLSX from 'xlsx';
import { TestResult } from '../types';

export function exportResultsToExcel(results: TestResult[], filenamePrefix: string = 'BVM_Test_Results') {
  if (!results || results.length === 0) {
    alert('No results available to export.');
    return;
  }

  const exportData = results.map((r, index) => ({
    'S.No': index + 1,
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

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Name
    { wch: 14 }, // ID
    { wch: 8 },  // Class
    { wch: 12 }, // Section
    { wch: 10 }, // Roll No
    { wch: 28 }, // Test Name
    { wch: 18 }, // Test Code
    { wch: 18 }, // Subject
    { wch: 20 }, // Chapter
    { wch: 14 }, // Questions
    { wch: 14 }, // Correct
    { wch: 14 }, // Incorrect
    { wch: 12 }, // Unanswered
    { wch: 14 }, // Needs Review
    { wch: 12 }, // Total Marks
    { wch: 14 }, // Marks Obtained
    { wch: 14 }, // Percentage
    { wch: 8 },  // Grade
    { wch: 10 }, // Result
    { wch: 14 }, // Date
    { wch: 12 }, // Time
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results');

  const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  XLSX.writeFile(workbook, `${filenamePrefix}_${nowStr}.xlsx`);
}

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, Section } from '../../types';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { Search, Plus, Upload, Users, Key, Trash2, Edit3, ShieldAlert, Sparkles, UserX, UserCheck, RefreshCw } from 'lucide-react';

const SECTIONS: Section[] = ['Creator', 'Innovator', 'Pathfinder', 'Originator', 'Developer', 'Explorer'];

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    password: 'Bvm',
    class: '8',
    section: 'Explorer' as Section,
    rollNumber: '1',
  });

  // Bulk CSV Text state
  const [bulkCsvText, setBulkCsvText] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.addStudent(formData);
      setShowAddModal(false);
      setFormData({ studentId: '', name: '', password: 'Bvm', class: '8', section: 'Explorer', rollNumber: '1' });
      fetchStudents();
    } catch (err: any) {
      setError(err.message || 'Failed to create student account');
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setError(null);
    try {
      await api.updateStudent(editingStudent.id, {
        newStudentId: formData.studentId,
        name: formData.name,
        class: formData.class,
        section: formData.section,
        rollNumber: formData.rollNumber,
        password: formData.password ? formData.password : undefined,
      });
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      setError(err.message || 'Failed to update student');
    }
  };

  const handleResetPassword = async (student: User) => {
    const sId = student.studentId || student.id;
    const newPass = prompt(`Enter new password for student "${student.name}" (ID: ${sId}):`, 'Bvm');
    if (newPass === null) return;
    try {
      const res = await api.resetStudentPassword(student.id, newPass.trim() || 'Bvm');
      alert(res.message);
      fetchStudents();
    } catch (err: any) {
      alert('Failed to reset password: ' + err.message);
    }
  };

  const handleToggleStatus = async (student: User) => {
    const nextStatus = student.status === 'active' ? 'disabled' : 'active';
    try {
      await api.updateStudent(student.id, { status: nextStatus });
      fetchStudents();
    } catch (err: any) {
      alert('Failed to update student status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    try {
      await api.deleteStudent(id);
      fetchStudents();
    } catch (err: any) {
      alert('Failed to delete student account');
    }
  };

  const handleGenerate45 = async () => {
    if (!confirm('Generate 45 test student accounts for Class 8 Explorer?')) return;
    try {
      const res = await api.generate45Students('8', 'Explorer');
      alert(res.message);
      fetchStudents();
    } catch (err: any) {
      alert('Failed to generate accounts: ' + err.message);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkCsvText.trim()) return;
    try {
      const lines = bulkCsvText.trim().split('\n');
      const parsed: any[] = [];
      lines.forEach((line) => {
        const cols = line.split(',').map((c) => c.trim());
        if (cols.length >= 4) {
          parsed.push({
            studentId: cols[0],
            name: cols[1],
            password: cols[2] || 'Bvm',
            class: cols[3],
            section: cols[4] || 'Explorer',
            rollNumber: cols[5] || '1',
          });
        }
      });

      const res = await api.bulkImportStudents(parsed);
      alert(res.message);
      setShowBulkModal(false);
      setBulkCsvText('');
      fetchStudents();
    } catch (err: any) {
      alert('Bulk import failed: ' + err.message);
    }
  };

  // Filter students
  const filteredStudents = students.filter((st) => {
    const matchSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.rollNumber || '').includes(searchQuery);

    const matchClass = filterClass === 'ALL' || String(st.class) === String(filterClass);
    const matchSection = filterSection === 'ALL' || String(st.section).toLowerCase() === filterSection.toLowerCase();

    return matchSearch && matchClass && matchSection;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Student Account Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, edit, reset passwords, or bulk import student accounts across Class 1 to 12
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerate45}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Pre-Generate 45 Class 8 Explorer Students
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Bulk Import CSV
          </button>

          <button
            onClick={() => {
              setFormData({ studentId: '', name: '', password: 'Bvm', class: '8', section: 'Explorer', rollNumber: '1' });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, ID, or roll number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
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
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
          >
            <option value="ALL">All Sections</option>
            {SECTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          <button
            onClick={fetchStudents}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading student accounts...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No student accounts found matching selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student ID</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Section</th>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900 dark:text-white">{st.studentId || st.id}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-200">{st.name}</td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">Class {st.class}</td>
                    <td className="px-6 py-3.5 text-indigo-600 dark:text-indigo-400 font-semibold">{st.section}</td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">#{st.rollNumber}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={st.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {st.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleResetPassword(st)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Reset Student Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingStudent(st);
                          setFormData({
                            studentId: st.studentId || st.id,
                            name: st.name,
                            password: '',
                            class: st.class || '8',
                            section: st.section || 'Explorer',
                            rollNumber: st.rollNumber || '1',
                          });
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Student Account"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(st)}
                        className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          st.status === 'active' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                        title={st.status === 'active' ? 'Disable Account' : 'Enable Account'}
                      >
                        {st.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(st.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {(showAddModal || editingStudent) && (
        <Modal
          isOpen={showAddModal || !!editingStudent}
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
          }}
          title={editingStudent ? 'Edit Student Account' : 'Create New Student Account'}
        >
          <form onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student ID / Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. STU801 or Bvm"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Student Name"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class</label>
                <select
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value as Section })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password {editingStudent ? '(Leave blank to keep unchanged)' : '*'}
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Default e.g. Bvm"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                {editingStudent ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkModal && (
        <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Import Students via CSV">
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              Paste CSV rows using format: <span className="font-mono text-indigo-600 font-bold">StudentID, StudentName, Password, Class, Section, RollNumber</span>
            </p>

            <textarea
              rows={6}
              value={bulkCsvText}
              onChange={(e) => setBulkCsvText(e.target.value)}
              placeholder={`STU101, Aarav Kumar, Bvm, 8, Explorer, 1\nSTU102, Ananya Sharma, Bvm, 8, Explorer, 2`}
              className="w-full p-3 font-mono text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            ></textarea>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
              >
                Import Students
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

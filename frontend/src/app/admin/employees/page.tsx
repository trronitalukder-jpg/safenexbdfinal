'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import {
  getAssignablePermissions,
  AdminMenuItem,
  EMPLOYEE_ROLE_PRESETS,
  RolePreset,
} from '@/config/adminMenuRegistry';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Mail,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  X,
  Save,
  Check,
} from 'lucide-react';

interface EmployeeItem {
  id: string;
  uniqueUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  isActive: boolean;
  isEmployee: boolean;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminEmployeesPage() {
  const { isSuperAdmin } = useAuthStore();
  const { lang } = useLanguage();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Registration Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [allPermissionsChecked, setAllPermissionsChecked] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit Employee Modal state
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAllPermissions, setEditAllPermissions] = useState(false);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editActive, setEditActive] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Actions loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const assignableModules = getAssignablePermissions();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/employees');
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setEmployees(data);
    } catch (err: any) {
      console.warn('Failed to load employees:', err?.message || err);
      setFeedback({ type: 'error', message: 'Failed to load employee list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Generate a random secure password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowPassword(true);
  };

  // Toggle master "Everything" permission in create form
  const handleToggleAllPermissions = () => {
    if (!allPermissionsChecked) {
      setAllPermissionsChecked(true);
      setSelectedPermissions(assignableModules.map((m) => m.key));
    } else {
      setAllPermissionsChecked(false);
      setSelectedPermissions([]);
    }
  };

  // Toggle single permission in create form
  const handleToggleSinglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      const next = selectedPermissions.filter((k) => k !== key);
      setSelectedPermissions(next);
      setAllPermissionsChecked(false);
    } else {
      const next = [...selectedPermissions, key];
      setSelectedPermissions(next);
      if (next.length === assignableModules.length) {
        setAllPermissionsChecked(true);
      }
    }
  };

  // Apply preset to create form
  const applyRolePreset = (preset: RolePreset) => {
    if (preset.permissions.includes('*')) {
      setAllPermissionsChecked(true);
      setSelectedPermissions(assignableModules.map((m) => m.key));
    } else {
      setAllPermissionsChecked(false);
      setSelectedPermissions(preset.permissions);
    }
  };

  // Apply preset to edit modal
  const applyEditRolePreset = (preset: RolePreset) => {
    if (preset.permissions.includes('*')) {
      setEditAllPermissions(true);
      setEditPermissions(assignableModules.map((m) => m.key));
    } else {
      setEditAllPermissions(false);
      setEditPermissions(preset.permissions);
    }
  };

  // Submit Create Employee Form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter employee full name.' });
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setFeedback({ type: 'error', message: 'Please provide either Gmail/Email or Phone number.' });
      return;
    }
    if (!password || password.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const permissionsPayload = allPermissionsChecked ? ['*'] : selectedPermissions;

    try {
      const res: any = await api.post('/admin/employees', {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        permissions: permissionsPayload,
        isActive: formActive,
      });

      const successMsg = res?.data?.message || res?.message || 'New employee registered successfully!';
      setFeedback({ type: 'success', message: successMsg });
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setSelectedPermissions([]);
      setAllPermissionsChecked(false);
      setFormActive(true);

      await fetchEmployees();
    } catch (err: any) {
      console.warn('Create employee error:', err?.message || err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to create employee.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const startEdit = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setEditFullName(`${emp.firstName || ''} ${emp.lastName || ''}`.trim());
    setEditEmail(emp.email || '');
    setEditPhone(emp.phone || '');
    setEditPassword('');
    setEditActive(emp.isActive);

    const isFull = emp.permissions?.includes('*') || emp.permissions?.length === assignableModules.length;
    setEditAllPermissions(isFull);
    if (isFull) {
      setEditPermissions(assignableModules.map((m) => m.key));
    } else {
      setEditPermissions(emp.permissions || []);
    }
  };

  // Toggle all permissions in edit modal
  const handleToggleEditAll = () => {
    if (!editAllPermissions) {
      setEditAllPermissions(true);
      setEditPermissions(assignableModules.map((m) => m.key));
    } else {
      setEditAllPermissions(false);
      setEditPermissions([]);
    }
  };

  // Toggle single permission in edit modal
  const handleToggleEditSingle = (key: string) => {
    if (editPermissions.includes(key)) {
      const next = editPermissions.filter((k) => k !== key);
      setEditPermissions(next);
      setEditAllPermissions(false);
    } else {
      const next = [...editPermissions, key];
      setEditPermissions(next);
      if (next.length === assignableModules.length) {
        setEditAllPermissions(true);
      }
    }
  };

  // Save Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setEditSubmitting(true);
    const permissionsPayload = editAllPermissions ? ['*'] : editPermissions;

    try {
      const res: any = await api.patch(`/admin/employees/${editingEmployee.id}`, {
        fullName: editFullName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        password: editPassword.trim() || undefined,
        permissions: permissionsPayload,
        isActive: editActive,
      });

      const successMsg = res?.data?.message || res?.message || 'Employee updated successfully!';
      setFeedback({ type: 'success', message: successMsg });
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      console.warn('Update error:', err?.message || err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update employee.',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Toggle Active / Inactive
  const handleToggleActive = async (emp: EmployeeItem) => {
    if (emp.isSuperAdmin) {
      alert('Super Admin accounts cannot be deactivated.');
      return;
    }

    setActionLoadingId(emp.id);
    try {
      await api.patch(`/admin/employees/${emp.id}/toggle`);
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, isActive: !e.isActive } : e))
      );
      setFeedback({ type: 'success', message: 'Status updated.' });
    } catch (err: any) {
      console.warn('Toggle error:', err?.message || err);
      setFeedback({ type: 'error', message: 'Failed to toggle status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Employee
  const handleDelete = async (emp: EmployeeItem) => {
    if (emp.isSuperAdmin) {
      alert('CRITICAL: Super Admin accounts cannot be deleted!');
      return;
    }

    setActionLoadingId(emp.id);
    try {
      await api.delete(`/admin/employees/${emp.id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      setFeedback({ type: 'success', message: 'Employee deleted successfully.' });
    } catch (err: any) {
      console.warn('Delete error:', err?.message || err);
      setFeedback({ type: 'error', message: 'Failed to delete employee.' });
    } finally {
      setActionLoadingId(null);
      setDeleteConfirmId(null);
    }
  };

  // Security check: If not super admin, block access
  if (!isSuperAdmin()) {
    return (
      <div className="p-8 max-w-lg mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-lg space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'শুধুমাত্র সুপার অ্যাডমিনের জন্য সংরক্ষিত' : 'Super Admin Access Required'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'কর্মচারী বা স্টাফ যোগ ও ম্যানেজ করার ক্ষমতা শুধুমাত্র সুপার অ্যাডমিন অ্যাকাউন্টের রয়েছে।'
              : 'Managing employee permissions and staff credentials is restricted exclusively to Super Administrators.'}
          </p>
        </div>
      </div>
    );
  }

  const staffCount = employees.filter((e) => !e.isSuperAdmin).length;
  const activeStaffCount = employees.filter((e) => !e.isSuperAdmin && e.isActive).length;
  const fullAccessStaffCount = employees.filter(
    (e) => !e.isSuperAdmin && (e.permissions?.includes('*') || e.permissions?.length === assignableModules.length)
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'bn' ? 'কর্মচারী ও স্টাফ ম্যানেজমেন্ট' : 'Employee & Sub-Admin Management'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'কর্মচারীদের অ্যাকাউন্ট তৈরি করুন, নির্দিষ্ট মেনু পারমিশন প্রদান করুন এবং নিরাপদে পরিচালনা করুন।'
                : 'Create employee accounts, assign specific module permissions, and manage staff credentials.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchEmployees}
          disabled={loading}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700 self-start md:self-auto"
          title="Refresh Staff Directory"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Analytics Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Staff Accounts</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{staffCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active Staff</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{activeStaffCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">Full Access Staff</p>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{fullAccessStaffCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">Assignable Modules</p>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{assignableModules.length}</p>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 border text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Employee Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'নতুন কর্মচারী / স্টাফ রেজিস্ট্রেশন' : 'Register New Employee / Staff'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'কর্মচারীর নাম, লগইন ফোন বা জিমেইল এবং পাসওয়ার্ড সেট করে পারমিশন নির্ধারণ করুন।'
                : 'Set credentials and select permissions for this staff member.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateSubmit} className="mt-6 space-y-6">
          {/* Row 1: Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Employee Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Email (Gmail) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Gmail / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01700000000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate</span>
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Dynamic Permissions Checkbox Matrix */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'মডিউল পারমিশন কন্ট্রোল' : 'Module Permission Control'}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'কর্মচারী যে যে সেকশন পরিচালনা করতে পারবে তা টিক দিন, অথবা সব পারমিশন সিলেক্ট করুন।'
                      : 'Check the specific admin sections this employee is authorized to view and manage.'}
                  </p>
                </div>
              </div>

              {/* Master Everything Checkbox */}
              <button
                type="button"
                onClick={handleToggleAllPermissions}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs ${
                  allPermissionsChecked
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {allPermissionsChecked ? (
                  <CheckSquare className="w-4 h-4 text-slate-950" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {lang === 'bn'
                    ? 'সব পারমিশন (Everything / Full Access)'
                    : 'Everything (Full Admin Access)'}
                </span>
              </button>
            </div>

            {/* Quick Role Presets */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'bn' ? 'কুইক রোল প্রিসেট (১-ক্লিকে পারমিশন নির্ধারণ করুন)' : 'Quick Role Presets (Click to apply role matrix)'}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {lang === 'bn' ? 'প্রিসেট সিলেক্ট করার পর নিচে টিক দিয়ে কাস্টমাইজ করতে পারবেন' : 'You can further customize below'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {EMPLOYEE_ROLE_PRESETS.map((preset) => {
                  const isPresetActive = preset.permissions.includes('*')
                    ? allPermissionsChecked
                    : !allPermissionsChecked &&
                      preset.permissions.every((p) => selectedPermissions.includes(p)) &&
                      selectedPermissions.length === preset.permissions.length;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyRolePreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isPresetActive
                          ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {lang === 'bn' ? preset.nameBn : preset.nameEn}
                        </span>
                        {isPresetActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                        {lang === 'bn' ? preset.descriptionBn : preset.descriptionEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkbox Grid (Dynamically rendered from adminMenuRegistry) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {assignableModules.map((module) => {
                const Icon = module.icon;
                const isChecked = allPermissionsChecked || selectedPermissions.includes(module.key);

                return (
                  <label
                    key={module.key}
                    onClick={() => handleToggleSinglePermission(module.key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition select-none flex items-start gap-3 ${
                      isChecked
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <div className="w-4 h-4 rounded bg-amber-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-400 dark:border-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {lang === 'bn' ? module.labelBn : module.labelEn}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {lang === 'bn' ? module.descriptionBn : module.descriptionEn}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Row 3: Status Toggle & Submit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {formActive ? 'Active (লগইন সক্রিয়)' : 'Inactive (লগইন বন্ধ)'}
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !fullName.trim()}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Employee...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'কর্মচারী রেজিস্ট্রেশন সম্পন্ন করুন' : 'Create Employee Account'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Employees Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সকল অ্যাডমিন ও কর্মচারী তালিকা' : 'Administrative Staff Directory'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'সকল কর্মচারী এবং তাদের কার্যকর পারমিশন দেখুন, পরিবর্তন করুন অথবা ডিলিট করুন।'
                : 'Manage existing staff roles, change module access or revoke credentials.'}
            </p>
          </div>

          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            {employees.length} Accounts
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-medium">Loading staff directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Staff Member</th>
                  <th className="py-3.5 px-6">Login Identifier</th>
                  <th className="py-3.5 px-6">Role & Status</th>
                  <th className="py-3.5 px-6">Module Permissions</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {employees.map((emp) => {
                  const isFull = emp.isSuperAdmin || emp.permissions?.includes('*') || emp.permissions?.length === assignableModules.length;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Name & ID */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs ${
                            emp.isSuperAdmin
                              ? 'bg-amber-600'
                              : 'bg-sky-600'
                          }`}>
                            {emp.firstName?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                              <span>{emp.firstName} {emp.lastName}</span>
                              {emp.isSuperAdmin && (
                                <span title="Super Administrator">
                                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {emp.uniqueUserId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{emp.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{emp.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Active Status */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          {emp.isSuperAdmin ? (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              SUPER ADMIN
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              EMPLOYEE
                            </span>
                          )}

                          <div>
                            <button
                              type="button"
                              disabled={emp.isSuperAdmin || actionLoadingId === emp.id}
                              onClick={() => handleToggleActive(emp)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                                emp.isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              } ${emp.isSuperAdmin ? 'opacity-80 cursor-not-allowed' : ''}`}
                              title={emp.isSuperAdmin ? 'Super Admin cannot be deactivated' : 'Click to toggle'}
                            >
                              {emp.isActive ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  <span>Inactive</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Permissions Chips */}
                      <td className="py-4 px-6 max-w-xs">
                        {emp.isSuperAdmin || isFull ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-200 dark:border-purple-800 shadow-xs">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span>Full Admin Access (Everything)</span>
                          </span>
                        ) : emp.permissions?.length === 0 ? (
                          <span className="text-slate-400 text-[11px] italic">No permissions assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {emp.permissions.slice(0, 4).map((p) => {
                              const mod = assignableModules.find((m) => m.key === p);
                              return (
                                <span
                                  key={p}
                                  className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                                >
                                  {mod?.labelEn || p}
                                </span>
                              );
                            })}
                            {emp.permissions.length > 4 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                +{emp.permissions.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {emp.isSuperAdmin ? (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center justify-end gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Protected Super Admin</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(emp)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                              title="Edit Employee / Permissions"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {deleteConfirmId === emp.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={actionLoadingId === emp.id}
                                  onClick={() => handleDelete(emp)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(emp.id)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition"
                                title="Delete Employee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Employee & Permissions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update profile, change login credentials or assign module permissions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              {/* Name, Email, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gmail / Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Password change (optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reset Password <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              {/* Edit Permissions Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Assigned Permissions
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleEditAll}
                    className="text-[11px] font-black text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    {editAllPermissions ? 'Deselect All' : 'Select Everything (Full Access)'}
                  </button>
                </div>

                {/* Edit Modal Role Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  {EMPLOYEE_ROLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyEditRolePreset(preset)}
                      className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-left text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate transition"
                      title={lang === 'bn' ? preset.descriptionBn : preset.descriptionEn}
                    >
                      ⚡ {lang === 'bn' ? preset.nameBn : preset.nameEn}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {assignableModules.map((module) => {
                    const Icon = module.icon;
                    const isChecked = editAllPermissions || editPermissions.includes(module.key);

                    return (
                      <label
                        key={module.key}
                        onClick={() => handleToggleEditSingle(module.key)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition select-none flex items-center gap-2 ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-500/50'
                            : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <div className="shrink-0">
                          {isChecked ? (
                            <div className="w-3.5 h-3.5 rounded bg-amber-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded border border-slate-400 dark:border-slate-600" />
                          )}
                        </div>
                        <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {lang === 'bn' ? module.labelBn : module.labelEn}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Active Account (Login permitted)
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

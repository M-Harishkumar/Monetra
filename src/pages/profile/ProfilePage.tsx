import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { User, Customer } from '../../types.ts';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  MapPin,
  ShieldCheck,
  Briefcase,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user: currentUser, role, refreshProfile } = useAuth();

  // Selected user for editing (for Admin, can be any user; for Customer/Staff, strictly current user)
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);

  // Profile Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CUSTOMER',
    phone: '',
    title: '',
    department: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    postalCode: '',
    bio: '',
    status: 'ACTIVE',
  });

  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = role === 'ADMIN';
  const isEditingSelf = selectedUserId === currentUser?.id;

  // 1. If Admin, load directory of all users
  useEffect(() => {
    if (isAdmin) {
      loadDirectory();
    }
  }, [isAdmin]);

  const loadDirectory = async () => {
    try {
      setIsLoadingDirectory(true);
      const users = await api.getAllUsers();
      setAllUsers(users);
    } catch (err: any) {
      console.error('Failed to load user directory:', err);
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  // 2. Load profile of the selected user
  useEffect(() => {
    const targetId = isAdmin && selectedUserId ? selectedUserId : currentUser?.id;
    if (targetId) {
      loadUserProfile(targetId);
    }
  }, [selectedUserId, currentUser?.id, isAdmin]);

  const loadUserProfile = async (userId: string) => {
    try {
      setIsLoadingProfile(true);
      setErrorMessage(null);
      let userData: any;

      if (userId === currentUser?.id) {
        userData = await api.getProfile();
      } else if (isAdmin) {
        userData = await api.getUserProfile(userId);
      } else {
        // Enforce frontend boundary: non-admins can only view themselves
        userData = await api.getProfile();
      }

      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'CUSTOMER',
        phone: userData.phone || '',
        title: userData.title || '',
        department: userData.department || '',
        address: userData.address || userData.customer?.billingAddress || '',
        city: userData.city || userData.customer?.city || '',
        state: userData.state || userData.customer?.state || '',
        country: userData.country || userData.customer?.country || 'United States',
        postalCode: userData.postalCode || userData.customer?.postalCode || '',
        bio: userData.bio || '',
        status: userData.status || 'ACTIVE',
      });

      setActiveCustomer(userData.customer || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load user profile.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        title: formData.title,
        department: formData.department,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        bio: formData.bio,
        ...(isAdmin ? { status: formData.status } : {}),
      };

      if (isAdmin && selectedUserId && selectedUserId !== currentUser?.id) {
        // Admin updating another user
        await api.updateUserProfile(selectedUserId, payload);
        setSuccessMessage(`Contact information for ${formData.name} updated successfully.`);
        // Reload directory to keep list in sync
        loadDirectory();
      } else {
        // User updating self
        await api.updateProfile(payload);
        setSuccessMessage('Your profile and contact information have been updated.');
        await refreshProfile();
      }

      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'CUSTOMER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B2938] dark:text-white font-heading">
            {isAdmin ? 'User Profile & Directory Management' : 'My Contact Profile'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#718096] dark:text-slate-400">
            {isAdmin
              ? 'Role-gated administrator control: view and manage contact information across staff, customers, and administrative personnel.'
              : 'View and update your personal contact information, billing address, and organization details.'}
          </p>
        </div>

        {/* Current Role Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#718096] dark:text-slate-400">Authenticated Role:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRoleBadge(
              role
            )}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {role}
          </span>
        </div>
      </div>

      {/* Admin User Selector (Strictly Gated to ADMIN) */}
      {isAdmin && (
        <div className="rounded-2xl border border-[#E1E7EE] bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#14243A]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#E1E7EE] dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-[#16A6A1] dark:bg-teal-500/20">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1B2938] dark:text-white">
                  Administrator User Directory Selector
                </h3>
                <p className="text-xs text-[#718096] dark:text-slate-400">
                  Select any user account to view or update their basic contact information.
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#E1E7EE] bg-[#F4F7FA] py-1.5 pl-9 pr-3 text-xs text-[#1B2938] placeholder-slate-400 focus:border-[#16A6A1] focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quick User Selection Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedUserId(currentUser?.id || '')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer border ${
                selectedUserId === currentUser?.id
                  ? 'bg-[#14243A] text-white border-[#14243A] dark:bg-[#16A6A1] dark:border-[#16A6A1]'
                  : 'bg-[#F4F7FA] text-[#1B2938] border-[#E1E7EE] hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span>My Profile ({currentUser?.name})</span>
              <span className="text-[10px] opacity-75">(Self)</span>
            </button>

            {filteredUsers
              .filter((u) => u.id !== currentUser?.id)
              .map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                    selectedUserId === u.id
                      ? 'bg-[#14243A] text-white border-[#14243A] dark:bg-[#16A6A1] dark:border-[#16A6A1]'
                      : 'bg-[#F4F7FA] text-[#1B2938] border-[#E1E7EE] hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-700 text-[10px] font-bold">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <span>{u.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200'
                        : u.role === 'STAFF'
                        ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {u.role}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Role-Gated Notice */}
      {!isAdmin && (
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-200">
          <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            You are logged in as a <strong>{role}</strong>. You have permission to view and modify your own contact details. Administrative user records and company-wide profiles are restricted.
          </span>
        </div>
      )}

      {/* Success & Error Feedback */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form & Profile Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Summary Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E1E7EE] bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#14243A]">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/15 text-2xl font-bold text-[#16A6A1] border-2 border-teal-500/30 shadow-md">
                {formData.name?.charAt(0) || 'U'}
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#1B2938] dark:text-white font-heading">
                {formData.name || 'User Profile'}
              </h3>
              <p className="text-xs text-[#718096] dark:text-slate-400">{formData.email}</p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase border ${getRoleBadge(
                    formData.role
                  )}`}
                >
                  {formData.role}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {formData.status}
                </span>
              </div>

              {formData.title && (
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#1B2938] dark:text-slate-300">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formData.title}</span>
                </div>
              )}

              {formData.department && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#718096] dark:text-slate-400">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formData.department}</span>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-[#E1E7EE] dark:border-slate-800 pt-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#718096] dark:text-slate-400">Direct Phone:</span>
                <span className="font-medium text-[#1B2938] dark:text-white">
                  {formData.phone || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#718096] dark:text-slate-400">Location:</span>
                <span className="font-medium text-[#1B2938] dark:text-white">
                  {formData.city && formData.state
                    ? `${formData.city}, ${formData.state}`
                    : formData.country || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#718096] dark:text-slate-400">Profile Context:</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {isEditingSelf ? 'Personal Account' : 'Managed Account'}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Customer Details Card (If user has customer association) */}
          {activeCustomer && (
            <div className="rounded-2xl border border-[#E1E7EE] bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#14243A]">
              <div className="flex items-center justify-between border-b border-[#E1E7EE] pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-[#16A6A1]" />
                  <h4 className="text-xs font-bold text-[#1B2938] dark:text-white uppercase tracking-wider">
                    Linked Organization
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {activeCustomer.customerNumber}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div>
                  <span className="text-[#718096] dark:text-slate-400 block text-[11px]">
                    Company Name
                  </span>
                  <span className="font-bold text-[#1B2938] dark:text-white">
                    {activeCustomer.companyName || activeCustomer.name}
                  </span>
                </div>
                {activeCustomer.taxId && (
                  <div>
                    <span className="text-[#718096] dark:text-slate-400 block text-[11px]">
                      Tax Registration / EIN
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {activeCustomer.taxId}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#718096] dark:text-slate-400 block text-[11px]">
                    Primary Billing Address
                  </span>
                  <span className="text-[#1B2938] dark:text-slate-300">
                    {activeCustomer.billingAddress || 'No billing address on file'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Editable Profile & Contact Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#E1E7EE] bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#14243A] space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#E1E7EE] pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-[#1B2938] dark:text-white font-heading">
                  Contact Information & Details
                </h3>
                <p className="text-xs text-[#718096] dark:text-slate-400">
                  {isAdmin && !isEditingSelf
                    ? `Editing contact profile for ${formData.name}.`
                    : 'Manage your direct telephone, mailing address, and profile biography.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadUserProfile(selectedUserId)}
                className="flex items-center gap-1.5 rounded-lg border border-[#E1E7EE] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Section 1: Basic Identity (Role-gated security) */}
            <div>
              <h4 className="text-xs font-bold text-[#718096] dark:text-slate-400 uppercase tracking-wider mb-3">
                1. Basic Identity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 pl-9 pr-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    Email Address <span className="text-slate-400 text-[10px]">(Verified)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full rounded-xl border border-[#E1E7EE] bg-slate-100 py-2 pl-9 pr-9 text-xs text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                    />
                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    Job Title / Role Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Chief Financial Officer"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 pl-9 pr-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    Department / Unit
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Finance & Accounting"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 pl-9 pr-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Contact Numbers & Address */}
            <div className="pt-2 border-t border-[#E1E7EE] dark:border-slate-800">
              <h4 className="text-xs font-bold text-[#718096] dark:text-slate-400 uppercase tracking-wider mb-3">
                2. Contact Information & Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    Telephone / Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 pl-9 pr-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    Street Address / HQ Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 100 Financial Way, Suite 500"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 pl-9 pr-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 px-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    State / Province / Region
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. California"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 px-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    Postal / ZIP Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 94105"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 px-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United States"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 px-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Biography & Operational Notes */}
            <div className="pt-2 border-t border-[#E1E7EE] dark:border-slate-800">
              <h4 className="text-xs font-bold text-[#718096] dark:text-slate-400 uppercase tracking-wider mb-3">
                3. Professional Notes & Bio
              </h4>
              <div>
                <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                  Biography / Billing Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any relevant organizational details, billing preferences, or background notes..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full rounded-xl border border-[#E1E7EE] bg-white p-3 text-xs text-[#1B2938] focus:border-[#16A6A1] focus:ring-1 focus:ring-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Admin status selector if Admin is editing */}
            {isAdmin && (
              <div className="pt-2 border-t border-[#E1E7EE] dark:border-slate-800">
                <h4 className="text-xs font-bold text-[#718096] dark:text-slate-400 uppercase tracking-wider mb-3">
                  4. Administrator Account Controls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full rounded-xl border border-[#E1E7EE] bg-white py-2 px-3 text-xs text-[#1B2938] focus:border-[#16A6A1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1B2938] dark:text-slate-300 mb-1">
                      Account Role (Assigned via Backend)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.role}
                      className="w-full rounded-xl border border-[#E1E7EE] bg-slate-100 py-2 px-3 text-xs text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E1E7EE] dark:border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[#14243A] py-2.5 px-6 text-xs font-bold text-white shadow-md hover:bg-[#203A56] dark:bg-[#16A6A1] dark:hover:bg-[#149692] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Contact Details'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

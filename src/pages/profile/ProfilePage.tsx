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
  KeyRound,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { PasswordStrengthMeter } from '../../components/common/PasswordStrengthMeter.tsx';
import { evaluatePasswordStrength } from '../../utils/password-strength.ts';

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

  // Password & Security Credentials State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    const strength = evaluatePasswordStrength(newPassword);
    if (!strength.isCompliant) {
      setPasswordErrorMsg(
        `Password requirement: ${strength.feedback[0] || 'Please create a stronger password meeting all security requirements.'}`
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }

    const requiresOldPassword = !isAdmin || isEditingSelf;
    if (requiresOldPassword && !currentPassword) {
      setPasswordErrorMsg('Please provide your current password to authorize this credential change.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      if (isAdmin && !isEditingSelf) {
        // Admin resetting a target user's password
        await api.updateUserPassword(selectedUserId, {
          newPassword,
          confirmPassword: confirmNewPassword,
        });
        setPasswordSuccessMsg(`Security credentials updated successfully for ${formData.name}.`);
      } else {
        // User changing own password
        await api.changePassword({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        });
        setPasswordSuccessMsg('Your account password has been updated successfully. Use your new password on subsequent logins.');
      }

      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccessMsg(null), 6000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setIsUpdatingPassword(false);
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
        return 'bg-[#EAF4FF] text-[#368CE7] border-[#D9E8F5]';
      case 'STAFF':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CUSTOMER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const newPasswordStrength = evaluatePasswordStrength(newPassword);
  const isPasswordFormValid =
    newPasswordStrength.isCompliant &&
    newPassword === confirmNewPassword &&
    ((!isAdmin || isEditingSelf) ? currentPassword.length > 0 : true);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#243B53] font-heading">
            {isAdmin ? 'User Profile & Directory Management' : 'My Contact & Security Profile'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#647A91]">
            {isAdmin
              ? 'Role-gated administrator control: view and manage contact information and credentials across staff, customers, and administrative personnel.'
              : 'View and update your personal contact information, billing address, and enterprise security credentials.'}
          </p>
        </div>

        {/* Current Role Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#647A91]">Authenticated Role:</span>
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
        <div className="rounded-2xl border border-[#D9E8F5] bg-white p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#D9E8F5]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#368CE7]">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#243B53]">
                  Administrator User Directory Selector
                </h3>
                <p className="text-xs text-[#647A91]">
                  Select any user account to view or update their basic contact information and credentials.
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
                className="w-full rounded-lg border border-[#D9E8F5] bg-[#F4F9FF] py-1.5 pl-9 pr-3 text-xs text-[#243B53] placeholder-slate-400 focus:border-[#368CE7] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick User Selection Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedUserId(currentUser?.id || '')}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer border ${
                selectedUserId === currentUser?.id
                  ? 'bg-[#368CE7] text-white border-[#368CE7]'
                  : 'bg-[#F4F9FF] text-[#243B53] border-[#D9E8F5] hover:bg-[#EAF4FF]'
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
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                    selectedUserId === u.id
                      ? 'bg-[#368CE7] text-white border-[#368CE7]'
                      : 'bg-[#F4F9FF] text-[#243B53] border-[#D9E8F5] hover:bg-[#EAF4FF]'
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <span>{u.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                      u.role === 'ADMIN'
                        ? 'bg-[#EAF4FF] text-[#368CE7]'
                        : u.role === 'STAFF'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
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
        <div className="flex items-center gap-3 rounded-xl border border-[#DCEEFF] bg-[#EAF4FF] p-3.5 text-xs text-[#243B53]">
          <ShieldCheck className="h-5 w-5 text-[#368CE7] shrink-0" />
          <span>
            You are logged in as a <strong>{role}</strong>. You have permission to view and modify your own contact details and security password. Administrative records and company-wide profiles are restricted.
          </span>
        </div>
      )}

      {/* Success & Error Feedback */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-[#249B70] animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-[#249B70] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#D9535D] animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-[#D9535D] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Profile Summary & Editable Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Summary Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF4FF] text-2xl font-bold text-[#368CE7] border-2 border-[#DCEEFF] shadow-xs">
                {formData.name?.charAt(0) || 'U'}
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#243B53] font-heading">
                {formData.name || 'User Profile'}
              </h3>
              <p className="text-xs text-[#647A91]">{formData.email}</p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase border ${getRoleBadge(
                    formData.role
                  )}`}
                >
                  {formData.role}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-[#249B70] border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#249B70]" />
                  {formData.status}
                </span>
              </div>

              {formData.title && (
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#243B53]">
                  <Briefcase className="h-3.5 w-3.5 text-[#647A91]" />
                  <span>{formData.title}</span>
                </div>
              )}

              {formData.department && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#647A91]">
                  <Building className="h-3.5 w-3.5 text-[#647A91]" />
                  <span>{formData.department}</span>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-[#D9E8F5] pt-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#647A91]">Direct Phone:</span>
                <span className="font-medium text-[#243B53]">
                  {formData.phone || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#647A91]">Location:</span>
                <span className="font-medium text-[#243B53]">
                  {formData.city && formData.state
                    ? `${formData.city}, ${formData.state}`
                    : formData.country || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#647A91]">Profile Context:</span>
                <span className="font-semibold text-[#368CE7]">
                  {isEditingSelf ? 'Personal Account' : 'Managed Account'}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Customer Details Card */}
          {activeCustomer && (
            <div className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#D9E8F5] pb-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-[#368CE7]" />
                  <h4 className="text-xs font-bold text-[#243B53] uppercase tracking-wider">
                    Linked Organization
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#647A91]">
                  {activeCustomer.customerNumber}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div>
                  <span className="text-[#647A91] block text-[11px]">
                    Company Name
                  </span>
                  <span className="font-bold text-[#243B53]">
                    {activeCustomer.companyName || activeCustomer.name}
                  </span>
                </div>
                {activeCustomer.taxId && (
                  <div>
                    <span className="text-[#647A91] block text-[11px]">
                      Tax Registration / EIN
                    </span>
                    <span className="font-mono text-slate-700">
                      {activeCustomer.taxId}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#647A91] block text-[11px]">
                    Primary Billing Address
                  </span>
                  <span className="text-[#243B53]">
                    {activeCustomer.billingAddress || 'No billing address on file'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: Contact Information */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#D9E8F5] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#243B53] font-heading">
                  Contact Information & Details
                </h3>
                <p className="text-xs text-[#647A91]">
                  {isAdmin && !isEditingSelf
                    ? `Editing contact profile for ${formData.name}.`
                    : 'Manage your direct telephone, mailing address, and profile biography.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadUserProfile(selectedUserId)}
                className="flex items-center gap-1.5 rounded-lg border border-[#D9E8F5] px-3 py-1.5 text-xs font-semibold text-[#647A91] hover:bg-[#F4F9FF] hover:text-[#243B53] transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Basic Identity */}
            <div>
              <h4 className="text-xs font-bold text-[#647A91] uppercase tracking-wider mb-3">
                1. Basic Identity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    Full Name <span className="text-[#D9535D]">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 pl-9 pr-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    Email Address <span className="text-slate-400 text-[10px]">(Verified)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-9 text-xs text-[#647A91] cursor-not-allowed"
                    />
                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    Job Title / Role Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Chief Financial Officer"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 pl-9 pr-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    Department / Unit
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Finance & Accounting"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 pl-9 pr-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Numbers & Address */}
            <div className="pt-2 border-t border-[#D9E8F5]">
              <h4 className="text-xs font-bold text-[#647A91] uppercase tracking-wider mb-3">
                2. Contact Information & Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    Telephone / Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 pl-9 pr-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    Street Address / HQ Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 100 Financial Way, Suite 500"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 pl-9 pr-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 px-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    State / Province / Region
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. California"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 px-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    Postal / ZIP Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 94105"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 px-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. United States"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 px-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                  />
                </div>
              </div>
            </div>

            {/* Professional Notes */}
            <div className="pt-2 border-t border-[#D9E8F5]">
              <h4 className="text-xs font-bold text-[#647A91] uppercase tracking-wider mb-3">
                3. Professional Notes & Bio
              </h4>
              <div>
                <label className="block text-xs font-medium text-[#243B53] mb-1">
                  Biography / Billing Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any relevant organizational details, billing preferences, or background notes..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full rounded-xl border border-[#D9E8F5] bg-white p-3 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                />
              </div>
            </div>

            {/* Admin status selector */}
            {isAdmin && (
              <div className="pt-2 border-t border-[#D9E8F5]">
                <h4 className="text-xs font-bold text-[#647A91] uppercase tracking-wider mb-3">
                  4. Administrator Account Controls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#243B53] mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 px-3 text-xs text-[#243B53] focus:border-[#368CE7]"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#243B53] mb-1">
                      Account Role (Assigned via Backend)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.role}
                      className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 px-3 text-xs text-[#647A91] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9E8F5]">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[#368CE7] py-2.5 px-6 text-xs font-bold text-white shadow-md shadow-[#368CE7]/20 hover:bg-[#2e79cc] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Contact Details'}</span>
              </button>
            </div>
          </form>

          {/* Form 2: Dedicated Password Security & Credentials Update */}
          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#D9E8F5] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#368CE7]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#243B53] font-heading">
                    Security Credentials & Password Management
                  </h3>
                  <p className="text-xs text-[#647A91]">
                    {isAdmin && !isEditingSelf
                      ? `Administrator Override: Set a new cryptographically validated password for ${formData.name}.`
                      : 'Update your account login password with active entropy and security criteria validation.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Password Feedback alerts */}
            {passwordSuccessMsg && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-[#249B70] animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 text-[#249B70] shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#D9535D] animate-in fade-in">
                <AlertCircle className="h-5 w-5 text-[#D9535D] shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Password (only if user is editing their own password) */}
              {(!isAdmin || isEditingSelf) && (
                <div>
                  <label className="block text-xs font-medium text-[#243B53] mb-1">
                    Current Password <span className="text-[#D9535D]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password"
                      className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 pl-9 pr-10 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-[#243B53] mb-1">
                  New Password <span className="text-[#D9535D]">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 pl-9 pr-10 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Embedded Real-Time Password Strength Meter */}
                <PasswordStrengthMeter password={newPassword} showCriteria={true} />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-medium text-[#243B53] mb-1">
                  Confirm New Password <span className="text-[#D9535D]">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-[#D9E8F5] bg-white py-2 pl-9 pr-10 text-xs text-[#243B53] focus:border-[#368CE7] focus:ring-1 focus:ring-[#368CE7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Match indicator */}
                {confirmNewPassword && (
                  <div
                    className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                      newPassword === confirmNewPassword ? 'text-[#249B70]' : 'text-[#D9535D]'
                    }`}
                  >
                    {newPassword === confirmNewPassword ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#249B70] shrink-0" />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-[#D9535D] shrink-0" />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-[#D9E8F5]">
              <div className="text-[11px] text-[#647A91]">
                {!newPasswordStrength.isCompliant && newPassword.length > 0 && (
                  <span>Fulfill all 5 security criteria to enable update</span>
                )}
              </div>
              <button
                type="submit"
                disabled={isUpdatingPassword || !isPasswordFormValid}
                className="flex items-center gap-2 rounded-xl bg-[#368CE7] py-2.5 px-6 text-xs font-bold text-white shadow-md shadow-[#368CE7]/20 hover:bg-[#2e79cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <KeyRound className={`h-4 w-4 ${isUpdatingPassword ? 'animate-spin' : ''}`} />
                <span>{isUpdatingPassword ? 'Updating Credentials...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

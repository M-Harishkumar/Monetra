import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Customer } from '../../types.ts';
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
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PasswordStrengthMeter } from '../../components/common/PasswordStrengthMeter.tsx';
import { evaluatePasswordStrength } from '../../utils/password-strength.ts';

export const ProfilePage: React.FC = () => {
  const { user: authUser, role, refreshProfile } = useAuth();

  // Profile Form state - strictly initialized from authenticated user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
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
    createdAt: '',
    updatedAt: '',
  });

  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
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

  // Load authenticated user profile directly from /api/profile/me
  useEffect(() => {
    loadMyProfile();
  }, [authUser?.id]);

  const loadMyProfile = async () => {
    try {
      setIsLoadingProfile(true);
      setErrorMessage(null);
      // Strictly calls /api/profile/me - backend determines identity from verified session token
      const userData = await api.getProfileMe();

      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || role || 'CUSTOMER',
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
        createdAt: userData.createdAt || '',
        updatedAt: userData.updatedAt || '',
      });

      setActiveCustomer(userData.customer || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load your personal profile.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetForm = () => {
    loadMyProfile();
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Send only user-updatable profile fields
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        title: formData.title.trim(),
        department: formData.department.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),
        bio: formData.bio.trim(),
      };

      await api.updateProfileMe(payload);
      setSuccessMessage('Your profile and contact details have been updated successfully.');
      await refreshProfile();
      setTimeout(() => setSuccessMessage(null), 5000);
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

    if (!currentPassword) {
      setPasswordErrorMsg('Please provide your current password to authorize this credential change.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });

      setPasswordSuccessMsg('Your account password and security credentials have been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccessMsg(null), 6000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to update credentials. Please verify your current password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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

  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'System Administrator';
      case 'STAFF':
        return 'Operations Staff Member';
      case 'CUSTOMER':
        return 'Enterprise Client';
      default:
        return r;
    }
  };

  const formatAccountDate = (dateString?: string) => {
    if (!dateString) return 'Active Member';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Active Member';
    }
  };

  const newPasswordStrength = evaluatePasswordStrength(newPassword);
  const isPasswordFormValid =
    newPasswordStrength.isCompliant &&
    newPassword === confirmNewPassword &&
    currentPassword.length > 0;

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#D9E8F5] border-t-[#368CE7]" />
          <p className="text-xs font-semibold text-[#647A91]">Loading your personal profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#243B53] font-heading">
            My Profile & Account Security
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#647A91]">
            Manage your personal contact details, organizational role, and enterprise credentials.
          </p>
        </div>

        {/* Current Authenticated Role Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#647A91]">Authenticated As:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRoleBadge(
              formData.role || role
            )}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {formData.role || role}
          </span>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-[#249B70] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-semibold text-rose-800 shadow-xs animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-[#D9535D] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Summary Hero Card */}
      <div className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* User Avatar Circle */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EAF4FF] to-[#DCEEFF] border-2 border-[#D9E8F5] text-2xl font-black text-[#368CE7] shadow-sm">
              {formData.name?.charAt(0)?.toUpperCase() || authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-xs border border-[#D9E8F5]">
                <span className="h-3 w-3 rounded-full bg-[#249B70]" title="Account Active" />
              </span>
            </div>

            {/* Profile Identity */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-[#243B53] font-heading">
                  {formData.name || authUser?.name || 'User Profile'}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase border ${getRoleBadge(
                    formData.role || role
                  )}`}
                >
                  <Shield className="h-2.5 w-2.5" />
                  {getRoleDisplayName(formData.role || role)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#249B70]" />
                  ACTIVE
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#647A91] pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#368CE7]" />
                  {formData.email || authUser?.email}
                </span>

                {formData.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#368CE7]" />
                    {formData.phone}
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#368CE7]" />
                  Joined {formatAccountDate(formData.createdAt)}
                </span>
              </div>

              {activeCustomer && (
                <div className="pt-1 text-xs font-medium text-[#243B53] flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-[#368CE7]" />
                  <span>Linked Organization: <strong>{activeCustomer.companyName || activeCustomer.name}</strong></span>
                  <span className="text-[#647A91]">({activeCustomer.customerNumber})</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats / Telemetry Pill */}
          <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-[#D9E8F5] pt-4 md:pt-0 md:pl-6 text-xs text-[#647A91]">
            <div className="rounded-xl bg-[#F4F9FF] border border-[#D9E8F5] p-3 text-center min-w-[110px]">
              <span className="block text-[10px] font-semibold uppercase text-[#647A91]">Session Type</span>
              <span className="text-xs font-bold text-[#243B53]">JWT Verified</span>
            </div>
            <div className="rounded-xl bg-[#F4F9FF] border border-[#D9E8F5] p-3 text-center min-w-[110px]">
              <span className="block text-[10px] font-semibold uppercase text-[#647A91]">Role Scope</span>
              <span className="text-xs font-bold text-[#368CE7]">{role} Tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Personal Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identity & Contact Information */}
        <div className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#D9E8F5] mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#368CE7]">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#243B53] font-heading">
                Personal Contact Details
              </h3>
              <p className="text-xs text-[#647A91]">
                Your official identity and contact channels used for billing correspondence and system notices.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                Full Name <span className="text-[#D9535D]">*</span>
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Email Address (Read-only for security) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#243B53]">
                  Email Address
                </label>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#249B70]">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Login Email
                </span>
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full rounded-xl border border-[#D9E8F5] bg-slate-100/70 py-2 pl-9 pr-3 text-xs text-[#647A91] cursor-not-allowed select-all"
                />
              </div>
              <p className="mt-1 text-[10px] text-[#647A91]">
                Primary login email cannot be changed directly to prevent unauthorized account takeover.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Assigned Role (Read-only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#243B53]">
                  Security Role & Permission Tier
                </label>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#647A91]">
                  <Lock className="h-3 w-3 text-[#368CE7]" />
                  Protected Field
                </span>
              </div>
              <div className="relative">
                <Shield className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
                <input
                  type="text"
                  disabled
                  value={`${formData.role} (${getRoleDisplayName(formData.role)})`}
                  className="w-full rounded-xl border border-[#D9E8F5] bg-slate-100/70 py-2 pl-9 pr-3 text-xs font-semibold text-[#243B53] cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-[10px] text-[#647A91]">
                Access roles are enforced cryptographically via session JWT and cannot be modified.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Professional & Organizational Position */}
        <div className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#D9E8F5] mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#368CE7]">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#243B53] font-heading">
                Organization & Department
              </h3>
              <p className="text-xs text-[#647A91]">
                Your business title, corporate department, and operational role summary.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                Job Title / Corporate Role
              </label>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. VP of Finance, Revenue Operations Lead"
                  className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                Department / Division
              </label>
              <div className="relative">
                <Building className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g. Enterprise Accounting, Global Operations"
                  className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Bio / Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                Professional Bio & Account Responsibilities
              </label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#647A91]" />
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Brief description of your role, responsibilities, or billing contact notes..."
                  className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2.5 pl-9 pr-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Billing & Physical Address */}
        <div className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#D9E8F5] mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#368CE7]">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#243B53] font-heading">
                Address & Regional Details
              </h3>
              <p className="text-xs text-[#647A91]">
                Physical address details used for official billing tax receipts and regional compliance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Street Address */}
            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                Street Address
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="100 Enterprise Way, Suite 400"
                  className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 px-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
              />
            </div>

            {/* State / Region */}
            <div>
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                State / Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State / Province"
                className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 px-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                Postal Code / ZIP
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="Postal Code"
                className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 px-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Country */}
            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Country"
                className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 px-3 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons for Profile Details */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-[#D9E8F5] bg-white px-4 py-2.5 text-xs font-semibold text-[#647A91] hover:bg-[#F4F9FF] hover:text-[#243B53] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Discard Changes</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-[#368CE7] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#368CE7]/20 hover:bg-[#2e79cc] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Section 4: Security Credentials & Password Management */}
      <div className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#D9E8F5] mb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#368CE7]">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#243B53] font-heading">
              Security Credentials & Password Management
            </h3>
            <p className="text-xs text-[#647A91]">
              Update your account password with enterprise complexity requirements.
            </p>
          </div>
        </div>

        {passwordSuccessMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs font-semibold text-emerald-800 shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-[#249B70] shrink-0" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-semibold text-rose-800 shadow-xs">
            <AlertCircle className="h-4 w-4 text-[#D9535D] shrink-0" />
            <span>{passwordErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
              Current Password <span className="text-[#D9535D]">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password to authorize change"
                className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-10 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-[#647A91] hover:text-[#243B53] cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
              New Password <span className="text-[#D9535D]">*</span>
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-10 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-[#647A91] hover:text-[#243B53] cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            <PasswordStrengthMeter password={newPassword} showCriteria={true} />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-[#243B53] mb-1.5">
              Confirm New Password <span className="text-[#D9535D]">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#647A91]" />
              <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] py-2 pl-9 pr-10 text-xs text-[#243B53] placeholder-[#647A91] focus:border-[#368CE7] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                className="absolute right-3 top-2.5 text-[#647A91] hover:text-[#243B53] cursor-pointer"
              >
                {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmNewPassword && newPassword !== confirmNewPassword && (
              <p className="mt-1 text-[11px] font-medium text-[#D9535D]">
                Passwords do not match.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword || !isPasswordFormValid}
              className="flex items-center gap-2 rounded-xl bg-[#368CE7] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#368CE7]/20 hover:bg-[#2e79cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{isUpdatingPassword ? 'Updating Credentials...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

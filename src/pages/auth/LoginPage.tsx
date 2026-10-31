import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, CheckCircle2, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration state
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'STAFF' | 'CUSTOMER'>('CUSTOMER');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      setIsLoading(true);
      setLoadingMsg('Verifying credentials & issuing session token...');
      await login({ email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMsg('Creating your secure enterprise account...');
      await api.register({
        name,
        email: email.trim(),
        password,
        confirmPassword,
        role: selectedRole,
      });

      // Automatically log the user in with their newly created credentials
      setLoadingMsg('Account created! Authenticating session...');
      await login({ email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      setIsLoading(true);
      setLoadingMsg('Generating single-use recovery token...');
      const res: any = await api.forgotPassword(email.trim());
      setSuccessMsg(
        res?.resetToken
          ? `Reset token generated: ${res.resetToken}. Password instructions dispatched to ${email.trim()}.`
          : 'Password reset instructions dispatched to your email address.'
      );
    } catch (err: any) {
      setError(err.message || 'Error processing password reset request.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-4 selection:bg-teal-500 selection:text-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 font-bold text-slate-950 shadow-lg shadow-teal-500/25">
            <Zap className="h-6 w-6 fill-slate-950" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-heading">
            NEXORA
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Subscription & Revenue Intelligence Platform
          </p>
        </div>

        {/* Auth Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-7 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="mb-6 flex border-b border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-teal-400 text-teal-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-teal-400 text-teal-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Account
            </button>
            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(null); }}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                mode === 'forgot'
                  ? 'border-teal-400 text-teal-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Reset Password
            </button>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@nexora.io or your email"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-300 font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-teal-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password (e.g. Admin@Nexora123!)"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0"
                  />
                  <span>Keep me signed in</span>
                </label>
                <span className="text-slate-500">JWT Encrypted</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-teal-500 py-2.5 font-bold text-slate-950 hover:bg-teal-400 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>{loadingMsg || 'Signing In...'}</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Platform</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Vihashini S V"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 9 chars, uppercase, special"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="CUSTOMER">Customer (Client Portal & Receipts)</option>
                  <option value="STAFF">Finance Staff (Operations & Billing)</option>
                  <option value="ADMIN">Platform Admin (Full Executive Control)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-teal-500 py-2.5 font-bold text-slate-950 hover:bg-teal-400 transition-colors shadow-md disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>{loadingMsg || 'Registering...'}</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration & Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4 text-xs">
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Enter your registered corporate email to generate a secure, single-use, time-limited reset token with an audit event dispatched.
              </p>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-teal-500 py-2.5 font-bold text-slate-950 hover:bg-teal-400 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>{loadingMsg || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span>Generate Password Reset Link</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-slate-400 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-teal-400 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}


        </div>
      </div>
    </div>
  );
};

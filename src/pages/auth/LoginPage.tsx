import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
  Lock,
  Mail,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration state
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');

  const routeUserByRole = (userRole: string) => {
    const fromPath = (location.state as any)?.from?.pathname;
    const isDashboardRoute =
      fromPath === '/admin/dashboard' ||
      fromPath === '/staff/dashboard' ||
      fromPath === '/customer/dashboard';

    if (fromPath && fromPath !== '/login' && fromPath !== '/signin' && fromPath !== '/' && !isDashboardRoute) {
      navigate(fromPath, { replace: true });
      return;
    }

    if (userRole === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (userRole === 'STAFF') {
      navigate('/staff/dashboard', { replace: true });
    } else {
      navigate('/customer/dashboard', { replace: true });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      setIsLoading(true);
      setLoadingMsg('Verifying credentials & issuing session token...');
      const user = await login({ email: email.trim(), password });
      routeUserByRole(user.role);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      setIsLoading(true);
      setLoadingMsg('Signing in with Google & syncing Firestore...');
      const user = await loginWithGoogle();
      routeUserByRole(user.role);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
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
      setLoadingMsg('Creating secure client account in database...');
      await api.register({
        name,
        email: email.trim(),
        password,
        confirmPassword,
      });

      // Automatically sign in newly registered customer
      setLoadingMsg('Account created! Authenticating session...');
      const user = await login({ email: email.trim(), password });
      navigate('/customer/dashboard', { replace: true });
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
          ? `Reset token generated: ${res.resetToken}. Instructions dispatched to ${email.trim()}.`
          : 'Password reset instructions dispatched to your email address.'
      );
    } catch (err: any) {
      setError(err.message || 'Error processing password reset request.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  const fillQuickCredentials = (roleType: 'admin' | 'staff' | 'customer') => {
    setError(null);
    setSuccessMsg(null);
    if (roleType === 'admin') {
      setEmail('admin@nexora.io');
      setPassword('Admin@Nexora123!');
    } else if (roleType === 'staff') {
      setEmail('staff.sarah@nexora.io');
      setPassword('Staff@Nexora123!');
    } else {
      setEmail('customer@nexora.io');
      setPassword('Customer@Nexora123!');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-4 selection:bg-teal-500 selection:text-slate-950">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-slate-950 shadow-xl shadow-teal-500/20 mb-3">
            <Zap className="h-6 w-6 fill-slate-950" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
              NEXORA
            </h1>
            <span className="rounded-sm bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-400 border border-teal-500/20">
              PRO
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 max-w-xs">
            Enterprise Subscription &amp; Revenue Intelligence Platform
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header text */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white font-heading">
              {mode === 'login'
                ? 'Sign in to platform'
                : mode === 'register'
                ? 'Register Client Account'
                : 'Account Recovery'}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {mode === 'login'
                ? 'Access your subscription ledger, revenue guard, and intelligence telemetry.'
                : mode === 'register'
                ? 'Create a customer account to access your invoices and subscriptions.'
                : 'Enter your work email address to receive password recovery instructions.'}
            </p>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 p-3 text-xs text-teal-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign-in with Firebase Auth */}
          {mode === 'login' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 py-2.5 px-4 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                  <span className="bg-slate-900 px-2 text-slate-500">Or with work email</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Mode 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nexora.io"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-teal-400 hover:text-teal-300 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-teal-500 accent-teal-500"
                  />
                  <span className="text-[11px] text-slate-400">Remember session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-md shadow-teal-500/20 hover:bg-teal-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>{loadingMsg || 'Authenticating...'}</span>
                ) : (
                  <>
                    <span>Sign In to NEXORA</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form Mode 2: REGISTRATION */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marcus Sterling"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password (min 9 chars)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-md shadow-teal-500/20 hover:bg-teal-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Creating Account...' : 'Register Client Account'}
              </button>
            </form>
          )}

          {/* Form Mode 3: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-md shadow-teal-500/20 hover:bg-teal-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Sending Token...' : 'Dispatch Reset Token'}
              </button>
            </form>
          )}

          {/* Toggle between Login and Register */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            {mode === 'login' ? (
              <>
                <span>Need client access?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                <span>Already registered?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Demo Credentials Footer Pills */}
        <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              DEMO ACCOUNTS (1-CLICK FILL):
            </span>
            <span className="text-[10px] text-teal-400">Evaluator Mode</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickCredentials('admin')}
              className="rounded-lg bg-slate-950 border border-slate-800 py-2 px-1 text-center hover:border-teal-500/50 hover:bg-teal-500/5 transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold text-white">Admin</p>
              <p className="text-[10px] text-slate-400 truncate">Elena Rostova</p>
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredentials('staff')}
              className="rounded-lg bg-slate-950 border border-slate-800 py-2 px-1 text-center hover:border-teal-500/50 hover:bg-teal-500/5 transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold text-white">Staff</p>
              <p className="text-[10px] text-slate-400 truncate">Sarah Jenkins</p>
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredentials('customer')}
              className="rounded-lg bg-slate-950 border border-slate-800 py-2 px-1 text-center hover:border-teal-500/50 hover:bg-teal-500/5 transition-colors cursor-pointer"
            >
              <p className="text-[11px] font-bold text-white">Client</p>
              <p className="text-[10px] text-slate-400 truncate">Marcus Sterling</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

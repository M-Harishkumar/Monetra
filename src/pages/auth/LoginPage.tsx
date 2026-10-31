import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, User, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await api.register({ name, email, password, confirmPassword });
      setSuccessMsg('Account registered successfully! Please log in.');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await api.forgotPassword(email);
      setSuccessMsg('Password reset instructions dispatched to your email.');
    } catch (err: any) {
      setError(err.message || 'Error processing request.');
    } finally {
      setIsLoading(false);
    }
  };

  const fastFill = (demoEmail: string, demoPass: string, role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    switchRole(role);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 font-bold text-slate-950 shadow-lg shadow-teal-500/20">
            <Zap className="h-6 w-6 fill-slate-950" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-heading">
            NEXORA
          </h1>
          <p className="text-xs text-slate-400">
            Subscription & Revenue Intelligence Platform
          </p>
        </div>

        {/* Auth Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@nexora.io"
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
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-teal-500 py-2.5 font-bold text-slate-950 hover:bg-teal-400 transition-colors shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Portal'}
              </button>

              <div className="text-center pt-2 text-slate-400 text-xs">
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-teal-400 hover:underline"
                >
                  Register new account
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="rachel@example.com"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 9 chars, uppercase, special"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-teal-500 py-2.5 font-bold text-slate-950 hover:bg-teal-400 transition-colors shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Registering...' : 'Complete Registration'}
              </button>

              <div className="text-center pt-2 text-slate-400 text-xs">
                Already registered?{' '}
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

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4 text-xs">
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Enter your registered corporate email to generate a secure, single-use, time-limited reset token.
              </p>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-teal-500 py-2.5 font-bold text-slate-950 hover:bg-teal-400 transition-colors shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Send Password Reset Link'}
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

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
              1-Click Fast Login for Evaluators & Reviewers:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fastFill('admin@nexora.io', 'Admin@Nexora123!', 'ADMIN')}
                className="rounded-lg bg-slate-800 p-2 text-center hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <span className="block font-bold text-xs text-purple-400">Admin</span>
                <span className="block text-[9px] text-slate-400">Full Suite</span>
              </button>
              <button
                type="button"
                onClick={() => fastFill('staff.sarah@nexora.io', 'Staff@Nexora123!', 'STAFF')}
                className="rounded-lg bg-slate-800 p-2 text-center hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <span className="block font-bold text-xs text-blue-400">Staff</span>
                <span className="block text-[9px] text-slate-400">Operations</span>
              </button>
              <button
                type="button"
                onClick={() => fastFill('customer@nexora.io', 'Customer@Nexora123!', 'CUSTOMER')}
                className="rounded-lg bg-slate-800 p-2 text-center hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <span className="block font-bold text-xs text-emerald-400">Customer</span>
                <span className="block text-[9px] text-slate-400">Portal View</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

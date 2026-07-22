import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Lock, Mail, Loader2, Boxes, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/auth/login', data);
      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-500 rounded-xl text-white mb-3">
            <Boxes className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-brand-300 bg-clip-text text-transparent">
            ERP + CRM Portal
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Log in to manage wholesale operations
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2.5 p-3 rounded-lg bg-rose-950/40 border border-rose-500/35 text-rose-200 text-xs">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="you@erpcrm.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                {...register('email', { required: 'Email address is required' })}
              />
            </div>
            {errors.email && (
              <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                {...register('password', { required: 'Password is required' })}
              />
            </div>
            {errors.password && (
              <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-8 p-4 rounded-lg bg-slate-900/50 border border-slate-800/60">
          <p className="text-[10px] uppercase font-bold tracking-wider text-brand-400 mb-1.5">
            Test Credentials
          </p>
          <div className="space-y-1 text-xs text-slate-400">
            <p>
              <span className="font-semibold text-slate-300">Email:</span> admin@erpcrm.com
            </p>
            <p>
              <span className="font-semibold text-slate-300">Password:</span> admin123
            </p>
            <p className="text-[10px] text-slate-500 mt-2 italic">
              Role: Admin (Automatic seed on server run)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

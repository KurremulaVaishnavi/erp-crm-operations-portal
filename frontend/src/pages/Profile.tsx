import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, Key, Boxes } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const roleDescriptions: Record<string, string> = {
    ADMIN: 'Full read & write capabilities across CRM, inventory products, stock movements, and invoicing systems.',
    SALES: 'Register leads and customers. Draft, create, and confirm sales challans.',
    WAREHOUSES: 'Manage catalog products and execute physical stock adjustments.',
    ACCOUNTS: 'View-only access to customer histories, inventory lists, and billing invoice logs.',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">User Account Profile</h1>
        <p className="text-xs text-slate-400">View user session metadata and application authorization levels</p>
      </div>

      <div className="glass-card rounded-xl border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="h-14 w-14 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200">{user.name}</h2>
            <span className="inline-flex px-2 py-0.5 mt-1 rounded text-[10px] font-bold tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/35 uppercase">
              {user.role} ROLE
            </span>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <div className="flex items-center gap-3">
            <Mail className="h-4.5 w-4.5 text-slate-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Registered Email</p>
              <p className="text-slate-200">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Authorized Capabilities</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{roleDescriptions[user.role] || 'Standard portal access'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Key className="h-4.5 w-4.5 text-slate-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide font-sans">User ID (Token payload)</p>
              <p className="text-slate-500 mt-0.5">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Security alert context */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-850 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
          <Boxes className="h-5 w-5 text-brand-400 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-slate-300">Security Context</p>
            <p>Access privileges are tied directly to your active JWT session. If you experience access restriction messages, try logging out and signing in again.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

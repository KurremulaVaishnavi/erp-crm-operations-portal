import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Toast, ToastType } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  Building,
  Mail,
  Phone,
  FileText,
  Clock,
  Plus,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';

interface FollowUp {
  id: string;
  note: string;
  date: string;
}

interface Customer {
  id: string;
  customerName: string;
  businessName: string;
  email: string;
  mobileNumber: string;
  gstNumber?: string;
  customerType: string;
  address: string;
  status: string;
  followUpDate?: string;
  notes?: string;
  followUps: FollowUp[];
  challans: Array<{
    id: string;
    challanNumber: string;
    status: string;
    createdDate: string;
  }>;
}

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const fetchCustomerDetails = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomer(res.data.customer);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch customer profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setBtnLoading(true);
    try {
      const res = await api.post(`/customers/${id}/follow-up`, { note: newNote });
      if (res.data.success) {
        showToast('Follow-up activity logged');
        setNewNote('');
        fetchCustomerDetails();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to log follow-up notes', 'error');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading customer profile details...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 bg-rose-950/30 border border-rose-900/30 rounded-xl text-center">
        <p className="text-rose-300 font-semibold mb-2">Customer Profile Not Found</p>
        <Link to="/customers" className="text-xs text-brand-400 hover:underline">
          Return to CRM list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Back button */}
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CRM List
        </Link>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Info Details */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold">{customer.customerName}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                <Building className="h-3.5 w-3.5" />
                {customer.businessName}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                customer.status === 'ACTIVE'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-950 text-amber-400 border border-amber-500/20'
              }`}>
                {customer.status}
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 uppercase">
                {customer.customerType}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Email Address</p>
                  <p className="text-slate-200">{customer.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mobile Contact</p>
                  <p className="text-slate-200">{customer.mobileNumber}</p>
                </div>
              </div>

              {customer.gstNumber && (
                <div className="flex items-center gap-3 font-mono">
                  <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">GST Registration</p>
                    <p className="text-brand-300">{customer.gstNumber}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Billing / Shipping Address</p>
                <p className="text-slate-300 whitespace-pre-line leading-relaxed">{customer.address}</p>
              </div>

              {customer.followUpDate && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300">
                  <Calendar className="h-4 w-4 text-brand-400" />
                  <div className="text-xs">
                    <p className="font-bold">Scheduled Follow Up Date</p>
                    <p className="mt-0.5">{new Date(customer.followUpDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {customer.notes && (
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <p className="font-bold text-slate-300 mb-1">CRM Core Notes:</p>
              <p className="text-slate-400">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Challans and Orders History */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileSpreadsheet className="h-4.5 w-4.5 text-slate-500" />
            Associated Sales Challans
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {customer.challans.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">No challans processed for customer</p>
            ) : (
              customer.challans.map((ch) => (
                <Link
                  key={ch.id}
                  to={`/challans/${ch.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 text-xs transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-200">{ch.challanNumber}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{new Date(ch.createdDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    ch.status === 'CONFIRMED'
                      ? 'bg-emerald-950 text-emerald-400'
                      : ch.status === 'DRAFT'
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-rose-950 text-rose-400'
                  }`}>
                    {ch.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Follow-up / Activity Logger Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log note form */}
        <div className="glass-card p-6 rounded-xl space-y-4 self-start">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 pb-2">
            <Plus className="h-4 w-4 text-brand-400" />
            Add Follow-Up Note
          </h3>
          <form onSubmit={handleAddFollowUp} className="space-y-3">
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Record notes from follow up calls, meetings or email replies..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 placeholder-slate-500 text-slate-200"
              required
            />
            <button
              type="submit"
              disabled={btnLoading || !newNote.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow disabled:opacity-50"
            >
              {btnLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Note Entry
            </button>
          </form>
        </div>

        {/* Notes list history */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="h-4.5 w-4.5 text-slate-500" />
            Activity Timeline Notes
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {customer.followUps.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No previous notes logged. Record your first interaction now.</p>
            ) : (
              customer.followUps.map((item) => (
                <div key={item.id} className="p-4 rounded-lg bg-slate-900 border border-slate-850 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-400">Interaction</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {item.note}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Toast, ToastType } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  Loader2,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Challan {
  id: string;
  challanNumber: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdDate: string;
  customer: { customerName: string; businessName: string };
  createdBy: { name: string };
  items: Array<{
    priceSnapshot: number;
    quantity: number;
  }>;
}

export const Challans: React.FC = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/challans');
      if (res.data.success) {
        setChallans(res.data.challans);
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching sales challans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this challan draft?')) return;
    try {
      const res = await api.delete(`/challans/${id}`);
      if (res.data.success) {
        showToast('Challan draft deleted successfully');
        fetchChallans();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete challan', 'error');
    }
  };

  // Calculate order total for display
  const getChallanTotal = (items: Challan['items']) => {
    return items.reduce((acc, curr) => acc + curr.priceSnapshot * curr.quantity, 0);
  };

  const filteredChallans = challans.filter((c) => {
    const val = search.toLowerCase();
    return (
      c.challanNumber.toLowerCase().includes(val) ||
      c.customer?.customerName.toLowerCase().includes(val) ||
      c.customer?.businessName.toLowerCase().includes(val)
    );
  });

  const isSalesUser = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sales Challans Registry</h1>
          <p className="text-xs text-slate-400">Create product orders, record drafts, and confirm inventory deductions</p>
        </div>
        {isSalesUser && (
          <Link
            to="/challans/new"
            className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Create Challan
          </Link>
        )}
      </div>

      {/* Search filter */}
      <div className="p-5 glass-card rounded-xl">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by challan number, business name..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm placeholder-slate-500 text-slate-200 focus:outline-none focus:border-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Challans Table Grid */}
      <div className="glass-card rounded-xl overflow-hidden border border-slate-800/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Challan Number</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer Client</th>
                <th className="px-6 py-4 text-right">Order Value</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Authorized By</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Fetching sales challans...
                  </td>
                </tr>
              ) : filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                    No sales challans recorded
                  </td>
                </tr>
              ) : (
                filteredChallans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-brand-400 font-mono">
                      {c.challanNumber}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(c.createdDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{c.customer?.customerName}</div>
                      <div className="text-[10px] text-slate-500">{c.customer?.businessName}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold font-mono text-slate-200">
                      ${getChallanTotal(c.items).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.status === 'CONFIRMED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                          : c.status === 'DRAFT'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-455">
                      {c.createdBy?.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/challans/${c.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {c.status === 'DRAFT' && isSalesUser && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            title="Delete Draft"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Toast, ToastType } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Building,
  User,
  AlertTriangle
} from 'lucide-react';

interface ChallanItem {
  id: string;
  productId: string | null;
  quantity: number;
  priceSnapshot: number;
  productNameSnapshot: string;
}

interface Customer {
  customerName: string;
  businessName: string;
  email: string;
  mobileNumber: string;
  address: string;
  gstNumber?: string;
}

interface UserCreator {
  name: string;
  email: string;
}

interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdDate: string;
  customer: Customer;
  createdBy: UserCreator;
  items: ChallanItem[];
}

export const ChallanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const fetchChallanDetails = async () => {
    try {
      const res = await api.get(`/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.challan);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load challan invoice details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallanDetails();
  }, [id]);

  const updateStatus = async (targetStatus: 'CONFIRMED' | 'CANCELLED') => {
    if (!window.confirm(`Are you sure you want to change status to ${targetStatus}?`)) return;
    setBtnLoading(targetStatus);
    try {
      const res = await api.put(`/challans/${id}`, { status: targetStatus });
      if (res.data.success) {
        showToast(`Challan status updated to ${targetStatus}`);
        fetchChallanDetails();
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setBtnLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading sales challan profile details...</p>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="p-6 bg-rose-950/30 border border-rose-900/30 rounded-xl text-center">
        <p className="text-rose-300 font-semibold mb-2">Challan Invoice Profile Not Found</p>
        <Link to="/challans" className="text-xs text-brand-400 hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  const invoiceTotal = challan.items.reduce((acc, curr) => acc + curr.priceSnapshot * curr.quantity, 0);

  // Checks for permissions
  const isSalesOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Back button & Action controls (Hidden on print) */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
        <Link
          to="/challans"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Challans Registry
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold hover:text-white"
          >
            <Printer className="h-4 w-4" />
            Print Challan Invoice
          </button>

          {challan.status === 'DRAFT' && isSalesOrAdmin && (
            <button
              onClick={() => updateStatus('CONFIRMED')}
              disabled={btnLoading !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {btnLoading === 'CONFIRMED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirm Challan
            </button>
          )}

          {challan.status === 'CONFIRMED' && user?.role === 'ADMIN' && (
            <button
              onClick={() => updateStatus('CANCELLED')}
              disabled={btnLoading !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {btnLoading === 'CANCELLED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel Challan
            </button>
          )}
        </div>
      </div>

      {/* Main printable Invoice Layout */}
      <div className="glass-panel p-8 sm:p-12 rounded-xl border border-slate-800/80 space-y-8 bg-slate-900/60 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 print:border-slate-300 pb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-300 to-white bg-clip-text text-transparent print:text-brand-700 font-mono">
              SALES CHALLAN INVOICE
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-500 font-semibold font-mono mt-1">
              Challan No: {challan.challanNumber}
            </p>
          </div>
          <div className="text-right text-xs">
            <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold ${
              challan.status === 'CONFIRMED'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20 print:bg-emerald-100 print:text-emerald-800'
                : challan.status === 'DRAFT'
                ? 'bg-amber-950 text-amber-400 border border-amber-500/20 print:bg-amber-100 print:text-amber-800'
                : 'bg-rose-950 text-rose-400 border border-rose-500/20 print:bg-rose-100 print:text-rose-800'
            }`}>
              {challan.status}
            </span>
            <p className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-end gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Date: {new Date(challan.createdDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Business details layout grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs leading-relaxed">
          {/* Customer Client Info */}
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-800 print:border-slate-200 pb-1.5">
              Billed/Shipped To
            </h3>
            <p className="font-bold text-sm text-slate-250 print:text-slate-900">{challan.customer.customerName}</p>
            <p className="font-semibold text-slate-400 print:text-slate-600 flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              {challan.customer.businessName}
            </p>
            <p className="text-slate-400 print:text-slate-600">{challan.customer.email}</p>
            <p className="text-slate-400 print:text-slate-600 font-mono">Phone: {challan.customer.mobileNumber}</p>
            {challan.customer.gstNumber && (
              <p className="text-brand-300 print:text-brand-700 font-mono font-bold">GSTIN: {challan.customer.gstNumber}</p>
            )}
            <p className="text-slate-350 print:text-slate-700 whitespace-pre-line mt-2">{challan.customer.address}</p>
          </div>

          {/* Supplier details (Standard template) */}
          <div className="space-y-2 sm:text-right">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-800 print:border-slate-200 pb-1.5">
              Issued By Supplier
            </h3>
            <p className="font-bold text-sm text-slate-250 print:text-slate-900">Wholesale Distribution Co.</p>
            <p className="text-slate-400 print:text-slate-600">Operations Hub Central Warehouse</p>
            <p className="text-slate-400 print:text-slate-600">Central Hub, Sector 5, Industrial Area</p>
            <p className="text-slate-400 print:text-slate-600 font-mono">support@distributor.com</p>
            <p className="text-[10px] text-slate-500 mt-4 flex items-center sm:justify-end gap-1">
              <User className="h-3.5 w-3.5" />
              Created by: {challan.createdBy.name}
            </p>
          </div>
        </div>

        {/* Invoice Item Lines Table */}
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-800 print:border-slate-200 pb-1.5">
            Product Line Spares Snapshots
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5">Product Name Snapshot</th>
                <th className="py-2.5 text-right">Unit Price Snapshot</th>
                <th className="py-2.5 text-center">Ordered Qty</th>
                <th className="py-2.5 text-right">Line Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 print:divide-slate-200 text-sm">
              {challan.items.map((item) => (
                <tr key={item.id} className="text-slate-300 print:text-slate-800">
                  <td className="py-3.5 font-semibold">
                    {item.productNameSnapshot}
                  </td>
                  <td className="py-3.5 text-right font-mono">
                    ${item.priceSnapshot.toFixed(2)}
                  </td>
                  <td className="py-3.5 text-center font-bold font-mono">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 text-right font-bold font-mono text-slate-100 print:text-slate-900">
                    ${(item.priceSnapshot * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex justify-end">
          <div className="text-right space-y-1.5">
            <p className="text-xs text-slate-400 print:text-slate-600">Subtotal amount due:</p>
            <p className="text-2xl font-bold font-mono text-brand-300 print:text-brand-700">
              ${invoiceTotal.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-500 italic mt-2">
              Note: This is an automatically generated document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

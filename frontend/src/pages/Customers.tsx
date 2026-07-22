import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Toast, ToastType } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Loader2,
  Calendar
} from 'lucide-react';

interface Customer {
  id: string;
  customerName: string;
  businessName: string;
  email: string;
  mobileNumber: string;
  gstNumber?: string;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  address: string;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  followUpDate?: string;
  notes?: string;
}

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerName: '',
      businessName: '',
      email: '',
      mobileNumber: '',
      gstNumber: '',
      customerType: 'RETAIL',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: '',
    }
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers', {
        params: {
          page,
          search,
          status: statusFilter || undefined,
          customerType: typeFilter || undefined,
          limit: 10,
        },
      });
      if (response.data.success) {
        setCustomers(response.data.customers);
        setTotalPages(response.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, statusFilter, typeFilter]);

  const openAddModal = () => {
    setEditingCustomer(null);
    reset({
      customerName: '',
      businessName: '',
      email: '',
      mobileNumber: '',
      gstNumber: '',
      customerType: 'RETAIL',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      customerName: customer.customerName,
      businessName: customer.businessName,
      email: customer.email,
      mobileNumber: customer.mobileNumber,
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      address: customer.address,
      status: customer.status,
      followUpDate: customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : '',
      notes: customer.notes || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    setModalLoading(true);
    try {
      // Empty string to null conversion for date/gst
      if (!data.followUpDate) data.followUpDate = null;
      if (!data.gstNumber) data.gstNumber = null;

      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer.id}`, data);
        if (res.data.success) {
          showToast('Customer updated successfully');
          setIsModalOpen(false);
          fetchCustomers();
        }
      } else {
        const res = await api.post('/customers', data);
        if (res.data.success) {
          showToast('Customer added successfully');
          setIsModalOpen(false);
          fetchCustomers();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving customer details', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) return;
    try {
      const res = await api.delete(`/customers/${id}`);
      if (res.data.success) {
        showToast('Customer deleted successfully');
        fetchCustomers();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete customer', 'error');
    }
  };

  const isWriter = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">CRM Directory</h1>
          <p className="text-xs text-slate-400">Track and manage wholesale leads, accounts, and client relationships</p>
        </div>
        {isWriter && (
          <button
            onClick={openAddModal}
            className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 glass-card rounded-xl">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search name, email, business..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm placeholder-slate-500 text-slate-200 focus:outline-none focus:border-brand-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div>
          <select
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="LEAD">Leads</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div>
          <select
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Customer Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-slate-800/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Business Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Customer Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Fetching customers catalog...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    No customers found matching current filters
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {c.customerName}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {c.businessName}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <p>{c.email}</p>
                      <p className="mt-0.5 font-mono">{c.mobileNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                        {c.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                          : c.status === 'LEAD'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/customers/${c.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {isWriter && (
                          <button
                            onClick={() => openEditModal(c)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            title="Delete"
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

        {/* Pagination bar */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <p>Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit customer modal popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-xl glass-panel shadow-2xl overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <h3 className="font-bold text-base text-slate-200">
                {editingCustomer ? 'Modify Customer Record' : 'Register New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                    placeholder="e.g. John Doe"
                    {...register('customerName', { required: 'Customer name is required' })}
                  />
                  {errors.customerName && <p className="text-rose-400 text-xs mt-1">{errors.customerName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                    placeholder="e.g. Acme Wholesale Corp"
                    {...register('businessName', { required: 'Business name is required' })}
                  />
                  {errors.businessName && <p className="text-rose-400 text-xs mt-1">{errors.businessName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                    placeholder="client@business.com"
                    {...register('email', { required: 'Valid email is required' })}
                  />
                  {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100 font-mono"
                    placeholder="e.g. +91 9988776655"
                    {...register('mobileNumber', { required: 'Mobile number is required' })}
                  />
                  {errors.mobileNumber && <p className="text-rose-400 text-xs mt-1">{errors.mobileNumber.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Customer Type
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
                    {...register('customerType')}
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    CRM status
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
                    {...register('status')}
                  >
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100 font-mono"
                    placeholder="22AAAAA0000A1Z5"
                    {...register('gstNumber')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Physical Address *
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                  placeholder="Billing / Shipping Address details"
                  {...register('address', { required: 'Address is required' })}
                />
                {errors.address && <p className="text-rose-400 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Next Follow-Up Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                      {...register('followUpDate')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    CRM Admin Notes
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                    placeholder="Initial context / target segment"
                    {...register('notes')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-850 hover:bg-slate-800 text-sm text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {modalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingCustomer ? 'Update Record' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

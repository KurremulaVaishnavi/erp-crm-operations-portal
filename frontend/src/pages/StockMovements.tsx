import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { Toast, ToastType } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
  Calendar,
  X,
  Search,
  Inbox
} from 'lucide-react';

interface Movement {
  id: string;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  timestamp: string;
  product: { productName: string; sku: string };
  createdBy: { name: string; email: string };
}

interface ProductOption {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
}

export const StockMovements: React.FC = () => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Filters
  const [productIdFilter, setProductIdFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      productId: '',
      quantityChanged: 1,
      movementType: 'IN',
      reason: '',
    }
  });

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock-movements', {
        params: {
          productId: productIdFilter || undefined,
          movementType: typeFilter || undefined,
        },
      });
      if (res.data.success) {
        setMovements(res.data.movements);
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching stock ledger logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductOptions = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [productIdFilter, typeFilter]);

  useEffect(() => {
    fetchProductOptions();
  }, []);

  const openAdjustModal = () => {
    reset({
      productId: products[0]?.id || '',
      quantityChanged: 1,
      movementType: 'IN',
      reason: 'Manual adjustment',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    setModalLoading(true);
    try {
      data.quantityChanged = parseInt(data.quantityChanged);

      // Verify stock capacity if OUT movement
      if (data.movementType === 'OUT') {
        const selectedProd = products.find((p) => p.id === data.productId);
        if (selectedProd && selectedProd.currentStock < data.quantityChanged) {
          throw new Error(`Insufficient stock. Current physical stock: ${selectedProd.currentStock} units`);
        }
      }

      const res = await api.post('/stock-movements', data);
      if (res.data.success) {
        showToast('Stock count adjusted successfully');
        setIsModalOpen(false);
        fetchMovements();
        fetchProductOptions(); // refresh stock numbers
      }
    } catch (err: any) {
      showToast(err.message || 'Error recording stock adjustment', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const isWarehouseUser = user?.role === 'ADMIN' || user?.role === 'WAREHOUSES';

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
          <h1 className="text-xl font-bold tracking-tight">Stock Movements Ledger</h1>
          <p className="text-xs text-slate-400">Audit trail of all inventory updates, imports, exports, and manual stock reconciliation</p>
        </div>
        {isWarehouseUser && (
          <button
            onClick={openAdjustModal}
            className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Adjust Inventory
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 glass-card rounded-xl">
        <div>
          <select
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-350 focus:outline-none focus:border-brand-500"
            value={productIdFilter}
            onChange={(e) => setProductIdFilter(e.target.value)}
          >
            <option value="">Filter by Product Spares</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.productName} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-350 focus:outline-none focus:border-brand-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Movement Types</option>
            <option value="IN">IN (Imports/Adjustments)</option>
            <option value="OUT">OUT (Sales/Corrections)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-slate-800/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Qty changed</th>
                <th className="px-6 py-4">Reason / Notes</th>
                <th className="px-6 py-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Fetching movements registry...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    No stock movements logged
                  </td>
                </tr>
              ) : (
                movements.map((move) => (
                  <tr key={move.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(move.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{move.product?.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{move.product?.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                        move.movementType === 'IN'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10'
                          : 'bg-rose-950/70 text-rose-400 border border-rose-500/10'
                      }`}>
                        {move.movementType === 'IN' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {move.movementType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold font-mono text-slate-200">
                      {move.quantityChanged} units
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-350">
                      {move.reason}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <div>{move.createdBy.name}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5 font-mono">{move.createdBy.email}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Stock Adjust Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-xl glass-panel shadow-2xl overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
                <Inbox className="h-5 w-5 text-brand-400" />
                Adjust Stock Level
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Select Product *
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-250 focus:outline-none focus:border-brand-500"
                  {...register('productId', { required: 'Product selection is required' })}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.sku}) | Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Movement Type
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-250 focus:outline-none focus:border-brand-500"
                    {...register('movementType')}
                  >
                    <option value="IN">IN (Stock addition)</option>
                    <option value="OUT">OUT (Stock reduction)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100 font-mono"
                    {...register('quantityChanged', { required: 'Quantity is required', min: 1 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Reason / Adjustment Note *
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                  placeholder="e.g. Audit correction, goods received, damaged stock write off"
                  {...register('reason', { required: 'Reason is required' })}
                />
                {errors.reason && <p className="text-rose-400 text-xs mt-1">{errors.reason.message}</p>}
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
                  Adjust Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

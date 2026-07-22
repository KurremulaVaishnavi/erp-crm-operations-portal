import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Toast, ToastType } from '../components/Toast';
import {
  ArrowLeft,
  Calendar,
  Package,
  Clock,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';

interface StockMovement {
  id: string;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  timestamp: string;
  createdBy: { name: string; email: string };
}

interface Product {
  id: string;
  productName: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStockAlert: number;
  warehouseLocation: string;
  createdAt: string;
  stockMovements: StockMovement[];
}

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const fetchProductDetails = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.product);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load product profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading product information specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 bg-rose-950/30 border border-rose-900/30 rounded-xl text-center">
        <p className="text-rose-300 font-semibold mb-2">Product Not Found</p>
        <Link to="/products" className="text-xs text-brand-400 hover:underline">
          Return to product listings
        </Link>
      </div>
    );
  }

  const isLowStock = product.currentStock <= product.minimumStockAlert;

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
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product Catalog
        </Link>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Info Specs */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-400 shrink-0" />
                {product.productName}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
                SKU: {product.sku}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                isLowStock
                  ? 'bg-rose-950 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isLowStock ? 'LOW STOCK ALERT' : 'IN STOCK'}
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300">
                {product.category}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Catalog Unit Price</p>
              <p className="text-xl font-bold text-slate-200 font-mono">${product.unitPrice.toFixed(2)}</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Current Stock On-Hand</p>
              <p className={`text-xl font-bold font-mono ${isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                {product.currentStock} Units
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Min Threshold Alert</p>
              <p className="text-xl font-bold text-slate-200 font-mono">{product.minimumStockAlert} Units</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm p-4 rounded-lg bg-slate-900 border border-slate-850">
            <MapPin className="h-5 w-5 text-slate-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Warehouse Bin Location</p>
              <p className="text-slate-200 font-semibold mt-0.5">{product.warehouseLocation}</p>
            </div>
          </div>
        </div>

        {/* Stock Status Summary */}
        <div className="glass-card p-6 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-3">
              Stock Audit Summary
            </h3>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Use this ledger to inspect raw inventory status movements. For manually adjusting product counts, use the **Stock Movements** ledger section in the sidebar menu.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-brand-500/5 border border-brand-500/10 text-xs text-brand-300 mt-6">
            <span className="font-bold flex items-center gap-1">
              <Clock className="h-4.5 w-4.5 text-brand-400" />
              Traceability Rule:
            </span>
            <p className="mt-1">All sales confirmations or edits automatically register detailed auditor records.</p>
          </div>
        </div>
      </div>

      {/* Stock movements ledger list */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="h-4.5 w-4.5 text-slate-500" />
          Audited Stock History (Recent logs)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Movement Type</th>
                <th className="px-6 py-3 text-right">Quantity Changed</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {product.stockMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic text-xs">
                    No movements logged for this product
                  </td>
                </tr>
              ) : (
                product.stockMovements.map((move) => (
                  <tr key={move.id} className="hover:bg-slate-900/20">
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">
                      {new Date(move.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                        move.movementType === 'IN'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-rose-950/80 text-rose-400'
                      }`}>
                        {move.movementType === 'IN' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {move.movementType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-bold font-mono">
                      {move.quantityChanged} Units
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-300">
                      {move.reason}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">
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
    </div>
  );
};

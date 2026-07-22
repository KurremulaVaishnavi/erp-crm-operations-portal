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
  Eye,
  X,
  Loader2,
  AlertTriangle,
  Boxes,
  MapPin
} from 'lucide-react';

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
}

export const Products: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      productName: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minimumStockAlert: 5,
      warehouseLocation: '',
    }
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          search,
          lowStock: lowStockFilter ? 'true' : undefined,
        },
      });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading product catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, lowStockFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      productName: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minimumStockAlert: 5,
      warehouseLocation: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    reset({
      productName: prod.productName,
      sku: prod.sku,
      category: prod.category,
      unitPrice: prod.unitPrice,
      currentStock: prod.currentStock,
      minimumStockAlert: prod.minimumStockAlert,
      warehouseLocation: prod.warehouseLocation,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    setModalLoading(true);
    try {
      data.unitPrice = parseFloat(data.unitPrice);
      data.currentStock = parseInt(data.currentStock);
      data.minimumStockAlert = parseInt(data.minimumStockAlert);

      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct.id}`, data);
        if (res.data.success) {
          showToast('Product successfully updated');
          setIsModalOpen(false);
          fetchProducts();
        }
      } else {
        const res = await api.post('/products', data);
        if (res.data.success) {
          showToast('New product added to catalog');
          setIsModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving product records', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) {
        showToast('Product removed from catalog');
        fetchProducts();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
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

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Product Catalog & Inventory</h1>
          <p className="text-xs text-slate-400">Manage items, stock counts, low stock alerts, and warehouse locations</p>
        </div>
        {isWarehouseUser && (
          <button
            onClick={openAddModal}
            className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Filter and search parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 glass-card rounded-xl">
        <div className="relative sm:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search catalog by name, sku, category..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm placeholder-slate-500 text-slate-200 focus:outline-none focus:border-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-400 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded bg-slate-900 border-slate-800 text-brand-500 focus:ring-0 accent-brand-500"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
            />
            Show Low Stock Items Only
          </label>
        </div>
      </div>

      {/* Products table */}
      <div className="glass-card rounded-xl overflow-hidden border border-slate-800/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Item Name / SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Unit Price</th>
                <th className="px-6 py-4 text-center">Available Stock</th>
                <th className="px-6 py-4">Warehouse Bin</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Fetching inventory items...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    No products found matching query
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= p.minimumStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{p.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{p.category}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-200">
                        ${p.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-semibold font-mono">
                          <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                            {p.currentStock} Units
                          </span>
                          {isLow && (
                            <span className="p-0.5 bg-rose-500/10 rounded-full text-rose-400" title="Low stock warning">
                              <AlertTriangle className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          {p.warehouseLocation}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/products/${p.id}`}
                            title="Audit Stock History"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {isWarehouseUser && (
                            <button
                              onClick={() => openEditModal(p)}
                              title="Edit Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              title="Delete Item"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit product modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-xl glass-panel shadow-2xl overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <h3 className="font-bold text-base text-slate-200">
                {editingProduct ? 'Modify Product Specifications' : 'Catalog New Product'}
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
                    Product Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                    placeholder="e.g. Copper Wire spool"
                    {...register('productName', { required: 'Product name is required' })}
                  />
                  {errors.productName && <p className="text-rose-400 text-xs mt-1">{errors.productName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100 font-mono"
                    placeholder="e.g. COP-WIRE-001"
                    {...register('sku', { required: 'Unique SKU is required' })}
                  />
                  {errors.sku && <p className="text-rose-400 text-xs mt-1">{errors.sku.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Category *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                    placeholder="e.g. Electricals"
                    {...register('category', { required: 'Category is required' })}
                  />
                  {errors.category && <p className="text-rose-400 text-xs mt-1">{errors.category.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Unit Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100 font-mono"
                    placeholder="0.00"
                    {...register('unitPrice', { required: 'Price is required', min: 0.01 })}
                  />
                  {errors.unitPrice && <p className="text-rose-400 text-xs mt-1">{errors.unitPrice.type === 'required' ? 'Price is required' : 'Price must be positive'}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Starting Stock Count
                  </label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100 font-mono"
                    placeholder="0"
                    {...register('currentStock')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100 font-mono"
                    placeholder="5"
                    {...register('minimumStockAlert')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Warehouse Bin Loc *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100"
                    placeholder="e.g. Shelf B4"
                    {...register('warehouseLocation', { required: 'Warehouse location is required' })}
                  />
                  {errors.warehouseLocation && <p className="text-rose-400 text-xs mt-1">{errors.warehouseLocation.message}</p>}
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
                  {editingProduct ? 'Save Changes' : 'Catalog Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

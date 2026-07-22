import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Toast, ToastType } from '../components/Toast';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface Customer {
  id: string;
  customerName: string;
  businessName: string;
}

interface Product {
  id: string;
  productName: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

interface ChallanItemInput {
  productId: string;
  quantity: number;
  // Extra client-only helper properties
  productName: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Selected Item details for form builder
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  // Added list of items in draft
  const [challanItems, setChallanItems] = useState<ChallanItemInput[]>([]);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const loadInitialData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
      ]);
      if (custRes.data.success) {
        setCustomers(custRes.data.customers);
        if (custRes.data.customers.length > 0) {
          setSelectedCustomerId(custRes.data.customers[0].id);
        }
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        if (prodRes.data.products.length > 0) {
          setCurrentProductId(prodRes.data.products[0].id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading builder databases', 'error');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleAddItem = () => {
    if (!currentProductId) return;

    const existingItem = challanItems.find((i) => i.productId === currentProductId);
    if (existingItem) {
      showToast('Product already added to list. Edit quantity below or remove first.', 'info');
      return;
    }

    const prod = products.find((p) => p.id === currentProductId);
    if (!prod) return;

    if (prod.currentStock < currentQty) {
      showToast(`Warning: Item stock capacity is only ${prod.currentStock} units`, 'error');
    }

    const newItem: ChallanItemInput = {
      productId: currentProductId,
      quantity: currentQty,
      productName: prod.productName,
      sku: prod.sku,
      unitPrice: prod.unitPrice,
      currentStock: prod.currentStock,
    };

    setChallanItems([...challanItems, newItem]);
    setCurrentQty(1);
  };

  const handleRemoveItem = (prodId: string) => {
    setChallanItems(challanItems.filter((item) => item.productId !== prodId));
  };

  const calculateTotal = () => {
    return challanItems.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
  };

  const handleCreateChallan = async () => {
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return;
    }
    if (challanItems.length === 0) {
      showToast('Challan must contain at least one item', 'error');
      return;
    }

    setLoading(true);
    try {
      const itemsPayload = challanItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const res = await api.post('/challans', {
        customerId: selectedCustomerId,
        items: itemsPayload,
      });

      if (res.data.success) {
        showToast('Sales Challan Draft created successfully');
        navigate(`/challans/${res.data.challan.id}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating challan draft', 'error');
    } finally {
      setLoading(false);
    }
  };

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
          to="/challans"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Challans Registry
        </Link>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Configuration Setup Form */}
        <div className="w-full xl:w-[400px] space-y-6">
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-350 border-b border-slate-800 pb-2">
              Challan Specifications
            </h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Target CRM Customer *
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} ({c.businessName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Item form */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-350 border-b border-slate-800 pb-2">
              Add Item to Challan
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Inventory Product SKU *
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
                value={currentProductId}
                onChange={(e) => setCurrentProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productName} ({p.sku}) | Stock: {p.currentStock}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Order Quantity *
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-brand-500 text-slate-100 font-mono"
                value={currentQty}
                onChange={(e) => setCurrentQty(parseInt(e.target.value) || 1)}
              />
            </div>

            <button
              onClick={handleAddItem}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-semibold border border-slate-700 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add Product Line
            </button>
          </div>
        </div>

        {/* Selected products listing summary */}
        <div className="flex-1 glass-card p-6 rounded-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-3">
              Challan Invoice Item Lines
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5">Product Name</th>
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-center">Quantity</th>
                    <th className="py-2.5 text-right">Subtotal</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {challanItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic text-xs">
                        Add product items from the builder menu to start building the invoice.
                      </td>
                    </tr>
                  ) : (
                    challanItems.map((item) => {
                      const isStockInsuff = item.currentStock < item.quantity;
                      return (
                        <tr key={item.productId} className="hover:bg-slate-900/20">
                          <td className="py-3 font-semibold text-slate-200">
                            {item.productName}
                          </td>
                          <td className="py-3 font-mono text-slate-400 text-xs">
                            {item.sku}
                          </td>
                          <td className="py-3 text-right font-mono text-slate-300">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-semibold font-mono">
                              {item.quantity}
                              {isStockInsuff && (
                                <span className="p-0.5 bg-rose-500/10 rounded-full text-rose-455" title={`Low stock: available ${item.currentStock}`}>
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right font-bold font-mono text-slate-200">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleRemoveItem(item.productId)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing totals and actions footer */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-400">Total Invoice Value: </span>
              <span className="text-2xl font-bold font-mono text-brand-300 ml-2">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCreateChallan}
              disabled={loading || challanItems.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving draft...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Challan Draft
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

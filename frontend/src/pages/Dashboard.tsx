import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Package,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Inbox,
  Clock,
  Boxes
} from 'lucide-react';

interface DashboardStats {
  metrics: {
    totalCustomers: number;
    activeCustomers: number;
    totalProducts: number;
    totalStock: number;
    totalChallans: number;
    lowStockProducts: number;
  };
  recentActivities: {
    recentCustomers: Array<{
      id: string;
      customerName: string;
      businessName: string;
      status: string;
      createdAt: string;
    }>;
    recentStockMovements: Array<{
      id: string;
      quantityChanged: number;
      movementType: 'IN' | 'OUT';
      reason: string;
      timestamp: string;
      product: { productName: string; sku: string };
      createdBy: { name: string };
    }>;
    recentChallans: Array<{
      id: string;
      challanNumber: string;
      createdDate: string;
      status: string;
      customer: { customerName: string; businessName: string };
      createdBy: { name: string };
    }>;
  };
  charts: {
    customerDistribution: Array<{ status: string; count: number }>;
    stockOverview: Array<{ productName: string; currentStock: number; minimumStockAlert: number }>;
  };
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.data.success) {
          setStats(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading operations dashboard...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-950/30 border border-rose-900/30 rounded-xl text-center">
        <p className="text-rose-300 font-semibold mb-2">Error Loading Dashboard</p>
        <p className="text-xs text-rose-400">{error || 'Please check backend connection'}</p>
      </div>
    );
  }

  const { metrics, recentActivities, charts } = stats;

  const role = user?.role || 'SALES';
  const showCRM = role === 'ADMIN' || role === 'SALES' || role === 'ACCOUNTS';
  const showInventory = role === 'ADMIN' || role === 'WAREHOUSES' || role === 'ACCOUNTS';
  const showChallans = role === 'ADMIN' || role === 'SALES' || role === 'ACCOUNTS';
  const showStockMovements = role === 'ADMIN' || role === 'WAREHOUSES' || role === 'ACCOUNTS';

  // Count active recent columns to adjust layout grid dynamically
  const visibleRecentCols = [showCRM, showStockMovements, showChallans].filter(Boolean).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="p-4 rounded-xl glass-panel border border-brand-500/20 bg-brand-500/5">
        <h3 className="text-sm font-bold text-slate-200">
          Welcome back, {user?.name}!
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          You are logged in as <span className="font-bold text-brand-300 uppercase">{role}</span>. Showing your specialized operations console.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
        {/* Total Customers */}
        {showCRM && (
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <Users className="h-20 w-20" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total CRM Leads</span>
              <div className="p-1.5 bg-brand-500/10 text-brand-400 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{metrics.totalCustomers}</h3>
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                <TrendingUp className="h-3 w-3" />
                {metrics.activeCustomers} Active
              </p>
            </div>
          </div>
        )}

        {/* Active Customers */}
        {showCRM && (
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Customers</span>
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-emerald-300">{metrics.activeCustomers}</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Active accounts placing orders
              </p>
            </div>
          </div>
        )}

        {/* Total Products */}
        {showInventory && (
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">SKU Catalog</span>
              <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{metrics.totalProducts}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Unique item listings</p>
            </div>
          </div>
        )}

        {/* Total Stock */}
        {showInventory && (
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Inventory Stock</span>
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{metrics.totalStock}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Total physical units</p>
            </div>
          </div>
        )}

        {/* Total Challans */}
        {showChallans && (
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sales Challans</span>
              <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{metrics.totalChallans}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Total orders processed</p>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {showInventory && (
          <div className={`glass-card p-5 rounded-xl flex flex-col justify-between relative overflow-hidden border ${
            metrics.lowStockProducts > 0 ? 'border-rose-500/20 bg-rose-950/10' : 'border-slate-800/60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Low Stock SKUs</span>
              <div className={`p-1.5 rounded-lg ${metrics.lowStockProducts > 0 ? 'bg-rose-500/15 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${metrics.lowStockProducts > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                {metrics.lowStockProducts}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {metrics.lowStockProducts > 0 ? 'Action required immediately' : 'Inventory levels healthy'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Visual Analytics & Custom Charts */}
      {(showCRM || showInventory) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Distribution Chart */}
          {showCRM && (
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-slate-300">Customer CRM Funnel</h4>
              <div className="space-y-4">
                {charts.customerDistribution.map((item) => {
                  const total = charts.customerDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
                  const percent = Math.round((item.count / total) * 100);
                  const barColors: Record<string, string> = {
                    LEAD: 'bg-brand-500',
                    ACTIVE: 'bg-emerald-500',
                    INACTIVE: 'bg-slate-600',
                  };
                  return (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400 uppercase tracking-wider">{item.status}</span>
                        <span>{item.count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${barColors[item.status] || 'bg-slate-400'} rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Levels Chart */}
          {showInventory && (
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-slate-300">Top Physical Inventory items</h4>
              <div className="space-y-3.5">
                {charts.stockOverview.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No products available in catalog</p>
                ) : (
                  charts.stockOverview.map((prod) => {
                    const maxStock = Math.max(...charts.stockOverview.map(p => p.currentStock), 10);
                    const percent = Math.round((prod.currentStock / maxStock) * 100);
                    const isLow = prod.currentStock <= prod.minimumStockAlert;
                    return (
                      <div key={prod.productName} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[200px]">{prod.productName}</span>
                          <span className={`font-semibold ${isLow ? 'text-rose-400' : 'text-brand-300'}`}>
                            {prod.currentStock} Units {isLow && '(Low)'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-rose-500' : 'bg-brand-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Sections */}
      {visibleRecentCols > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${visibleRecentCols} gap-6`}>
          {/* Recent Customers */}
          {showCRM && (
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-300">Recent CRM Leads</h4>
                <Users className="h-4 w-4 text-slate-500" />
              </div>
              <div className="divide-y divide-slate-800/60">
                {recentActivities.recentCustomers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No customer data</p>
                ) : (
                  recentActivities.recentCustomers.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{c.customerName}</p>
                        <p className="text-slate-500 text-[10px]">{c.businessName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        c.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recent Stock Movements */}
          {showStockMovements && (
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-300">Recent Stock Movements</h4>
                <Inbox className="h-4 w-4 text-slate-500" />
              </div>
              <div className="divide-y divide-slate-800/60">
                {recentActivities.recentStockMovements.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No stock movement logged</p>
                ) : (
                  recentActivities.recentStockMovements.map((sm) => (
                    <div key={sm.id} className="py-3 flex justify-between items-start text-xs">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-200">{sm.product.productName}</p>
                        <p className="text-slate-500 text-[10px]">{sm.reason}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          sm.movementType === 'IN' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950/80'
                        }`}>
                          {sm.movementType === 'IN' ? '+' : '-'}{sm.quantityChanged}
                        </span>
                        <p className="text-[9px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(sm.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recent Challans */}
          {showChallans && (
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-300">Recent Sales Challans</h4>
                <FileSpreadsheet className="h-4 w-4 text-slate-500" />
              </div>
              <div className="divide-y divide-slate-800/60">
                {recentActivities.recentChallans.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No challans processed</p>
                ) : (
                  recentActivities.recentChallans.map((ch) => (
                    <div key={ch.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{ch.challanNumber}</p>
                        <p className="text-slate-500 text-[10px]">{ch.customer.customerName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          ch.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                            : ch.status === 'DRAFT'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                        }`}>
                          {ch.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

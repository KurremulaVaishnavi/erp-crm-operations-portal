import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Products } from './pages/Products';
import { ProductDetails } from './pages/ProductDetails';
import { StockMovements } from './pages/StockMovements';
import { Challans } from './pages/Challans';
import { CreateChallan } from './pages/CreateChallan';
import { ChallanDetails } from './pages/ChallanDetails';
import { Profile } from './pages/Profile';

// Guard for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Operations Views */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard index */}
        <Route index element={<Dashboard />} />

        {/* CRM module */}
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
              <CustomerDetails />
            </ProtectedRoute>
          }
        />

        {/* Products inventory catalog */}
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />

        {/* Stock auditing Movements */}
        <Route
          path="stock"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSES']}>
              <StockMovements />
            </ProtectedRoute>
          }
        />

        {/* Sales Challans */}
        <Route path="challans" element={<Challans />} />
        <Route
          path="challans/new"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
              <CreateChallan />
            </ProtectedRoute>
          }
        />
        <Route path="challans/:id" element={<ChallanDetails />} />

        {/* Account profile settings */}
        <Route path="profile" element={<Profile />} />

        {/* Catch-all redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

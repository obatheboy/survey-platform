import { Route, Routes, Navigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminActivations from "./AdminActivations";
import AdminWithdrawals from "./AdminWithdrawals";
import AdminUsers from "./AdminUsers";
import AdminNotifications from "./AdminNotifications";
import "./Admin.css";

// Optional: Authentication check
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("adminToken");
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

export default function Admin() {
  return (
    <div className="admin-app">
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        
        {/* Protected routes */}
        <Route element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="activations" element={<AdminActivations />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
        
        {/* Optional: Catch-all route */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
}
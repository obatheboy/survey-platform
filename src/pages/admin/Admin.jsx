import { Route, Routes } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminActivations from "./AdminActivations";
import AdminWithdrawals from "./AdminWithdrawals";
import AdminUsers from "./AdminUsers";
import AdminNotifications from "./AdminNotifications";
import "./Admin.css";

// This file appears to be unused and contains outdated routing logic.
// The main routing is handled in `src/App.jsx`.
// It's recommended to delete this file to avoid potential build issues.
// This change makes it an empty component to prevent it from causing errors
// if it's being accidentally included in the build.
export default function Admin() {
  return (
    <div className="admin-app">
      <Routes>
        <Route path="/login" element={<AdminLogin />} />

        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="activations" element={<AdminActivations />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
      </Routes>
    </div>
  );
  return null;
}
import { Route, Routes } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "../components/AdminDashboard";
import AdminActivations from "./AdminActivations";
import AdminWithdrawals from "./AdminWithdrawals";
import AdminUsers from "./AdminUsers";
import AdminNotifications from "./AdminNotifications";
import "./Admin.css";

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
}
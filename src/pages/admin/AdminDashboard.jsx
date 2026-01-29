import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import "./AdminDashboard.css";

const StatCard = ({ title, value, icon, color, loading }) => (
  <div className="stat-card" style={{ '--card-color': color }}>
    <div className="stat-icon" style={{ background: `${color}33` }}>{icon}</div>
    <div className="stat-info">
      <h3 className="stat-title">{title}</h3>
      {loading ? (
        <div className="skeleton-loader" style={{ height: '28px', width: '80px' }}></div>
      ) : (
        <p className="stat-value">{value}</p>
      )}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWithdrawals: 0,
    totalRevenue: 0,
    pendingActivations: 0,
    pendingWithdrawals: 0,
    surveysCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const res = await adminApi.get("/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
        setError("Could not load dashboard statistics. Please try again later.");
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchStats(true); // Initial load
    const interval = setInterval(() => fetchStats(false), 30000); // Subsequent polls

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="admin-error-container">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Real-time overview of the Survey Platform.</p>
      </header>

      <div className="stats-grid-container">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon="👥"
          color="#3b82f6"
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={`KES ${stats.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="#10b981"
          loading={loading}
        />
        <StatCard
          title="Total Withdrawals"
          value={`KES ${stats.totalWithdrawals.toLocaleString()}`}
          icon="💸"
          color="#8b5cf6"
          loading={loading}
        />
        <StatCard
          title="Surveys Completed"
          value={stats.surveysCompleted.toLocaleString()}
          icon="📝"
          color="#ef4444"
          loading={loading}
        />
        <StatCard
          title="Pending Activations"
          value={stats.pendingActivations.toLocaleString()}
          icon="⏳"
          color="#f59e0b"
          loading={loading}
        />
        <StatCard
          title="Pending Withdrawals"
          value={stats.pendingWithdrawals.toLocaleString()}
          icon="📤"
          color="#f43f5e"
          loading={loading}
        />
      </div>

      <div className="admin-dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
           <a href="/admin/activations" className="quick-action-btn">Manage Activations</a>
           <a href="/admin/withdrawals" className="quick-action-btn">Manage Withdrawals</a>
           <a href="/admin/users" className="quick-action-btn">View Users</a>
        </div>
      </div>
    </div>
  );
}

import { adminApi } from "../../api/adminApi";
import "./Admin.css";
import { useAdminTable } from "./hooks/useAdminTable";
import AdminTableLayout from "./components/AdminTableLayout";
import ActionButtons from "./components/ActionButtons";
import StatusBadge from "./components/StatusBadge";

const filterConfig = {
  all: { label: 'All', value: 'all' },
  processing: { label: 'Processing', value: 'PROCESSING' },
  approved: { label: 'Approved', value: 'APPROVED' },
  rejected: { label: 'Rejected', value: 'REJECTED' },
};

const statusMap = {
  PROCESSING: { label: '⏳ PENDING', className: 'processing-badge' },
  APPROVED: { label: '✅ APPROVED', className: 'approved-badge' },
  REJECTED: { label: '❌ REJECTED', className: 'rejected-badge' },
};

export default function AdminWithdrawals() {
  const {
    items: withdrawals,
    loading,
    error,
    processingId,
    successMessage,
    setSuccessMessage,
    failureMessage,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    approveItem,
    rejectItem,
    filteredItems: filteredWithdrawals,
  } = useAdminTable({
    fetchData: () => adminApi.get('/withdraw/admin/all'),
    approveData: (id) => adminApi.patch(`/withdraw/admin/${id}/approve`),
    rejectData: (id) => adminApi.patch(`/withdraw/admin/${id}/reject`),
    searchFields: ['full_name', 'phone_number', 'email'],
    filterConfig,
    initialFilterStatus: 'processing',
  });

  const handleApprove = (id) => {
    approveItem(id, () => {
      setSuccessMessage('✅ Withdrawal approved! Payment will be processed.');
    }, 'Approve this withdrawal?');
  };

  const handleReject = (id) => {
    rejectItem(id, 'Reject this withdrawal and refund user?');
  };

  return (
    <AdminTableLayout
      header={{
        title: '💰 Withdrawal Requests Dashboard',
        stats: (items) =>
          `Total: ${items.length} | Pending: ${
            items.filter((w) => w.status === 'PROCESSING').length
          } | Approved: ${
            items.filter((w) => w.status === 'APPROVED').length
          }`,
        loadingText: 'Loading withdrawals...',
      }}
      filterConfig={filterConfig}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      searchInputPlaceholder="🔍 Search by name, phone, or email..."
      successMessage={successMessage}
      failureMessage={failureMessage}
      loading={loading}
      error={error}
      items={filteredWithdrawals}
    >
      {filteredWithdrawals.length === 0 ? (
        <p className="no-results">No withdrawals found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Gross (KES)</th>
                <th>Fee (KES)</th>
                <th>Net (KES)</th>
                <th>Type</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((w) => (
                <tr key={w.id}>
                  <td>{w.full_name || "—"}</td>
                  <td>{w.phone_number}</td>
                  <td>{w.email || "—"}</td>
                  <td>
                    <strong>{Number(w.amount).toLocaleString()}</strong>
                  </td>
                  <td>{Number(w.fee).toLocaleString()}</td>
                  <td>
                    <strong style={{ color: "#0a7c4a", fontSize: "16px" }}>
                      {Number(w.net_amount).toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <span className="type-badge">
                      {w.type === "normal" ? "💵 Normal" : "🎁 Bonus"}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={w.status} statusMap={statusMap} />
                  </td>
                  <td>
                    {new Date(w.created_at).toLocaleDateString()} <br />
                    <small>{new Date(w.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <ActionButtons
                        item={w}
                        processingId={processingId}
                        onApprove={() => handleApprove(w.id)}
                        onReject={() => handleReject(w.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminTableLayout>
  );
}

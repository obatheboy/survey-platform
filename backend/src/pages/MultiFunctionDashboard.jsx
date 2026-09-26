import { useNavigate } from "react-router-dom";

export default function MultiFunctionDashboard() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: "20px" }}>
      <h1>Multi Function Dashboard</h1>
      <p style={{ color: "#666" }}>This page is under construction.</p>
      <button onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
    </div>
  );
}
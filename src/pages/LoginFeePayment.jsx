import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginFeePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const pendingUser = JSON.parse(localStorage.getItem("pendingLoginUser") || "{}");
  const userId = location.state?.userId || pendingUser.id;
  const phone = location.state?.phone || pendingUser.phone;

  useEffect(() => {
    // Auto-login without payment - login is FREE
    const autoLogin = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone || pendingUser.phone })
        });
        
        const data = await response.json();
        
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("lastLoginTime", Date.now().toString());
          localStorage.removeItem("pendingLoginUser");
          localStorage.removeItem("pendingLoginFeeApproval");

          // Check if user has completed onboarding surveys
          if (!data.user?.survey_onboarding_completed) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          // Fallback - go to login page
          navigate("/auth?mode=login", { replace: true });
        }
      } catch (error) {
        console.error("Auto-login error:", error);
        navigate("/auth?mode=login", { replace: true });
      }
    };
    
    autoLogin();
  }, [navigate, userId, phone, pendingUser]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1e293b"
    }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(255,255,255,0.3)",
          borderTopColor: "#00A859",
          borderRadius: "50%",
          margin: "0 auto 16px",
          animation: "spin 1s linear infinite"
        }}></div>
        <p>Login is FREE! Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
import { Outlet } from "react-router-dom";
import PrimaryNav from "./components/PrimaryNav";

/*
  ============================
  USER LAYOUT
  ============================
  Responsibilities:
  - Structural wrapper for user app
  - Mount navigation (single source)
  - No business logic
*/

export default function UserLayout() {
  return (
    <div className="user-app-root">
      {/* PRIMARY NAVIGATION */}
      <PrimaryNav />

      {/* PAGE CONTENT */}
      <main className="user-app-content">
        <Outlet />
      </main>
    </div>
  );
}

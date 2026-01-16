import { NavLink, useLocation } from "react-router-dom";

/*
  ============================
  PRIMARY NAVIGATION (v2)
  ============================
  Principles:
  - ONE highlighted action at a time
  - Visual state derived from route
  - No business logic
  - Mobile-first clarity
*/

export default function PrimaryNav() {
  const { pathname } = useLocation();

  /*
    PRIMARY ACTION RESOLUTION
    -------------------------
    Exactly ONE primary route at all times
  */
  const primaryRoute = (() => {
    if (pathname.startsWith("/surveys")) return "/surveys";
    if (pathname.startsWith("/activate")) return "/activate";
    if (pathname.startsWith("/withdraw")) return "/withdraw";
    return "/dashboard";
  })();

  const linkClass = (route) =>
    route === primaryRoute
      ? "nav-link nav-primary"
      : "nav-link";

  return (
    <nav className="primary-nav">
      <ul className="primary-nav-list">
        <li>
          <NavLink to="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </NavLink>
        </li>

        <li>
          <NavLink to="/surveys" className={linkClass("/surveys")}>
            Surveys
          </NavLink>
        </li>

        <li>
          <NavLink to="/activate" className={linkClass("/activate")}>
            Activate
          </NavLink>
        </li>

        <li>
          <NavLink to="/withdraw" className={linkClass("/withdraw")}>
            Withdraw
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

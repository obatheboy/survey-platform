import { useNavigate, useLocation } from 'react-router-dom';

const ORANGE = '#f59e0b';
const ORANGE_LIGHT = '#fbbf24';
const ORANGE_BG = 'rgba(245, 158, 11, 0.15)';
const ORANGE_BG_ACTIVE = 'rgba(245, 158, 11, 0.25)';
const ORANGE_SHADOW = 'rgba(245, 158, 11, 0.4)';

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    path: '/dashboard',
    show: true
  },
  {
    id: 'surveys',
    label: 'Surveys',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    path: '/surveys',
    show: true,
    action: () => {
      const element = document.getElementById('surveys-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
    path: '/withdraw-form',
    show: true
  },
  {
    id: 'activate',
    label: 'Activate',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
      </svg>
    ),
    path: '/activate',
    show: true
  },
  {
    id: 'affiliate',
    label: 'Earn More',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
      </svg>
    ),
    path: '/affiliate',
    show: true
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    ),
    isMenu: true,
    show: true
  }
];

export default function BottomNavigation({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (item) => {
    if (item.isMenu) {
      const event = new CustomEvent('open-main-menu');
      window.dispatchEvent(event);
      return;
    }
    if (item.action) {
      item.action();
      return;
    }
    if (item.path) {
      navigate(item.path);
    }
  };

  const isActive = (item) => {
    if (item.isMenu) return false;
    if (item.path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.hash;
    }
    return location.pathname.startsWith(item.path);
  };

  const getButtonStyle = (active) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    background: active ? ORANGE_BG_ACTIVE : 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 4px',
    position: 'relative',
    color: ORANGE,
    transition: 'all 0.2s ease',
    minHeight: '64px',
    WebkitTapHighlightColor: 'transparent',
    fontWeight: 700,
    textDecoration: 'none',
  });

  const getTopBarStyle = (active) => ({
    content: '""',
    position: 'absolute',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: active ? '100%' : '0',
    height: '3px',
    background: `linear-gradient(90deg, ${ORANGE_LIGHT}, ${ORANGE})`,
    borderRadius: '0 0 9999px 9999px',
    transition: 'width 0.3s ease',
  });

  const getIndicatorStyle = (active) => ({
    position: 'absolute',
    bottom: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '4px',
    height: '4px',
    background: ORANGE,
    borderRadius: '50%',
    opacity: active ? 1 : 0,
    transition: 'opacity 0.3s ease',
  });

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `1px solid ${ORANGE_BG}`,
      boxShadow: `0 -4px 24px ${ORANGE_SHADOW}`,
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        maxWidth: '600px',
        margin: '0 auto',
        height: '64px',
      }}>
        {NAV_ITEMS.filter(item => item.show).map((item, index) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              aria-label={item.label}
              style={{
                ...getButtonStyle(active),
                animationDelay: `${index * 50}ms`,
                opacity: 0,
                animation: `fadeInUp 0.4s ease-out ${index * 50}ms forwards`,
              }}
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease',
                transform: active ? 'scale(1.15)' : 'scale(1)',
                width: '24px',
                height: '24px',
              }}>
                {active ? item.activeIcon : item.icon}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                opacity: active ? 1 : 0.85,
              }}>
                {item.label}
              </span>
              <span style={getIndicatorStyle(active)} />
              <style>{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

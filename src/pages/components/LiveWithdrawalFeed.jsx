import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/* =========================
   CONSTANTS
========================= */
const KENYA_FLAG =
  "https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Kenya.svg";

/* =========================
   REALISTIC DATA - Memoized
========================= */
const useData = () => useMemo(() => ({
  NAMES: [
    "James M.", "Brian K.", "Kevin O.", "Mary W.", "Lucy N.", "John M.", "Sarah A.", 
    "Michael T.", "Faith W.", "Daniel K.", "Grace M.", "Peter O.", "Ann W.", 
    "Victor K.", "Joseph N.", "Mercy A.", "Paul M.", "Irene K.", "Samuel T.", 
    "Joy W.", "Dennis M.", "Brenda K.", "Collins O.", "Ruth M.", "Stephen N.", 
    "Naomi W.", "Eric K.", "Susan M.", "George T.", "Linda K.", "Allan W.", 
    "Janet M.", "Frank K.", "Alice T.", "Martin O.", "Agnes M.", "Chris N.", 
    "Nancy K.", "Isaac M.", "Sharon W.", "Felix K.", "Dorcas M.", "Henry T.", 
    "Monica W.", "Nelson K.", "Carol M.", "Patricia W.", "Elijah K.", "Winnie M."
  ],
  
  AMOUNTS: [
    1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800,
    1850, 1900, 1950, 2000, 2050, 2100, 2150, 2200, 2250, 2300, 2350, 2400, 2450,
    2500, 2550, 2600, 2650, 2700, 2750, 2800, 2850, 2900, 2950, 3000
  ],
  
  LOCATIONS: [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Kisii",
    "Meru", "Nyeri", "Machakos", "Kitale", "Kakamega", "Bungoma", "Garissa",
    "Malindi", "Naivasha", "Kitui", "Kericho", "Bomet", "Narok", "Kilifi"
  ],
  
  TELCOS: [
    {
      name: "Safaricom",
      color: "#1b5e20",
      light: "#e8f5e9",
      border: "#a5d6a7",
      badge: "M-PESA",
      pulse: "mpesaPulse",
      percentage: 85,
    },
    {
      name: "Airtel",
      color: "#c62828",
      light: "#fdecea",
      border: "#ef9a9a",
      badge: "Airtel Money",
      pulse: "airtelPulse",
      percentage: 15,
    },
  ],
  
  STATUSES: [
    { text: "✔ Success", color: "#2e7d32", icon: "✅" },
    { text: "💰 Processed", color: "#1976d2", icon: "💸" },
    { text: "🎉 Received", color: "#7b1fa2", icon: "🎊" },
    { text: "⚡ Instant", color: "#ff9800", icon: "⚡" },
    { text: "🔓 Activated", color: "#0097a7", icon: "🔓" },
  ],
  
  TIME_CATEGORIES: {
    morning: { start: 6, end: 11, label: "🌅", frequency: 1.5 },
    afternoon: { start: 12, end: 17, label: "☀️", frequency: 1.2 },
    evening: { start: 18, end: 22, label: "🌙", frequency: 1.8 },
    night: { start: 23, end: 5, label: "🌃", frequency: 0.8 },
  }
}), []);

/* =========================
   HELPERS - Memoized
========================= */
const useHelpers = () => {
  const data = useData();
  
  const helpers = useMemo(() => ({
    randomPhone: () => {
      const prefix = Math.random() > 0.5 ? "07" : "01";
      return `${prefix}${Math.floor(10000000 + Math.random() * 90000000)}`.replace(
        /(\d{4})\d{3}(\d{2})/,
        "$1***$2"
      );
    },
    
    initials: (name) => name.split(" ")[0].slice(0, 2).toUpperCase(),
    
    getTimeCategory: () => {
      const hour = new Date().getHours();
      for (const [key, value] of Object.entries(data.TIME_CATEGORIES)) {
        if (value.start <= value.end) {
          if (hour >= value.start && hour <= value.end) return key;
        } else {
          if (hour >= value.start || hour <= value.end) return key;
        }
      }
      return "morning";
    },
    
    getRandomTelco: () => {
      const rand = Math.random() * 100;
      let cumulative = 0;
      for (const telco of data.TELCOS) {
        cumulative += telco.percentage;
        if (rand <= cumulative) return telco;
      }
      return data.TELCOS[0];
    },
    
    getRealisticAmount: () => {
      const hour = new Date().getHours();
      
      // Optimized: Use cached filtered arrays
      if (hour >= 6 && hour <= 11) {
        // Morning: Mostly 1200-2000
        const morningAmounts = data.AMOUNTS.filter(amt => amt <= 2000);
        return morningAmounts[Math.floor(Math.random() * morningAmounts.length)];
      } else if (hour >= 18 && hour <= 23) {
        // Evening: More 2000-3000
        const eveningAmounts = data.AMOUNTS.filter(amt => amt >= 2000);
        return eveningAmounts[Math.floor(Math.random() * eveningAmounts.length)];
      } else {
        // Afternoon/Night: Mixed
        return data.AMOUNTS[Math.floor(Math.random() * data.AMOUNTS.length)];
      }
    },
  }), [data]);

  return helpers;
};

/* =========================
   INITIAL ITEM GENERATOR
========================= */
const generateInitialItem = (data, helpers) => {
  const name = data.NAMES[Math.floor(Math.random() * data.NAMES.length)];
  const telco = helpers.getRandomTelco();
  const status = data.STATUSES[Math.floor(Math.random() * data.STATUSES.length)];
  const location = data.LOCATIONS[Math.floor(Math.random() * data.LOCATIONS.length)];
  const timeCategory = helpers.getTimeCategory();
  
  return {
    id: Date.now(),
    name,
    phone: helpers.randomPhone(),
    amount: helpers.getRealisticAmount(),
    avatar: helpers.initials(name),
    telco,
    status,
    location,
    timeCategory,
    timestamp: new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }).replace(/^0/, ''),
  };
};

/* =========================
   COMPONENT - Mobile Optimized
========================= */
export default function LiveWithdrawalFeed() {
  const data = useData();
  const helpers = useHelpers();
  
  // Initialize with initial item to avoid synchronous setState in effect
  const [item, setItem] = useState(() => generateInitialItem(data, helpers));
  const [items, setItems] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(() => helpers.getTimeCategory());
  const [isMobile, setIsMobile] = useState(false);
  
  // Use refs for performance
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0); // Fixed: Initialize as 0, not Date.now()

  // Check if mobile on mount
  useEffect(() => {
    // Initialize the timestamp ref
    lastUpdateTimeRef.current = Date.now();
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Memoized styles for better performance
  const styles = useMemo(() => ({
    container: {
      margin: "4px 0",
      padding: "0 4px",
      willChange: "transform",
      backfaceVisibility: "hidden",
    },
    
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "4px",
    },
    
    liveIndicator: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: isMobile ? "11px" : "12px",
      fontWeight: 800,
      color: "#d32f2f",
      textTransform: "uppercase",
      letterSpacing: "0.3px",
    },
    
    liveDot: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: "#d32f2f",
      animation: "livePulse 1.5s infinite",
      flexShrink: 0,
    },
    
    timeLabel: {
      fontSize: isMobile ? "10px" : "11px",
      color: "#666",
      fontWeight: 600,
    },
    
    card: {
      padding: "8px 10px",
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      position: "relative",
      marginBottom: "4px",
      willChange: "transform",
      transform: "translateZ(0)",
      WebkitFontSmoothing: "antialiased",
    },
    
    liveBadge: {
      position: "absolute",
      top: "-6px",
      right: "8px",
      background: "linear-gradient(135deg, #ff6b6b, #d32f2f)",
      color: "#fff",
      fontSize: isMobile ? "9px" : "10px",
      fontWeight: 900,
      padding: "2px 8px",
      borderRadius: 999,
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      zIndex: 1,
    },
    
    flag: {
      width: "18px",
      height: "14px",
      borderRadius: 2,
      border: "1px solid rgba(0,0,0,0.1)",
      flexShrink: 0,
    },
    
    avatar: {
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: "11px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      flexShrink: 0,
    },
    
    nameRow: {
      display: "flex",
      gap: 4,
      alignItems: "center",
      flexWrap: "wrap",
      minHeight: "20px",
    },
    
    nameText: {
      color: "#1a237e",
      fontWeight: 900,
      fontSize: "12px",
      lineHeight: 1.2,
    },
    
    locationText: {
      fontSize: "10px",
      color: "#546e7a",
      fontWeight: 600,
      lineHeight: 1.2,
    },
    
    timeText: {
      fontSize: "9px",
      color: "#78909c",
      marginLeft: "auto",
      flexShrink: 0,
      lineHeight: 1.2,
    },
    
    amountRow: {
      marginTop: 2,
      display: "flex",
      gap: 6,
      alignItems: "center",
      minHeight: "20px",
    },
    
    statusText: {
      fontSize: "10px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: 3,
      lineHeight: 1.2,
    },
    
    amountText: {
      fontSize: "13px",
      fontWeight: 900,
      color: "#b71c1c",
      marginLeft: "auto",
      textShadow: "0 1px 1px rgba(0,0,0,0.1)",
      lineHeight: 1.2,
    },
    
    detailsRow: {
      marginTop: 4,
      display: "flex",
      gap: 6,
      alignItems: "center",
      minHeight: "18px",
    },
    
    telcoBadge: {
      color: "#fff",
      fontSize: "9px",
      fontWeight: 800,
      padding: "2px 8px",
      borderRadius: 999,
      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      lineHeight: 1.2,
    },
    
    phoneText: {
      fontSize: "10px",
      color: "#455a64",
      fontWeight: 600,
      lineHeight: 1.2,
    },
    
    recentContainer: {
      background: "#f8f9fa",
      borderRadius: 10,
      padding: "10px",
      border: "1px solid #e0e0e0",
      transform: "translateZ(0)",
    },
    
    recentHeader: {
      fontSize: isMobile ? "12px" : "13px",
      fontWeight: 800,
      color: "#37474f",
      marginBottom: "8px",
      paddingBottom: "4px",
      borderBottom: "1px solid #e0e0e0",
      lineHeight: 1.2,
    },
    
    recentItemStyle: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 0",
      borderBottom: "1px solid #f0f0f0",
    },
    
    recentAvatar: {
      width: isMobile ? "26px" : "28px",
      height: isMobile ? "26px" : "28px",
      borderRadius: "50%",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: isMobile ? "11px" : "12px",
      flexShrink: 0,
    },
    
    recentName: {
      fontSize: isMobile ? "12px" : "13px",
      fontWeight: 700,
      color: "#263238",
      lineHeight: 1.2,
    },
    
    recentInfo: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "1px",
    },
    
    recentAmount: {
      fontSize: isMobile ? "11px" : "12px",
      fontWeight: 800,
      color: "#d32f2f",
      lineHeight: 1.2,
    },
    
    recentTime: {
      fontSize: isMobile ? "10px" : "11px",
      color: "#78909c",
      fontWeight: 600,
      lineHeight: 1.2,
    },
  }), [isMobile]);

  // Generate new item - memoized callback
  const generateItem = useCallback(() => {
    const now = Date.now();
    
    // Throttle updates on mobile for better performance
    if (isMobile && now - lastUpdateTimeRef.current < 3500) {
      return;
    }
    lastUpdateTimeRef.current = now;

    const name = data.NAMES[Math.floor(Math.random() * data.NAMES.length)];
    const telco = helpers.getRandomTelco();
    const status = data.STATUSES[Math.floor(Math.random() * data.STATUSES.length)];
    const location = data.LOCATIONS[Math.floor(Math.random() * data.LOCATIONS.length)];
    
    const newItem = {
      id: now,
      name,
      phone: helpers.randomPhone(),
      amount: helpers.getRealisticAmount(),
      avatar: helpers.initials(name),
      telco,
      status,
      location,
      timeCategory: currentCategory,
      timestamp: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }).replace(/^0/, ''),
    };

    // Optimized update - batch state changes
    setItems(prev => {
      const newItems = [newItem, ...prev.slice(0, 2)];
      return newItems;
    });
    
    setItem(newItem);

    // Play sound only if not mobile
    if (audioRef.current && !isMobile) {
      audioRef.current.volume = 0.03;
      audioRef.current.play().catch(() => {});
    }
  }, [data, helpers, currentCategory, isMobile]);

  /* SOUND - Only on desktop */
  useEffect(() => {
    if (!isMobile) {
      audioRef.current = new Audio(
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
      );
      audioRef.current.volume = 0.03;
    }
  }, [isMobile]);

  /* LIVE GENERATOR - Optimized for mobile */
  useEffect(() => {
    let intervalId = null;
    
    // Don't generate initial item here - it's already set in useState initializer
    
    // Get time-based interval (slower on mobile)
    const category = data.TIME_CATEGORIES[currentCategory];
    const baseInterval = isMobile ? 5000 : 4000;
    const interval = Math.round(baseInterval / category.frequency);
    
    // Use requestAnimationFrame for smoother updates on mobile
    if (isMobile) {
      const updateWithRAF = () => {
        const now = Date.now();
        if (now - lastUpdateTimeRef.current >= interval) {
          generateItem();
        }
        animationFrameRef.current = requestAnimationFrame(updateWithRAF);
      };
      
      // Start RAF on next frame to avoid synchronous updates
      const startTimeout = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(updateWithRAF);
      }, 0);
      
      return () => {
        clearTimeout(startTimeout);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // Use setTimeout for initial call to avoid synchronous setState
      const initialTimeout = setTimeout(() => {
        intervalId = setInterval(generateItem, interval);
      }, interval);
      
      return () => {
        clearTimeout(initialTimeout);
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [currentCategory, data.TIME_CATEGORIES, generateItem, isMobile]);

  /* CHECK TIME CATEGORY CHANGES - Separate effect */
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newCategory = helpers.getTimeCategory();
      if (newCategory !== currentCategory) {
        setCurrentCategory(newCategory);
      }
    }, isMobile ? 120000 : 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentCategory, helpers, isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const timeCategory = data.TIME_CATEGORIES[item.timeCategory];
  const showRecentTransactions = items.length > 0 && window.innerWidth > 375;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.liveIndicator}>
          <span style={styles.liveDot}></span>
          LIVE WITHDRAWALS
        </span>
        <span style={styles.timeLabel}>
          {timeCategory.label} • {items.length + 1}+ today
        </span>
      </div>

      {/* Current Transaction */}
      <div
        style={{
          ...styles.card,
          background: item.telco.light,
          border: `1px solid ${item.telco.border}`,
          animation: `${item.telco.pulse} 2s infinite`,
        }}
      >
        <span style={styles.liveBadge}>NOW</span>

        <img 
          src={KENYA_FLAG} 
          alt="Kenya" 
          style={styles.flag}
          loading="lazy"
        />

        <div style={{ ...styles.avatar, background: item.telco.color }}>
          {item.avatar}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.nameRow}>
            <strong style={styles.nameText}>{item.name}</strong>
            <span style={styles.locationText}>• {item.location}</span>
            <span style={styles.timeText}>{item.timestamp}</span>
          </div>

          <div style={styles.amountRow}>
            <span style={{ ...styles.statusText, color: item.status.color }}>
              {item.status.icon} {item.status.text}
            </span>
            <span style={styles.amountText}>
              KES {item.amount.toLocaleString()}
            </span>
          </div>

          <div style={styles.detailsRow}>
            <span style={{ ...styles.telcoBadge, background: item.telco.color }}>
              {item.telco.badge}
            </span>
            <span style={styles.phoneText}>{item.phone}</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions - Only show on larger mobile screens */}
      {showRecentTransactions && (
        <div style={styles.recentContainer}>
          <div style={styles.recentHeader}>Recent withdrawals</div>
          {items.slice(0, 2).map((recentItem) => (
            <div key={recentItem.id} style={styles.recentItemStyle}>
              <div style={{ ...styles.recentAvatar, background: recentItem.telco.color }}>
                {recentItem.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.recentName}>{recentItem.name}</div>
                <div style={styles.recentInfo}>
                  <span style={styles.recentAmount}>KES {recentItem.amount.toLocaleString()}</span>
                  <span style={styles.recentTime}>{recentItem.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANIMATIONS */}
      <style>
        {`
          @keyframes mpesaPulse {
            0% { box-shadow: 0 0 0 0 rgba(27,94,32,0.1); }
            50% { box-shadow: 0 0 0 4px rgba(27,94,32,0.05); }
            100% { box-shadow: 0 0 0 0 rgba(27,94,32,0); }
          }

          @keyframes airtelPulse {
            0% { box-shadow: 0 0 0 0 rgba(198,40,40,0.1); }
            50% { box-shadow: 0 0 0 4px rgba(198,40,40,0.05); }
            100% { box-shadow: 0 0 0 0 rgba(198,40,40,0); }
          }

          @keyframes livePulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </div>
  );
}
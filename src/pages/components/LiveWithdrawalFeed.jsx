import { useEffect, useRef, useState } from "react";

/* =========================
   CONSTANTS
========================= */
const KENYA_FLAG =
  "https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Kenya.svg";

/* =========================
   KENYA ONLY DATA
========================= */
const NAMES = [
  "James","Brian","Kevin","Mary","Lucy","John","Sarah","Michael","Faith",
  "Daniel","Grace","Peter","Ann","Victor","Joseph","Mercy","Paul","Irene",
  "Samuel","Joy","Dennis","Brenda","Collins","Ruth","Stephen","Naomi",
  "Eric","Susan","George","Linda","Allan","Janet","Frank","Alice","Martin",
  "Agnes","Chris","Nancy","Isaac","Sharon","Felix","Dorcas","Henry",
  "Monica","Nelson","Carol","Patricia","Elijah","Winnie","Douglas",
  "Rose","Anthony","Ronald","Judith","Caleb","Stella","Samson","Beatrice"
];

const AMOUNTS = [
  1200,1500,1800,2000,2200,2500,3000,3500,
  4000,5000,6000,7500,9200,11200,15600
];

const TELCOS = [
  {
    name: "Safaricom",
    color: "#1b5e20",
    light: "#e8f5e9",
    border: "#a5d6a7",
    badge: "M-PESA",
    pulse: "mpesaPulse",
  },
  {
    name: "Airtel",
    color: "#c62828",
    light: "#fdecea",
    border: "#ef9a9a",
    badge: "Airtel Money",
    pulse: "airtelPulse",
  },
];

/* =========================
   HELPERS
========================= */
const randomPhone = () =>
  `07${Math.floor(10000000 + Math.random() * 90000000)}`.replace(
    /(\d{4})\d{3}(\d{2})/,
    "$1***$2"
  );

const initials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* =========================
   COMPONENT
========================= */
export default function LiveWithdrawalFeed() {
  const [item, setItem] = useState(null);
  const audioRef = useRef(null);

  /* SUBTLE SOUND */
  useEffect(() => {
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
    );
    audioRef.current.volume = 0.12;
  }, []);

  /* LIVE GENERATOR (3.2s) */
  useEffect(() => {
    const generate = () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const telco = TELCOS[Math.floor(Math.random() * TELCOS.length)];

      setItem({
        name,
        phone: randomPhone(),
        amount: AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)],
        avatar: initials(name),
        telco,
      });

      audioRef.current?.play().catch(() => {});
    };

    generate();
    const interval = setInterval(generate, 3200);

    return () => clearInterval(interval);
  }, []);

  if (!item) return null;

  return (
    <div style={wrapper}>
      <div
        style={{
          ...card,
          background: item.telco.light,
          border: `1px solid ${item.telco.border}`,
          animation: `${item.telco.pulse} 1.8s infinite`,
        }}
      >
        {/* LIVE */}
        <span style={liveBadge}>LIVE</span>

        {/* FLAG */}
        <img src={KENYA_FLAG} alt="Kenya" style={flag} />

        {/* AVATAR */}
        <div style={{ ...avatar, background: item.telco.color }}>
          {item.avatar}
        </div>

        {/* DETAILS */}
        <div style={{ flex: 1 }}>
          <div style={nameRow}>
            <strong style={nameText}>{item.name}</strong>
            <span style={phoneText}>({item.phone})</span>
          </div>

          <div style={amountRow}>
            <span style={verified}>✔ Verified withdrawal</span>
            <span style={amountText}>
              KES {item.amount.toLocaleString()}
            </span>
          </div>

          <span style={{ ...telcoBadge, background: item.telco.color }}>
            {item.telco.badge}
          </span>
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>
        {`
          @keyframes mpesaPulse {
            0% { box-shadow: 0 0 0 0 rgba(27,94,32,0.5); }
            70% { box-shadow: 0 0 0 14px rgba(27,94,32,0); }
            100% { box-shadow: 0 0 0 0 rgba(27,94,32,0); }
          }

          @keyframes airtelPulse {
            0% { box-shadow: 0 0 0 0 rgba(198,40,40,0.5); }
            70% { box-shadow: 0 0 0 14px rgba(198,40,40,0); }
            100% { box-shadow: 0 0 0 0 rgba(198,40,40,0); }
          }
        `}
      </style>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const wrapper = {
  position: "sticky",
  top: 62,
  zIndex: 50,
};

const card = {
  marginTop: 10,
  padding: "12px 14px",
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const liveBadge = {
  background: "#d32f2f",
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: 999,
};

const flag = {
  width: 26,
  height: 18,
  borderRadius: 4,
  objectFit: "cover",
  display: "block",
};

const avatar = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
};

/* 🔥 NEW COLOR SYSTEM */
const nameRow = {
  display: "flex",
  gap: 6,
  alignItems: "center",
};

const nameText = {
  color: "#0b1020",
  fontWeight: 800,
};

const phoneText = {
  fontSize: 12,
  color: "#455a64",
};

const amountRow = {
  marginTop: 4,
  display: "flex",
  gap: 6,
  alignItems: "center",
};

const verified = {
  fontSize: 12,
  color: "#2e7d32",
  fontWeight: 600,
};

const amountText = {
  fontSize: 14,
  fontWeight: 800,
  color: "#ff0000ff",
};

const telcoBadge = {
  display: "inline-block",
  marginTop: 6,
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 10px",
  borderRadius: 999,
};

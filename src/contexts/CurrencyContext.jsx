import { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext(null);

export const COUNTRIES = {
  KENYA: "kenya",
  UGANDA: "uganda",
};

export const COUNTRY_CONFIG = {
  [COUNTRIES.KENYA]: {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    symbol: "KES",
    conversionRate: 1,
    phoneRegex: /^(0[17][0-9]{8}|254[17][0-9]{8}|[17][0-9]{9})$/,
    phonePlaceholder: "0712345678",
    minWithdrawal: 100,
    minAffiliateWithdrawal: 50,
    paymentMethod: "mpesa",
    paymentDescription: "M-Pesa STK Push / Lipa Na M-Pesa",
  },
  [COUNTRIES.UGANDA]: {
    code: "UG",
    name: "Uganda",
    currency: "UGX",
    symbol: "UGX",
    conversionRate: 32,
    phoneRegex: /^(\+?256|0)[0-9]{9}$/,
    phonePlaceholder: "0712345678",
    minWithdrawal: 3200,
    minAffiliateWithdrawal: 1600,
    paymentMethod: "send_money",
    paymentDescription: "MTN / Airtel Send Money",
  },
};

export const UGANDA_RECIPIENT = {
  phoneNumber: "254794101450",
  name: "Obadiah Otoki",
};

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export function CurrencyProvider({ children }) {
  const [country, setCountryState] = useState(() => {
    const stored = localStorage.getItem("country");
    return (stored === COUNTRIES.UGANDA || stored === COUNTRIES.KENYA) ? stored : COUNTRIES.KENYA;
  });

  const setCountry = (c) => {
    setCountryState(c);
    localStorage.setItem("country", c);
  };

  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG[COUNTRIES.KENYA];

  const convert = (amount) => Math.round((Number(amount) || 0) * config.conversionRate);
  const format = (amount) => `${config.symbol} ${convert(amount).toLocaleString()}`;
  const formatShort = (amount) => {
    const v = convert(amount);
    if (v >= 1000000) return `${config.symbol} ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${config.symbol} ${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`;
    return `${config.symbol} ${v.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{
      country, setCountry, config, convert, format, formatShort,
      symbol: config.symbol,
      isUganda: country === COUNTRIES.UGANDA,
      isKenya: country === COUNTRIES.KENYA,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export default CurrencyContext;
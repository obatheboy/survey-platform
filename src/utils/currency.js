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
    conversionFrom: "KES",
    phonePrefix: "254",
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
    conversionFrom: "KES",
    phonePrefix: "256",
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

export const getCountry = () => {
  const stored = localStorage.getItem("country");
  if (stored === COUNTRIES.UGANDA || stored === COUNTRIES.KENYA) {
    return stored;
  }
  return COUNTRIES.KENYA;
};

export const setCountry = (country) => {
  localStorage.setItem("country", country);
};

export const getCountryConfig = (country) => {
  return COUNTRY_CONFIG[country] || COUNTRY_CONFIG[COUNTRIES.KENYA];
};

export const convertCurrency = (amount, country) => {
  const config = getCountryConfig(country);
  const numAmount = Number(amount) || 0;
  return Math.round(numAmount * config.conversionRate);
};

export const formatCurrency = (amount, country) => {
  const config = getCountryConfig(country);
  const converted = convertCurrency(amount, country);
  return `${config.symbol} ${converted.toLocaleString()}`;
};

export const formatCurrencyShort = (amount, country) => {
  const config = getCountryConfig(country);
  const converted = convertCurrency(amount, country);
  if (converted >= 1000000) {
    return `${config.symbol} ${(converted / 1000000).toFixed(1)}M`;
  }
  if (converted >= 1000) {
    return `${config.symbol} ${(converted / 1000).toFixed(converted >= 10000 ? 0 : 1)}K`;
  }
  return `${config.symbol} ${converted.toLocaleString()}`;
};

export const getAmount = (amount, country) => convertCurrency(amount, country);
export const getSymbol = (country) => getCountryConfig(country).symbol;
export const getCurrencyCode = (country) => getCountryConfig(country).currency;

export const isKenya = (country) => country === COUNTRIES.KENYA;
export const isUganda = (country) => country === COUNTRIES.UGANDA;
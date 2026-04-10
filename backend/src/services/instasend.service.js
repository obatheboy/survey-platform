const https = require("https");

const INSTASEND_SECRET_KEY = process.env.INSTASEND_SECRET_KEY;
const INSTASEND_PUBLIC_KEY = process.env.INSTASEND_PUBLIC_KEY;
const INSTASEND_ENV = process.env.INSTASEND_ENV || "live";

const BASE_URL = "api.intasend.com";

const formatPhone = (phone) => {
  // Convert to E.164 format: +2547...
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  return '+' + cleaned;
};

const makeRequest = (path, method, data = null) => {
  return new Promise((resolve, reject) => {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${INSTASEND_SECRET_KEY}`
    };

    const options = {
      hostname: BASE_URL,
      path: `/api/v1/${path}`,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          console.log(`IntaSend ${method} ${path} response:`, json);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(json.message || json.error || `Request failed with status ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

exports.createPaymentLink = async (amount, phone, userId, description) => {
  const formattedPhone = formatPhone(phone);
  console.log(`Creating payment for phone: ${formattedPhone}, amount: ${amount}`);
  
  try {
    // Try STK push first using IntaSend's correct endpoint
    const response = await makeRequest("payment/mpesa-stk-push/", "POST", {
      amount: parseInt(amount),
      phone_number: formattedPhone,
      currency: "KES",
      api_ref: `fee_${userId}_${Date.now()}`
    });
    console.log("STK Push response:", response);
    return response;
  } catch (error) {
    console.error("STK push failed:", error.message);
    
    // Fallback to checkout with M-PESA method
    try {
      const response = await makeRequest("checkout/", "POST", {
        amount: parseInt(amount),
        currency: "KES",
        phone_number: formattedPhone,
        method: "M-PESA",
        redirect_url: `${process.env.FRONTEND_URL}/login-fee-callback`,
        api_ref: `fee_${userId}_${Date.now()}`,
        description: description || "SurveyEarn Login Fee - KES 100"
      });
      console.log("Checkout response:", response);
      return response;
    } catch (checkoutError) {
      console.error("Checkout also failed:", checkoutError.message);
      throw checkoutError;
    }
  }
};

exports.verifyPayment = async (checkoutId) => {
  try {
    const response = await makeRequest(`checkout/${checkoutId}/`, "GET");
    return response;
  } catch (error) {
    console.error("IntaSend verify payment error:", error);
    throw error;
  }
};

exports.getPublicKey = () => {
  return INSTASEND_PUBLIC_KEY;
};

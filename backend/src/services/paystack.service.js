const https = require("https");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = "api.paystack.co";

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
    if (!PAYSTACK_SECRET_KEY) {
      reject(new Error("PAYSTACK_SECRET_KEY is not configured"));
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`
    };

    const options = {
      hostname: BASE_URL,
      path: path,
      method: method,
      headers: headers
    };

    console.log(`Paystack request: ${method} ${path}`, { 
      hasData: !!data,
      keyPrefix: PAYSTACK_SECRET_KEY ? PAYSTACK_SECRET_KEY.substring(0, 15) + "..." : "none"
    });

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        console.log(`Paystack response status: ${res.statusCode}`);
        try {
          const json = JSON.parse(body);
          console.log(`Paystack ${method} ${path} response:`, json);
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

/**
 * Initialize a payment for login fee using Paystack
 * For Kenya, we'll use mobile money (M-Pesa)
 */
exports.initializePayment = async (amount, phone, email, userId, description) => {
  const formattedPhone = formatPhone(phone);
  console.log(`Initializing Paystack payment for phone: ${formattedPhone}, amount: ${amount}, email: ${email}`);
  
  try {
    // Paystack requires email for payment - use user's email or generate one
    const paymentEmail = email || `user_${userId}@surveyearn.com`;
    
    // Initialize payment with Paystack
    const response = await makeRequest("/transaction/initialize", "POST", {
      email: paymentEmail,
      amount: amount * 100, // Paystack expects amount in kobo (cents)
      currency: "KES",
      metadata: {
        user_id: userId.toString(),
        phone: formattedPhone,
        type: "login_fee"
      },
      callback_url: `${process.env.FRONTEND_URL}/login-fee-callback`
    });
    
    console.log("Paystack initialize response:", response);
    return response;
  } catch (error) {
    console.error("Paystack initialize error:", error.message);
    throw error;
  }
};

/**
 * Verify a payment with Paystack
 */
exports.verifyPayment = async (reference) => {
  try {
    const response = await makeRequest(`/transaction/verify/${reference}`, "GET");
    return response;
  } catch (error) {
    console.error("Paystack verify error:", error.message);
    throw error;
  }
};

/**
 * Charge a customer using mobile money (M-Pesa)
 * Note: This requires Paystack's mobile money integration to be enabled
 */
exports.chargeMobileMoney = async (amount, phone, email, userId) => {
  const formattedPhone = formatPhone(phone);
  
  try {
    // First initialize the transaction
    const initResponse = await makeRequest("/transaction/initialize", "POST", {
      email: email || `user_${userId}@surveyearn.com`,
      amount: amount * 100,
      currency: "KES",
      metadata: {
        user_id: userId.toString(),
        phone: formattedPhone,
        type: "login_fee",
        force_mobile_money: true
      }
    });
    
    // Then initiate the charge
    if (initResponse.data && initResponse.data.access_code) {
      const chargeResponse = await makeRequest("/charge", "POST", {
        email: email || `user_${userId}@surveyearn.com`,
        amount: amount * 100,
        access_code: initResponse.data.access_code,
        mobile_money: {
          phone: formattedPhone,
          provider: "mtn" // or "vodafone", "airteltigo" for Ghana
        }
      });
      return chargeResponse;
    }
    
    return initResponse;
  } catch (error) {
    console.error("Paystack charge mobile money error:", error.message);
    throw error;
  }
};

/**
 * Get public key for frontend
 */
exports.getPublicKey = () => {
  return process.env.PAYSTACK_PUBLIC_KEY;
};
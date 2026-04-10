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
 * Initialize payment and trigger automatic M-Pesa STK Push
 * This uses Paystack's direct charge endpoint for mobile money
 */
exports.initializePayment = async (amount, phone, email, userId, description) => {
  const formattedPhone = formatPhone(phone);
  console.log(`Initializing Paystack STK Push for phone: ${formattedPhone}, amount: ${amount}, email: ${email}`);
  
  try {
    // Use user's email or generate one
    const paymentEmail = email || `user_${userId}@surveyearn.com`;
    
    // Use direct charge endpoint for M-Pesa STK Push
    const response = await makeRequest("/charge", "POST", {
      email: paymentEmail,
      amount: amount * 100, // Paystack expects amount in kobo (cents)
      currency: "KES",
      mobile_money: {
        phone: formattedPhone,
        provider: "mtn" // Kenya M-Pesa
      },
      metadata: {
        user_id: userId.toString(),
        phone: formattedPhone,
        type: "login_fee"
      }
    });
    
    console.log("Paystack STK Push response:", response);
    return response;
  } catch (error) {
    console.error("Paystack STK Push error:", error.message);
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
 * Get public key for frontend
 */
exports.getPublicKey = () => {
  return process.env.PAYSTACK_PUBLIC_KEY;
};
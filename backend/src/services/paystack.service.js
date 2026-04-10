const https = require("https");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
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
    console.log("Environment check - PAYSTACK_SECRET_KEY:", PAYSTACK_SECRET_KEY ? "present" : "MISSING");
    
    if (!PAYSTACK_SECRET_KEY) {
      console.error("Missing PAYSTACK_SECRET_KEY!");
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

    console.log(`Paystack request: ${method} ${path}`);

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        console.log(`Paystack response status: ${res.statusCode}`);
        try {
          const json = JSON.parse(body);
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
 * Initialize payment - Use /charge endpoint for automatic M-Pesa STK Push
 */
exports.initializePayment = async (amount, phone, email, userId, description) => {
  const formattedPhone = formatPhone(phone);
  console.log(`Initializing Paystack STK Push: amount: ${amount}, phone: ${formattedPhone}, email: ${email}, userId: ${userId}`);
  
  try {
    const paymentEmail = email || `user_${userId}@surveyearn.com`;
    const reference = `PAY_${Date.now()}_${userId}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Use /charge endpoint for automatic M-Pesa STK Push
    const response = await makeRequest("/charge", "POST", {
      email: paymentEmail,
      amount: amount * 100, // Convert to cents
      currency: "KES",
      reference: reference,
      mobile_money: {
        phone: formattedPhone,
        provider: "mtn" // Kenya M-Pesa
      },
      metadata: {
        user_id: userId.toString(),
        phone: formattedPhone,
        type: "login_fee",
        description: description || "Login fee payment"
      }
    });
    
    console.log("Paystack charge response:", response);
    console.log("Paystack response data keys:", response.data ? Object.keys(response.data) : "no data");
    console.log("Full Paystack response:", JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error("Paystack STK Push error:", error.message);
    console.error("Full error:", error);
    throw error;
  }
};

/**
 * Verify a payment with Paystack
 */
exports.verifyPayment = async (reference) => {
  try {
    const response = await makeRequest(`/transaction/verify/${reference}`, "GET");
    return {
      success: response.data.status === "success",
      amount: response.data.amount / 100,
      reference: response.data.reference,
      paid_at: response.data.paid_at,
      status: response.data.status
    };
  } catch (error) {
    console.error("Paystack verify error:", error.message);
    throw error;
  }
};

/**
 * Get public key for frontend
 */
exports.getPublicKey = () => {
  return PAYSTACK_PUBLIC_KEY;
};
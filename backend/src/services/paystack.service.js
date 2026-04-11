const https = require("https");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const BASE_URL = "api.paystack.co";

// ✅ FIXED: Format phone to support 01 and 07 numbers
const formatPhone = (phone) => {
  // Remove any non-numeric characters
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  console.log(`Formatting phone: ${phone} -> cleaned: ${cleaned}`);
  
  // Handle Kenyan numbers starting with 0 (both 07 and 01)
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1); // 07XXXXXXX or 01XXXXXXX -> 2547XXXXXXX or 2541XXXXXXX
  }
  // Handle numbers starting with 7 or 1 (no leading 0)
  else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  // Handle numbers already starting with 254
  else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  const formatted = '+' + cleaned;
  console.log(`Formatted phone: ${formatted}`);
  return formatted;
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
        console.log(`Paystack raw response body: ${body}`);
        try {
          const json = JSON.parse(body);
          console.log(`Paystack parsed response:`, json);
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

// ✅ EXPORT FUNCTIONS PROPERLY
const initializePayment = async (amount, phone, email, userId, description) => {
  const formattedPhone = formatPhone(phone);
  console.log(`Initializing Paystack STK Push: amount: ${amount}, phone: ${formattedPhone}, email: ${email}, userId: ${userId}`);
  
  try {
    const paymentEmail = email || `user_${userId}@surveyearn.com`;
    const reference = `PAY_${Date.now()}_${userId}_${Math.random().toString(36).substring(2, 8)}`;
    
    console.log("Attempting /transaction/initialize for STK push...");
    console.log("Phone being used:", formattedPhone);
    
    // Use mobile_money channel for M-Pesa STK
    const response = await makeRequest("/transaction/initialize", "POST", {
      email: paymentEmail,
      amount: amount * 100,
      currency: "KES",
      reference: reference,
      phone_number: formattedPhone.replace("+", ""),
      metadata: {
        user_id: userId.toString(),
        phone: formattedPhone
      },
      channels: ["mobile_money"]
    });
    
    console.log("Paystack initialize response:", response);
    
    if (response.status && response.data) {
      // Return the reference - the actual STK trigger comes from Paystack
      return {
        success: true,
        reference: reference,
        authorization_url: response.data.authorization_url,
        message: "STK Push sent to your phone"
      };
    } else {
      throw new Error(response.message || "Payment initialization failed");
    }
    
  } catch (error) {
    console.error("Paystack initialize error:", error.message);
    throw error;
  }
};

const verifyPayment = async (reference) => {
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

const getPublicKey = () => {
  return PAYSTACK_PUBLIC_KEY;
};

// ✅ EXPORT ALL FUNCTIONS
module.exports = {
  initializePayment,
  verifyPayment,
  getPublicKey
};
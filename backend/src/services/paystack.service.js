const https = require("https");

// Remove hardcoded keys - only use environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const BASE_URL = "api.paystack.co";

// Check for missing keys
if (!PAYSTACK_SECRET_KEY) {
  console.error("❌ PAYSTACK_SECRET_KEY is missing in environment variables");
}
if (!PAYSTACK_PUBLIC_KEY) {
  console.error("❌ PAYSTACK_PUBLIC_KEY is missing in environment variables");
}

const formatPhone = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Format to +254XXXXXXXXX for Paystack mobile_money.phone
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = '+254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '+254' + cleaned;
  } else if (cleaned.startsWith('254') && cleaned.length === 12) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  console.log(`Phone formatted: ${phone} -> ${cleaned}`);
  return cleaned;
};

// Main function for direct STK push (no redirect, no webhook needed)
const chargeMpesa = async (amount, phone, email, userId) => {
  // Format phone for Paystack mobile_money.phone (requires +254 format)
  const formattedPhone = formatPhone(phone);
  const paymentEmail = email || `user_${userId}@surveyearn.co.ke`;
  const reference = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  console.log("=== PAYSTACK DIRECT STK PUSH (M-PESA) ===");
  console.log("Phone (formatted):", formattedPhone);
  console.log("Amount (KES):", amount);
  console.log("Email:", paymentEmail);
  console.log("Reference:", reference);
  
  // CORRECT payload for direct STK push - using mobile_money object
  const requestData = {
    email: paymentEmail,
    amount: amount * 100,  // Convert to kobo/cent (e.g., 100 KES = 10000)
    currency: "KES",
    reference: reference,
    mobile_money: {
      phone: formattedPhone,
      provider: "mpesa"
    },
    metadata: {
      user_id: userId
    }
  };

  console.log("Request payload:", JSON.stringify(requestData, null, 2));
  
  try {
    const response = await makeRequest("/charge", "POST", requestData);
    console.log("Paystack response:", JSON.stringify(response, null, 2));
    
    // Check if STK push was initiated successfully
    // Paystack returns status "true" with data.status like "send_otp" or "pending"
    if (response.status === true && response.data) {
      return {
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        reference: reference,
        status: response.data.status,
        requires_manual_approval: true  // Flag that manual approval is needed
      };
    } else {
      return {
        success: false,
        message: response.message || response.data?.message || "STK Push failed",
        details: response
      };
    }
  } catch (error) {
    console.error("Paystack charge error:", error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

const makeRequest = (path, method, data = null) => {
  return new Promise((resolve, reject) => {
    console.log("PAYSTACK_SECRET_KEY:", PAYSTACK_SECRET_KEY ? "present" : "MISSING");
    
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
    if (data) {
      console.log("Paystack request data:", JSON.stringify(data));
    }

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
      const dataString = JSON.stringify(data);
      req.write(dataString);
    }

    req.end();
  });
};

// Verify payment status (useful for admin to check)
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

module.exports = {
  chargeMpesa,
  verifyPayment,
  getPublicKey,
  formatPhone
};
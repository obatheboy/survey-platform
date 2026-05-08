/**
 * Kifarupay STK Push Service
 * Base URL: https://api.kifarupay.co.ke/api
 * Endpoint: POST /api/payments/stk-push
 * No webhooks - manual payment verification
 */

const https = require("https");

const KIFARUPAY_BASE_URL = "api.kifarupay.co.ke";
const KIFARUPAY_API_KEY = process.env.KIFARUPAY_API_KEY || "lp_56b45cac249cda194ec7eb656ce05e38d097cf8b22d8638a8fa786abd3953add";  // Fixed
const KIFARUPAY_APP_ID = process.env.KIFARUPAY_APP_ID || "9df89bb8-181f-44a8-835d-1b1075c4d1dd";
const KIFARUPAY_TILL_NUMBER = process.env.KIFARUPAY_TILL_NUMBER || "7282886";

// Fixed plan amounts (KES)
const PLAN_AMOUNTS = {
  WELCOME_BONUS: 100,
  REGULAR: 100,
  VIP: 200,
  VVIP: 300
};

/**
 * Format phone number to 254XXXXXXXXX format
 * Supports: 07XXXXXXXX, 011XXXXXXXX, 0100XXXXXXXX, 254XXXXXXXXX
 */
const formatPhone = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');

  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    const afterZero = cleaned.substring(1);
    const prefix2 = afterZero.substring(0, 2);

    if (afterZero.charAt(0) === '7' || prefix2 === '11' || prefix2 === '10') {
      return '254' + afterZero;
    }
  }

  if (cleaned.startsWith('7') && cleaned.length === 9) {
    return '254' + cleaned;
  }
  if (cleaned.startsWith('11') && cleaned.length === 9) {
    return '254' + cleaned;
  }
  if (cleaned.startsWith('10') && cleaned.length === 9) {
    return '254' + cleaned;
  }

  // If it starts with 254 but wrong length, try to fix
  if (cleaned.startsWith('254')) {
    if (cleaned.length > 12) {
      return cleaned.substring(0, 12);
    }
    // Pad if needed (unlikely)
    return cleaned;
  }

  // Unknown format - try adding 254
  if (cleaned.length === 9) {
    return '254' + cleaned;
  }

  return cleaned;
};

/**
 * Get plan amount by plan key
 */
const getPlanAmount = (planKey) => {
  return PLAN_AMOUNTS[planKey] || PLAN_AMOUNTS.REGULAR;
};

/**
 * Make HTTP request to Kifarupay API
 */
const makeKifarupayRequest = (path, method, data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://${KIFARUPAY_BASE_URL}${path}`);

    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: KIFARUPAY_BASE_URL,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KIFARUPAY_API_KEY}`,
        "X-App-Id": KIFARUPAY_APP_ID
      }
    };

    if (postData) {
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ success: false, error: "Invalid JSON", raw: body.substring(0, 200) });
        }
      });
    });

    req.on("error", (err) => {
      console.error("Kifarupay request error:", err.message);
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

/**
 * Initiate STK Push via Kifarupay
 * @param {number} amount - Amount in KES
 * @param {string} phone - Phone number (any Kenyan format)
 * @param {string} userId - User ID from our system
 * @param {string} description - Payment description
 * @param {string} reference - Our internal payment reference
 * @returns {Promise<object>} Payment result
 */
const initiateSTKPush = async (amount, phone, userId, description = "SurveyEarn Payment", reference = null) => {
  try {
    const formattedPhone = formatPhone(phone);
    const paymentReference = reference || `KFY_${Date.now()}_${userId}_${Math.random().toString(36).substring(2, 6)}`;

    console.log("=== Kifarupay STK Push Request ===");
    console.log("Phone (254 format):", formattedPhone);
    console.log("Amount:", amount);
    console.log("Reference:", paymentReference);
    console.log("Description:", description);

    const requestData = {
      phone_number: formattedPhone,
      amount: amount,
      reference: paymentReference,
      description: description,
      till_number: KIFARUPAY_TILL_NUMBER
    };

    console.log("Request payload:", JSON.stringify(requestData, null, 2));

    const response = await makeKifarupayRequest("/api/payments/stk-push", "POST", requestData);

    console.log("Kifarupay Response:", JSON.stringify(response, null, 2));

    // Handle various response formats
    if (response.success === true || response.status === "success" || response.code === 200 || response.statusCode === 200) {
      return {
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        checkout_request_id: response.checkout_request_id || response.transaction_id || response.reference || paymentReference,
        reference: paymentReference,
        amount: amount,
        phone: formattedPhone,
        raw_response: response
      };
    }

    // Check for common error patterns
    const errorMessage = response.message || response.error || response.ErrorMessage || response.description || "STK Push failed";
    const errorCode = response.code || response.statusCode || response.error_code || null;

    // Handle phone number validation errors
    if (errorMessage.toLowerCase().includes("phone") || errorMessage.toLowerCase().includes("invalid")) {
      return {
        success: false,
        message: "Invalid phone number format. Please use 254XXXXXXXXX format.",
        details: response
      };
    }

    return {
      success: false,
      message: errorMessage,
      code: errorCode,
      details: response
    };
  } catch (error) {
    console.error("Kifarupay STK Push Error:", error.message);

    if (error.code === 'ENOTFOUND') {
      return {
        success: false,
        message: "Payment gateway temporarily unavailable. Please try again in a few minutes.",
        error: "DNS_RESOLUTION_FAILED"
      };
    }

    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: "Payment gateway connection refused. Please try again later.",
        error: "CONNECTION_REFUSED"
      };
    }

    if (error.code === 'ETIMEDOUT') {
      return {
        success: false,
        message: "Payment gateway timed out. Please try again.",
        error: "TIMEOUT"
      };
    }

    return {
      success: false,
      message: error.message || "Payment gateway error",
      error: error
    };
  }
};

/**
 * Get plan amount by plan key
 */
const getPlanAmountByKey = (planKey) => {
  return PLAN_AMOUNTS[planKey?.toUpperCase()] || null;
};

module.exports = {
  initiateSTKPush,
  formatPhone,
  getPlanAmount,
  getPlanAmountByKey,
  PLAN_AMOUNTS
};
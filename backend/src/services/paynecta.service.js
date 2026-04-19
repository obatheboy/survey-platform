const https = require("https");

const PAYNECTA_CONFIG = {
  apiKey: "hmp_vY2jhkhBWNuCryXY1dd5VnO5rsL63vKDAAKOnBE1",
  userEmail: "obavanteshia65@gmail.com",
  paymentCode: "PNT_492664",
  baseUrl: "https://paynecta.co.ke"
};

// Format phone to 254XXXXXXXX format (international)
const formatPhoneToInternational = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Kenyan numbers: 07XXXXXXXX or 01XXXXXXXX (10 digits with leading 0)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.substring(1);
  } 
  // Numbers without leading 0: 7XXXXXXXX or 1XXXXXXXX (exactly 9 digits)
  else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('254')) {
    // Already correct
  }
  
  return cleaned;
};

// Format phone for Paynecta API (254XXXXXXXX format)
const formatPhoneForPaynecta = (phone) => {
  return formatPhoneToInternational(phone);
};

const makeRequest = (path, method, data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${PAYNECTA_CONFIG.baseUrl}${path}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PAYNECTA_CONFIG.apiKey,
        "X-User-Email": PAYNECTA_CONFIG.userEmail
      }
    };

    const postData = data ? JSON.stringify(data) : null;
    if (postData) {
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        if (!body || body.trim() === "") {
          resolve({ success: false, error: "Empty response" });
          return;
        }
        
        const trimmed = body.trim();
        if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) {
          resolve({ success: false, error: "HTML error page" });
          return;
        }
        
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ success: false, error: "Invalid JSON", raw: body.substring(0, 200) });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

/**
 * Initialize STK Push Payment - CORRECT API ENDPOINT
 * Based on Paynecta documentation: POST /api/v1/payment/initialize
 */
const initiateSTKPush = async (amount, phoneNumber, email, userId, description) => {
  try {
    const formattedPhone = formatPhoneForPaynecta(phoneNumber);
    
    const requestData = {
      code: PAYNECTA_CONFIG.paymentCode,
      mobile_number: formattedPhone,
      amount: parseInt(amount)
    };

    console.log("=== Paynecta STK Push Request ===");
    console.log("URL: /api/v1/payment/initialize");
    console.log("Phone (254 format):", formattedPhone);
    console.log("Amount:", amount);
    console.log("Payment Code:", PAYNECTA_CONFIG.paymentCode);

    const response = await makeRequest("/api/v1/payment/initialize", "POST", requestData);
    
    console.log("Paynecta Response:", JSON.stringify(response, null, 2));

    // Check for successful response
    if (response.success === true || response.status === "success") {
      return {
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        checkout_request_id: response.checkout_request_id || response.transaction_id,
        reference: response.reference || `PAYN_${Date.now()}`,
        raw_response: response
      };
    } else {
      return {
        success: false,
        message: response.message || response.error || "STK Push failed",
        details: response
      };
    }
  } catch (error) {
    console.error("Paynecta STK Error:", error.message);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

/**
 * Verify Payment Status
 */
const verifyPayment = async (reference) => {
  try {
    const response = await makeRequest(`/api/v1/payment/status/${reference}`, "GET");
    
    if (response.success && response.data?.status === "completed") {
      return {
        success: true,
        verified: true,
        amount: response.data.amount,
        phone: response.data.phone,
        receipt: response.data.transaction_id,
        timestamp: response.data.created_at
      };
    }

    return {
      success: true,
      verified: false,
      status: response.status,
      message: response.message || "Payment pending"
    };
  } catch (error) {
    console.error("Paynecta Verify Error:", error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

const queryPayment = async (reference) => {
  return await verifyPayment(reference);
};

module.exports = {
  initiateSTKPush,
  verifyPayment,
  queryPayment,
  formatPhoneForPaynecta,
  formatPhoneToInternational
};
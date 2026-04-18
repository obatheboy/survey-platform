const https = require("https");

const PAYNECTA_CONFIG = {
  apiKey: "hmp_vY2jhkhBWNuCryXY1dd5VnO5rsL63vKDAAKOnBE1",
  userEmail: "obavanteshia65@gmail.com",
  paymentLink: "survey-app",
  baseUrl: "https://paynecta.co.ke"
};

const formatPhone = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Paynecta expects format: 7xxxxxxxx (without 254, without 0)
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = cleaned.substring(1); // 0740834185 -> 740834185
  }
  else if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3); // 254740834185 -> 740834185
  }
  // Remove any remaining non-digit characters
  cleaned = cleaned.replace(/\D/g, '');
  
  console.log(`Phone formatted: ${phone} -> ${cleaned}`);
  return cleaned;
};

const formatPhoneToInternational = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Convert to 254 format
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = '254' + cleaned.substring(1); // 0740209662 -> 254740209662
  } else if (cleaned.startsWith('7')) {
    cleaned = '254' + cleaned; // 740209662 -> 254740209662
  } else if (cleaned.startsWith('254')) {
    // Already in 254 format
  }
  
  console.log(`Phone formatted to international: ${phone} -> ${cleaned}`);
  return cleaned;
};

// Format phone for Paynecta - without 254 prefix (e.g., 740209662)
const formatPhoneForPaynecta = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Remove any prefix
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = cleaned.substring(1); // 0740209662 -> 740209662
  } else if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3); // 254740209662 -> 740209662
  }
  
  console.log(`Phone formatted for Paynecta: ${phone} -> ${cleaned}`);
  return cleaned;
};

const makeRequest = (path, method, data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${PAYNECTA_CONFIG.baseUrl}${path}`);
    
    console.log("========== MAKING REQUEST ==========");
    console.log("URL:", url.href);
    console.log("Method:", method);
    console.log("Headers:", {
      "Content-Type": "application/json",
      "X-API-Key": PAYNECTA_CONFIG.apiKey ? "SET" : "MISSING",
      "X-User-Email": PAYNECTA_CONFIG.userEmail
    });
    console.log("Data:", data);
    console.log("====================================");
    
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
        const status = res.statusCode;
        console.log("=== PAYNECTA HTTP STATUS:", status, "===");
        console.log("Response length:", body.length, "chars");
        
        // Check for empty response
        if (!body || body.trim() === "") {
          console.log("EMPTY RESPONSE");
          resolve({ success: false, error: "Empty response" });
          return;
        }
        
        // Print first 1000 chars regardless
        console.log("RESPONSE START:", body.substring(0, 1000));
        
        // Check if it's HTML
        const trimmed = body.trim();
        if (trimmed.startsWith("<!") || trimmed.startsWith("<html") || trimmed.startsWith("<!DOCTYPE")) {
          resolve({ success: false, error: "HTML error page", raw: body.substring(0, 500) });
          return;
        }
        
        // Try to parse JSON
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ success: false, error: "Invalid JSON", raw: body.substring(0, 500) });
        }
      });
    });

    req.on("error", (err) => {
      console.error("Paynecta Request Error:", err.message);
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

// Initialize STK Push Payment - Using the OLD working endpoint
const initiateSTKPush = async (amount, phoneNumber, email, userId, description) => {
  try {
    const formattedPhone = formatPhone(phoneNumber); // 7xxxxxxxx format
    
    const requestData = {
      amount: parseInt(amount),
      phone: formattedPhone,
      email: email || PAYNECTA_CONFIG.userEmail,
      description: description || "SurveyEarn Activation Payment",
      metadata: {
        user_id: userId,
        type: "activation"
      }
    };

    console.log("=== STK Push Request ===");
    console.log("Phone:", formattedPhone);
    console.log("Amount:", amount);
    console.log("========================");

    const response = await makeRequest("/wp-json/paynecta/v1/stk-push", "POST", requestData);
    
    console.log("=== STK Push Response ===");
    console.log(JSON.stringify(response, null, 2));
    console.log("=========================");
    
    if (response.success === true || response.CheckoutRequestID) {
      return {
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        checkout_request_id: response.CheckoutRequestID,
        reference: response.MerchantRequestID || `PNT_${Date.now()}`
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

// Verify Payment Status
const verifyPayment = async (checkoutRequestId) => {
  try {
    const response = await makeRequest(`/wp-json/paynecta/v1/status?checkout_request_id=${checkoutRequestId}`, "GET");
    
    console.log("Paynecta Verify Response:", JSON.stringify(response, null, 2));

    if (response.success || response.ResultCode === "0") {
      return {
        success: true,
        verified: true,
        amount: response.Amount,
        phone: response.PhoneNumber,
        receipt: response.MpesaReceiptNumber,
        timestamp: response.TransactionDate
      };
    }

    return {
      success: true,
      verified: false,
      status: response.ResultCode || response.status,
      message: response.ResultDesc || response.message
    };
  } catch (error) {
    console.error("Paynecta Verify Error:", error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

// Query Transaction
const queryPayment = async (checkoutRequestId) => {
  return await verifyPayment(checkoutRequestId);
};

/* ===============================
   DIRECT PAYMENT API (No iframe, no redirect)
   Endpoint: POST /api/v1/payment/initialize
   Body: { "code": "YOUR_CODE", "mobile_number": "7xxxxxxxx", "amount": 100 }
============================== */
const initializeDirectPayment = async (phoneNumber, amount, paymentCode = "PNT_492664") => {
  try {
    // Format phone to 9 digits without 0 (e.g., 0740209662 -> 740209662)
    const formattedPhone = formatPhoneForPaynecta(phoneNumber);
    
    const requestData = {
      code: paymentCode,
      mobile_number: formattedPhone, // 9 digits without 0, e.g., 740209662
      amount: parseInt(amount)
    };

    console.log("=== Paynecta Direct Payment ===");
    console.log("Payment Code:", paymentCode);
    console.log("Phone (9 digits):", formattedPhone);
    console.log("Amount:", amount);
    console.log("Request:", JSON.stringify(requestData));
    console.log("================================");

    // Try both endpoints and methods
    const endpoints = [
      { path: "/api/v1/payment/initialize", method: "POST" },
      { path: "/api/v1/payment", method: "POST" },
      { path: "/api/v1/payment/initialize", method: "GET" },
      { path: "/api/payment/initialize", method: "POST" },
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      console.log(`Trying ${endpoint.method} ${endpoint.path}...`);
      
      try {
        const response = await makeRequest(endpoint.path, endpoint.method, requestData);
        
        // Check if we got a valid JSON response
        if (response && !response.error && !response.raw?.startsWith("<")) {
          console.log("Success with:", endpoint.method, endpoint.path);
          return processDirectPaymentResponse(response);
        }
        
        console.log(`Failed with ${endpoint.method} ${endpoint.path}:`, response.error || "Invalid response");
        lastError = response;
      } catch (err) {
        console.log(`Error with ${endpoint.method} ${endpoint.path}:`, err.message);
        lastError = err;
      }
    }
    
    // If all endpoints fail, try the direct payment response processor
    console.log("All endpoints failed, trying direct payment response parser...");
    // Return a failure since none of the endpoints worked
    
    return {
      success: false,
      message: "Payment API not available. Please use manual payment.",
      details: lastError
    };
  } catch (error) {
    console.error("Paynecta Direct API Error:", error.message);
    return {
      success: false,
      message: error.message || "Payment initialization failed",
      error: error
    };
  }
};

// Helper to process direct payment response
const processDirectPaymentResponse = (response) => {
  console.log("Processing response:", JSON.stringify(response));
  
  const hasCheckoutId = response.CheckoutRequestID || response.checkout_request_id || response.MerchantRequestID;
  
  if (response.success === true || response.status === "success" || hasCheckoutId) {
    return {
      success: true,
      message: response.message || "STK Push sent! Check your phone and enter PIN.",
      checkout_request_id: hasCheckoutId,
      reference: response.MerchantRequestID || `PNT_${Date.now()}`,
      status: response.status,
      raw_response: response
    };
  } else {
    return {
      success: false,
      message: response.message || response.error || "Payment initialization failed",
      details: response
    };
  }
};

module.exports = {
  initiateSTKPush,
  verifyPayment,
  queryPayment,
  formatPhone,
  formatPhoneToInternational,
  formatPhoneForPaynecta,
  initializeDirectPayment
};
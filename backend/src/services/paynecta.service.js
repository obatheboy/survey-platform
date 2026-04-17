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

const makeRequest = (path, method, data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${PAYNECTA_CONFIG.baseUrl}${path}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYNECTA_CONFIG.apiKey}`,
        "User-Email": PAYNECTA_CONFIG.userEmail
      }
    };

    const postData = data ? JSON.stringify(data) : null;
    if (postData) {
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    console.log(`Paynecta Request: ${method} ${url.href}`);
    console.log("Paynecta Headers:", JSON.stringify(options.headers));
    if (data) console.log("Paynecta Data:", JSON.stringify(data));

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        console.log(`Paynecta Response Status: ${res.statusCode}`);
        console.log(`Paynecta Response Body: ${body}`);
        
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ success: true, raw: body });
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

// Initialize STK Push Payment
const initiateSTKPush = async (amount, phoneNumber, email, userId, description) => {
  try {
    const formattedPhone = formatPhone(phoneNumber);
    
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

    const response = await makeRequest("/wp-json/paynecta/v1/stk-push", "POST", requestData);
    
    console.log("Paynecta STK Response:", JSON.stringify(response, null, 2));
    
    if (response.success || response.status === "success" || response.CheckoutRequestID) {
      return {
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        checkout_request_id: response.CheckoutRequestID || response.checkout_request_id,
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

module.exports = {
  initiateSTKPush,
  verifyPayment,
  queryPayment,
  formatPhone
};
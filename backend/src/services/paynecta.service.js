const https = require("https");

const PAYNECTA_CONFIG = {
  paymentCode: "PNT_492664",
  apiKey: "hmp_vY2jhkhBWNuCryXY1dd5VnO5rsL63vKDAAKOnBE1",
  userEmail: "obavanteshia65@gmail.com",
  tillNumber: "7282886",
  baseUrl: "https://paynecta.co.ke/api/v1"
};

const formatPhone = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = '254' + cleaned.substring(1);
  }
  else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};

const makeRequest = (endpoint, method, data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${PAYNECTA_CONFIG.baseUrl}${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYNECTA_CONFIG.apiKey}`,
        "Payment-Code": PAYNECTA_CONFIG.paymentCode
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
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ success: true, message: body });
        }
      });
    });

    req.on("error", reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const initiateSTKPush = async (amount, phoneNumber, email, userId, description) => {
  try {
    const formattedPhone = formatPhone(phoneNumber);
    
    const requestData = {
      amount: amount,
      phone: formattedPhone,
      email: email || PAYNECTA_CONFIG.userEmail,
      user_id: userId,
      description: description || "SurveyEarn Activation Payment",
      callback_url: `${process.env.SERVER_URL || 'https://yourdomain.com'}/api/payment/webhook`
    };

    console.log("Paynecta STK Push request:", JSON.stringify(requestData, null, 2));

    const response = await makeRequest("/mpesa/stk-push", "POST", requestData);
    
    console.log("Paynecta response:", JSON.stringify(response, null, 2));
    
    if (response.success || response.ResponseCode === "0") {
      return {
        success: true,
        message: "STK Push sent successfully! Check your phone.",
        checkout_request_id: response.CheckoutRequestID || response.checkout_request_id,
        reference: response.CheckoutRequestID || `PNT_${Date.now()}`
      };
    } else {
      return {
        success: false,
        message: response.message || "STK Push failed",
        error: response
      };
    }
  } catch (error) {
    console.error("Paynecta STK error:", error.message);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

const verifyPayment = async (checkoutRequestId) => {
  try {
    const response = await makeRequest("/mpesa/status", "POST", {
      checkout_request_id: checkoutRequestId
    });

    if (response.success && response.ResultCode === "0") {
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
      status: response.ResultCode,
      message: response.ResultDesc
    };
  } catch (error) {
    console.error("Paynecta verify error:", error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

const queryTransaction = async (checkoutRequestId) => {
  try {
    return await verifyPayment(checkoutRequestId);
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  initiateSTKPush,
  verifyPayment,
  queryPayment: queryTransaction,
  formatPhone
};
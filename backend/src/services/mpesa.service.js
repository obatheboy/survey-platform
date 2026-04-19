const https = require("https");
const crypto = require("crypto");

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSWORD = process.env.MPESA_PASSWORD;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;
const MPESA_ENV = process.env.MPESA_ENV || "sandbox";

const BASE_URL = MPESA_ENV === "live" 
  ? "api.safaricom.co.ke" 
  : "sandbox.safaricom.co.ke";
const OAUTH_URL = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

let accessToken = null;
let tokenExpiry = null;

const formatPhone = (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Kenyan mobile numbers only (M-Pesa compatible)
  // Standard 07: 070, 071, 072, 074, 075, 076, 078, 079
  // Safaricom 01: 011, 0110, 0111
  // Airtel 01: 0100, 0101, 0102
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    const afterZero = cleaned.substring(1);
    const prefix2 = afterZero.substring(0, 2);
    const prefix3 = afterZero.substring(0, 3);
    
    // Accept: starts with 7, 11, or 10
    if (afterZero.charAt(0) === '7' || prefix2 === '11' || prefix2 === '10') {
      cleaned = '254' + afterZero;
    }
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('11') && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('10') && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};

const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      resolve(accessToken);
      return;
    }

    const auth = Buffer.from(
      `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const options = {
      hostname: BASE_URL,
      path: "/oauth/v1/generate?grant_type=client_credentials",
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json.access_token) {
            accessToken = json.access_token;
            tokenExpiry = Date.now() + (json.expires_in * 1000) - 60000;
            resolve(accessToken);
          } else {
            reject(new Error("Failed to get access token: " + body));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
};

const makeMpesaRequest = (endpoint, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getAccessToken();
      
      const password = Buffer.from(
        `${MPESA_SHORTCODE}${MPESA_PASSWORD}`
      ).toString("base64");

      const requestData = {
        ...data,
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password
      };

      const options = {
        hostname: BASE_URL,
        path: endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      };

      console.log(`M-Pesa request to ${endpoint}:`, JSON.stringify(requestData));

      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          console.log(`M-Pesa response status: ${res.statusCode}`);
          console.log(`M-Pesa response body: ${body}`);
          try {
            const json = JSON.parse(body);
            if (res.statusCode === 200 || res.statusCode === 201) {
              resolve(json);
            } else {
              reject(new Error(json.errorMessage || json.error || `Request failed with status ${res.statusCode}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on("error", reject);
      req.write(JSON.stringify(requestData));
      req.end();
    } catch (error) {
      reject(error);
    }
  });
};

const stkPush = async (amount, phone, userId, description = "SurveyEarn Payment") => {
  const formattedPhone = formatPhone(phone);
  const transactionId = `PAY_${Date.now()}_${userId}`;
  
  console.log(`Initiating STK Push: amount: ${amount}, phone: ${formattedPhone}, transactionId: ${transactionId}`);

  const response = await makeMpesaRequest("/mpesa/stkpush/v1/processrequest", {
    TransactionType: "CustomerPayBillOnline",
    Amount: amount.toString(),
    PartyA: formattedPhone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: `${MPESA_CALLBACK_URL}?userId=${userId}&type=activation`,
    AccountReference: "SurveyEarn",
    TransactionDesc: description
  });

  return {
    success: true,
    checkoutRequestId: response.CheckoutRequestID,
    customerMessage: response.CustomerMessage,
    response: response
  };
};

const checkStatus = async (checkoutRequestId) => {
  const response = await makeMpesaRequest("/mpesa/stkquery/v1/query", {
    CheckoutRequestID: checkoutRequestId,
    QueryType: "CheckStatus"
  });

  return {
    success: response.ResultCode === 0,
    resultCode: response.ResultCode,
    resultDesc: response.ResultDesc
  };
};

const verifyPayment = async (checkoutRequestId, expectedAmount) => {
  const status = await checkStatus(checkoutRequestId);
  
  if (status.success) {
    return {
      success: true,
      amount: expectedAmount,
      status: "paid"
    };
  }
  
  return {
    success: false,
    status: status.resultDesc
  };
};

module.exports = {
  stkPush,
  checkStatus,
  verifyPayment,
  formatPhone
};
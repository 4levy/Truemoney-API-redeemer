const axios = require("axios");
const https = require("https");

const API_WALLET = async (voucherCode, mobileNumber) => {
  const voucherId = voucherCode.replace(
    "https://gift.truemoney.com/campaign/?v=",
    ""
  );

  const requestConfig = {
    method: "post",
    url: `https://gift.truemoney.com/campaign/vouchers/${voucherId}/redeem`,
    data: {
      mobile: mobileNumber,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36 Edg/84.0.522.52",
      "Content-Type": "application/json",
    },
    httpsAgent: new https.Agent({
      maxVersion: "TLSv1.3",
      minVersion: "TLSv1.3",
    }),
  };

  try {
    const response = await axios(requestConfig);
    console.log("TrueMoney API Response:", response.data);

    if (response.data?.status?.code === "SUCCESS") {
      console.log("Successful voucher redemption", {
        voucherId,
        mobileNumber,
        amount: response.data?.data?.my_ticket?.amount_baht,
      });

      return {
        status: response.data.status,
        data: response.data.data,
      };
    }

    console.warn("Unexpected success response", {
      voucherId,
      statusCode: response.data?.status?.code,
    });
    return response.data;
  } catch (error) {
    console.error("Error redeeming voucher", {
      voucherId,
      mobileNumber,
      errorCode: error.response?.data?.status?.code,
      error: error.message,
    });

    const errorResponse = error.response?.data || {
      status: {
        message: error.message,
        code: "INTERNAL_ERROR",
      },
    };

    return errorResponse;
  }
};

// Validation rules
const validateRequest = (body) => {
  if (!body || typeof body !== "object") {
    return "Invalid request body";
  }
  if (!body.voucherCode) {
    return "Voucher code is required";
  }
  if (
    !body.voucherCode.match(
      /^https:\/\/gift\.truemoney\.com\/campaign\/\?v=.+$/
    )
  ) {
    return "Invalid voucher URL format";
  }
  if (!body.mobileNumber) {
    return "Mobile number is required";
  }
  if (!body.mobileNumber.match(/^0[0-9]{9}$/)) {
    return "Invalid Thai mobile number format";
  }
  return null;
};

// Vercel serverless function handler
module.exports = async (request, response) => {
  // Set CORS headers
  response.setHeader("Access-Control-Allow-Credentials", true);
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight request
  if (request.method === "OPTIONS") {
    response.status(200).end();
    return;
  }

  // Health check endpoint
  if (request.method === "GET") {
    return response.status(200).json({
      status: {
        message: "API is running",
        code: "SUCCESS",
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle POST request for voucher redemption
  if (request.method === "POST") {
    console.log("Received request body:", request.body);

    const validationError = validateRequest(request.body);
    if (validationError) {
      return response.status(400).json({
        status: {
          message: validationError,
          code: "VALIDATION_ERROR",
        },
      });
    }

    try {
      const { voucherCode, mobileNumber } = request.body;
      const result = await API_WALLET(voucherCode, mobileNumber);
      return response.status(200).json(result);
    } catch (error) {
      console.error("API Error:", error);
      return response.status(500).json({
        status: {
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  // Handle unsupported methods
  return response.status(405).json({
    status: {
      message: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
  });
};

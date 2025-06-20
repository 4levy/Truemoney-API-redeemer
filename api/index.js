const axios = require("axios");
const https = require("https");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRandomUserAgent = () => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.67",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

async function redeemVoucher(voucherCode, mobileNumber) {
  const voucherId = voucherCode.replace(
    "https://gift.truemoney.com/campaign/?v=",
    ""
  );

  await delay(Math.floor(Math.random() * 2000) + 1000);

  const requestConfig = {
    method: "post",
    url: `https://gift.truemoney.com/campaign/vouchers/${voucherId}/redeem`,
    data: {
      mobile: mobileNumber,
    },
    headers: {
      "User-Agent": getRandomUserAgent(),
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/json",
      Origin: "https://gift.truemoney.com",
      Referer: "https://gift.truemoney.com/campaign",
      "Sec-Ch-Ua":
        '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    },
    httpsAgent: new https.Agent({
      maxVersion: "TLSv1.3",
      minVersion: "TLSv1.2",
      rejectUnauthorized: false,
    }),
    maxRedirects: 5,
    timeout: 10000,
    validateStatus: function (status) {
      return status >= 200 && status < 500;
    },
  };

  try {
    const response = await axios(requestConfig);
    if (response.data?.status?.code === "SUCCESS") {
      return {
        status: response.data.status,
        data: response.data.data,
      };
    }
    if (response.status === 403 || response.status === 429) {
      await delay(5000);
      return await redeemVoucher(voucherCode, mobileNumber);
    }
    return response.data;
  } catch (error) {
    const errorResponse = error.response?.data || {
      status: {
        message: error.message,
        code: "INTERNAL_ERROR",
      },
    };
    return errorResponse;
  }
}

async function vercelHandler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method === "GET" && (req.url === "/" || req.url === "")) {
      return res.status(200).json({
        status: {
          message: "TrueMoney API is running",
          code: "OK",
        },
        endpoints: {
          health: "/health",
          redeem: "/api/redeem",
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "GET" && req.url === "/health") {
      return res.status(200).json({
        status: {
          message: "Online",
          code: "OK",
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    }

    if (req.method === "POST" && req.url === "/api/redeem") {
      const { voucherCode, mobileNumber } = req.body;
      if (!voucherCode || !mobileNumber) {
        return res.status(400).json({
          status: {
            message: "voucherCode and mobileNumber are required",
            code: "VALIDATION_ERROR",
          },
        });
      }
      try {
        const result = await redeemVoucher(voucherCode, mobileNumber);
        return res.status(200).json(result);
      } catch (error) {
        console.error("RedeemVoucher Error:", error);
        return res.status(500).json({
          status: {
            message: "Internal server error",
            code: "INTERNAL_ERROR",
          },
        });
      }
    }

    return res.status(404).json({
      status: {
        message: "Not found",
        code: "NOT_FOUND",
      },
    });
  } catch (err) {
    console.error('Vercel Handler Error:', err);
    res.status(500).json({ status: { message: 'Internal server error', code: 'INTERNAL_ERROR' } });
  }
}

// Export for Vercel: ONLY the handler as default
module.exports = vercelHandler;
// Attach redeemVoucher for local/Express use
module.exports.redeemVoucher = redeemVoucher;
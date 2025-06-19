const express = require("express");
const cors = require("cors");
const axios = require("axios");
const https = require("https");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { body, validationResult } = require("express-validator");
const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: true,
    message: "Too many requests. Please try again later.",
  },
});
app.use("/api/", limiter);

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
    logger.debug("TrueMoney API Response:", response.data);

    if (response.data?.status?.code === "SUCCESS") {
      logger.info("Successful voucher redemption", {
        voucherId,
        mobileNumber,
        amount: response.data?.data?.my_ticket?.amount_baht,
      });

      return {
        status: response.data.status,
        data: response.data.data,
      };
    }

    logger.warn("Unexpected success response", {
      voucherId,
      statusCode: response.data?.status?.code,
    });
    return response.data;
  } catch (error) {
    logger.error("Error redeeming voucher", {
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

const validateRedeemRequest = [
  body("voucherCode")
    .notEmpty()
    .withMessage("Voucher code is required")
    .matches(/^https:\/\/gift\.truemoney\.com\/campaign\/\?v=.+$/)
    .withMessage("Invalid voucher URL format"),
  body("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^0[0-9]{9}$/)
    .withMessage("Invalid Thai mobile number format"),
];

app.post("/api/redeem", validateRedeemRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validation failed", { errors: errors.array() });
    return res.status(400).json({
      status: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
      },
      errors: errors.array(),
    });
  }

  const { voucherCode, mobileNumber } = req.body;

  try {
    const result = await API_WALLET(voucherCode, mobileNumber);
    res.json(result);
  } catch (error) {
    logger.error("API Error", { error: error.message });
    res.status(500).json({
      status: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: {
      message: "Online",
      code: "OK",
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((req, res) => {
  logger.warn("Endpoint not found", { path: req.path });
  res.status(404).json({
    status: {
      message: "Endpoint not found",
      code: "NOT_FOUND",
    },
  });
});


app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    status: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(port, () => {
  logger.info(`TrueMoney API server is running on http://localhost:${port}`);
});

module.exports = API_WALLET;

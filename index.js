const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();
const port = 3000;

const apiHandler = require("./api/index.js");

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

app.use("/api/redeem", async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: {
        message: "Method not allowed",
        code: "METHOD_NOT_ALLOWED",
      },
    });
  }

  try {
    const result = await apiHandler(req, res);
    return result;
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
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
  res.status(404).json({
    status: {
      message: "Endpoint not found",
      code: "NOT_FOUND",
    },
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    status: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`
Server is running
- Local: http://localhost:${port}
- API Endpoint: http://localhost:${port}/api/redeem
- Health Check: http://localhost:${port}/health
        `);
  });
}

module.exports = app;

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const moment = require("moment-timezone");

const app = express();
const port = 3000;

const apiRedeemRouter = require("./routes/redeem");
const { errorHandler } = require("./middleware/errorHandler");

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

app.use("/api/redeem", apiRedeemRouter);

app.get("/", (req, res) => {
  res.redirect("https://github.com/4levy");
});

app.get("/health", (req, res) => {
  const now = new Date();
  const uptimeSeconds = process.uptime();
  const readableUptime = moment.duration(uptimeSeconds, "seconds").humanize();
  res.json({
    status: {
      message: "Online",
      code: "OK",
    },
    timestamp: moment(now).tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss"),
    uptime: uptimeSeconds,
    readableUptime,
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

app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
  });
}

module.exports = app;

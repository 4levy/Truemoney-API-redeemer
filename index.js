const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const os = require("os");
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
  const memoryUsage = process.memoryUsage();
  const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
  const usedMemMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);

  res.json({
    status: {
      message: "Online",
      code: "OK",
    },
    timestamp: moment(now).tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss"),
    uptime: {
      seconds: uptimeSeconds.toFixed(0),
      human: readableUptime,
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpu_cores: os.cpus().length,
      memory: {
        total_mb: totalMemMB,
        used_mb: usedMemMB,
      },
      load_avg: os.loadavg(),
    },
    process: {
      node_version: process.version,
      pid: process.pid,
    },
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

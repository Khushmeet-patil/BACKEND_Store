const express = require("express");
const corsOrigins = require("./config/cors");

const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const vendorRoutes = require("./routes/vendor/index.routes");
const activityRoutes = require("./routes/activity.routes");
const adminRoutes = require("./routes/admin/index.routes");
const publicRoutes = require("./routes/public/index.routes");
const customerRoutes = require("./routes/customer/index.routes");
const uploadRoutes = require("./routes/upload.routes"); // ✅ ADD THIS

const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// 🔹 Serve uploaded images (GET)
app.use("/api/uploads", express.static("uploads"));

app.use(corsOrigins);
app.use(express.json());

// 🔹 Request Logger (Debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 🔹 APIs
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/customer", customerRoutes);

app.get("/", (req, res) => {
  res.send("Backend API running");
});

// 🔹 Diagnostic Route for SMTP
app.get("/api/diagnose-smtp", async (req, res) => {
  const net = require('net');
  const dns = require('dns');
  const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
  const ports = [465, 587, 25];
  let results = [];

  const checkPort = (port) => new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.on('connect', () => {
      results.push(`[SUCCESS] ${host}:${port} is reachable.`);
      socket.destroy();
      resolve();
    });
    socket.on('timeout', () => {
      results.push(`[TIMEOUT] ${host}:${port} is unreachable.`);
      socket.destroy();
      resolve();
    });
    socket.on('error', (err) => {
      results.push(`[ERROR] ${host}:${port} failed: ${err.message}`);
      socket.destroy();
      resolve();
    });
    socket.connect(port, host);
  });

  try {
    const address = await new Promise((resolve, reject) => {
      dns.lookup(host, (err, addr) => err ? reject(err) : resolve(addr));
    });
    results.push(`DNS Lookup Success: ${host} -> ${address}`);

    for (const port of ports) {
      await checkPort(port);
    }
  } catch (err) {
    results.push(`DNS Lookup Failed: ${err.message}`);
  }

  res.json({
    timestamp: new Date().toISOString(),
    env: {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER ? "DEFINED" : "UNDEFINED",
    },
    results
  });
});

module.exports = app;

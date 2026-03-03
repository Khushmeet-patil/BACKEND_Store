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

module.exports = app;

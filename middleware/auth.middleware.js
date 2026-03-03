const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user profile data
    const user = await User.findById(decoded.id).select(
      "_id email firstName lastName role"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔥 MERGE JWT + USER DATA (THIS IS THE FIX)
    req.user = {
      _id: user._id,                 // USER ID
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      vendorId: decoded.vendorId || null,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

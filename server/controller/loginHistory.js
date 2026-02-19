import LoginHistory from "../models/LoginHistory.js";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import nodemailer from "nodemailer";
import UAParser from "ua-parser-js";
import crypto from "crypto";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-password",
  },
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get geolocation from IP (You would need a service like ipstack or geoip2)
const getGeoLocation = async (ipAddress) => {
  try {
    // Using a free GeoIP API (consider using a more reliable paid service)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const data = await response.json();
    return {
      city: data.city || "",
      country: data.country_name || "",
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.log("Error fetching geolocation:", error);
    return {
      city: "",
      country: "",
      latitude: null,
      longitude: null,
    };
  }
};

// Record login attempt
export const recordLoginAttempt = async (req, res) => {
  try {
    const { userId } = req.body;
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    // Parse user agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const browserType = result.browser.name || "Unknown";
    const browserVersion = result.browser.version || "";
    const osType = result.os.name || "Unknown";
    const osVersion = result.os.version || "";
    const deviceType = result.device.type || "desktop";

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get geolocation
    const geoLocation = await getGeoLocation(ipAddress);

    // Check if this is a new device
    const existingLogin = await LoginHistory.findOne({
      userId,
      ipAddress,
      browserType,
      osType,
    });

    const isNewDevice = !existingLogin;

    // Determine authentication requirement
    let requiresOTP = false;
    let authMethod = "password";

    // Chrome requires OTP
    if (browserType.toLowerCase().includes("chrome")) {
      requiresOTP = true;
      authMethod = "otp";
    }
    // Edge/Microsoft Edge doesn't require OTP
    else if (
      browserType.toLowerCase().includes("edge") ||
      browserType.toLowerCase().includes("microsoft")
    ) {
      requiresOTP = false;
      authMethod = "password";
    }

    // Check mobile device restrictions (10 AM - 1 PM only)
    if (deviceType === "mobile") {
      const now = new Date();
      const hours = now.getHours();
      const isAllowedTime = hours >= 10 && hours < 13;

      if (!isAllowedTime) {
        return res.status(403).json({
          message:
            "Mobile access is only available between 10 AM - 1 PM. Please try again during this time.",
          hoursDenied: true,
        });
      }
    }

    // Create login history record
    const sessionId = crypto.randomBytes(16).toString("hex");
    const loginRecord = new LoginHistory({
      userId,
      deviceType,
      browserType,
      browserVersion,
      osType,
      osVersion,
      userAgent,
      ipAddress,
      city: geoLocation.city,
      country: geoLocation.country,
      sessionId,
      isActive: true,
      authMethod,
      otpVerified: !requiresOTP,
    });

    await loginRecord.save();

    // If requires OTP, send it
    if (requiresOTP) {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await OTP.create({
        userId,
        otp,
        otpType: "email",
        email: user.email,
        expiresAt,
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Login Verification OTP",
        html: `
          <h2>Login Attempt Detected</h2>
          <p>Your OTP for login verification is: <strong>${otp}</strong></p>
          <p><strong>Device Details:</strong></p>
          <ul>
            <li>Browser: ${browserType} ${browserVersion}</li>
            <li>OS: ${osType} ${osVersion}</li>
            <li>Device: ${deviceType}</li>
            <li>Location: ${geoLocation.city}, ${geoLocation.country}</li>
            <li>IP: ${ipAddress}</li>
          </ul>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you did not attempt this login, please ignore this email and change your password.</p>
        `,
      });

      return res.status(200).json({
        message: "Login recorded. OTP sent to your email.",
        requiresOTP: true,
        sessionId,
        loginRecordId: loginRecord._id,
        deviceInfo: {
          deviceType,
          browserType,
          osType,
          isNewDevice,
        },
      });
    }

    return res.status(200).json({
      message: "Login recorded successfully",
      requiresOTP: false,
      sessionId,
      loginRecordId: loginRecord._id,
      deviceInfo: {
        deviceType,
        browserType,
        osType,
        isNewDevice,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error recording login", error: error.message });
  }
};

// Verify login OTP
export const verifyLoginOTP = async (req, res) => {
  try {
    const { loginRecordId, otp } = req.body;

    if (!loginRecordId || !otp) {
      return res
        .status(400)
        .json({ message: "loginRecordId and otp are required" });
    }

    const loginRecord = await LoginHistory.findById(loginRecordId);
    if (!loginRecord) {
      return res.status(404).json({ message: "Login record not found" });
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      userId: loginRecord.userId,
      otp,
      otpType: "email",
      isUsed: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Update login record
    loginRecord.otpVerified = true;
    await loginRecord.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      sessionId: loginRecord.sessionId,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};

// Get login history
export const getLoginHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const logins = await LoginHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LoginHistory.countDocuments({ userId });

    // Format response
    const formattedLogins = logins.map((login) => ({
      _id: login._id,
      loginDate: login.createdAt,
      device: {
        type: login.deviceType,
        browser: `${login.browserType} ${login.browserVersion}`,
        os: `${login.osType} ${login.osVersion}`,
      },
      location: {
        ip: login.ipAddress,
        city: login.city,
        country: login.country,
      },
      authMethod: login.authMethod,
      isActive: login.isActive,
      sessionId: login.sessionId,
    }));

    return res.status(200).json({
      logins: formattedLogins,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching login history", error: error.message });
  }
};

// Get current active sessions
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.userId;

    const activeSessions = await LoginHistory.find({
      userId,
      isActive: true,
    })
      .select(
        "deviceType browserType osType ipAddress city country createdAt sessionId"
      )
      .sort({ createdAt: -1 });

    const formattedSessions = activeSessions.map((session) => ({
      _id: session._id,
      sessionId: session.sessionId,
      device: {
        type: session.deviceType,
        browser: session.browserType,
        os: session.osType,
      },
      location: {
        ip: session.ipAddress,
        city: session.city,
        country: session.country,
      },
      loginTime: session.createdAt,
    }));

    return res.status(200).json({
      sessions: formattedSessions,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching active sessions", error: error.message });
  }
};

// Logout (end session)
export const logout = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const loginRecord = await LoginHistory.findOne({ sessionId });
    if (!loginRecord) {
      return res.status(404).json({ message: "Session not found" });
    }

    loginRecord.isActive = false;
    loginRecord.logoutTime = new Date();
    await loginRecord.save();

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};

// Revoke all other sessions (logout from all devices)
export const revokeAllSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const { keepCurrentSessionId } = req.body;

    const result = await LoginHistory.updateMany(
      {
        userId,
        isActive: true,
        sessionId: { $ne: keepCurrentSessionId },
      },
      {
        isActive: false,
        logoutTime: new Date(),
      }
    );

    return res.status(200).json({
      message: "All other sessions have been revoked",
      sessionsRevoked: result.modifiedCount,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error revoking sessions", error: error.message });
  }
};

import User from "../models/User.js";
import OTP from "../models/OTP.js";
import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-password",
  },
});

const SUPPORTED_LANGUAGES = [
  "english",
  "spanish",
  "hindi",
  "portuguese",
  "chinese",
  "french",
];

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS (You would need to integrate with a service like Twilio)
const sendSMS = async (phone, otp) => {
  // This is a placeholder - integrate with actual SMS service
  try {
    // Example using Twilio
    // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: `Your OTP for language change is: ${otp}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });
    console.log(`SMS would be sent to ${phone} with OTP: ${otp}`);
    return true;
  } catch (error) {
    console.log("Error sending SMS:", error);
    return false;
  }
};

// Request language change
export const requestLanguageChange = async (req, res) => {
  try {
    const userId = req.userId;
    const { newLanguage } = req.body;

    if (!newLanguage || !SUPPORTED_LANGUAGES.includes(newLanguage)) {
      return res.status(400).json({
        message: `Invalid language. Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // French requires email verification
    if (newLanguage === "french") {
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
        subject: "Verify Email for Language Change",
        html: `
          <h2>Language Change Request</h2>
          <p>You have requested to change your language to French.</p>
          <p>Your verification OTP is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 10 minutes.</p>
        `,
      });

      return res.status(200).json({
        message: "OTP sent to your email",
        verificationType: "email",
        newLanguage,
      });
    } else {
      // Other languages use phone verification
      if (!user.phone) {
        return res
          .status(400)
          .json({ message: "Phone number not found in profile" });
      }

      await OTP.create({
        userId,
        otp,
        otpType: "phone",
        phone: user.phone,
        expiresAt,
      });

      await sendSMS(user.phone, otp);

      return res.status(200).json({
        message: "OTP sent to your phone",
        verificationType: "phone",
        newLanguage,
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error requesting language change", error: error.message });
  }
};

// Verify OTP and change language
export const verifyLanguageChangeOTP = async (req, res) => {
  try {
    const userId = req.userId;
    const { otp, newLanguage } = req.body;

    if (!otp || !newLanguage) {
      return res
        .status(400)
        .json({ message: "Please provide otp and newLanguage" });
    }

    if (!SUPPORTED_LANGUAGES.includes(newLanguage)) {
      return res.status(400).json({ message: "Invalid language" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine OTP type based on language
    const otpType = newLanguage === "french" ? "email" : "phone";

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      userId,
      otp,
      otpType,
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

    // Update user language
    user.preferredLanguage = newLanguage;

    // Mark email as verified if French
    if (newLanguage === "french") {
      user.isEmailVerified = true;
    } else {
      user.isPhoneVerified = true;
    }

    await user.save();

    // Translation strings for different languages
    const translations = {
      english: "English",
      spanish: "Spanish",
      hindi: "Hindi",
      portuguese: "Portuguese",
      chinese: "Chinese",
      french: "French",
    };

    return res.status(200).json({
      message: `Language changed to ${translations[newLanguage]} successfully`,
      userLanguage: newLanguage,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error changing language", error: error.message });
  }
};

// Get user language preference
export const getUserLanguage = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select(
      "preferredLanguage isEmailVerified isPhoneVerified"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      language: user.preferredLanguage || "english",
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching language", error: error.message });
  }
};

// Get all supported languages
export const getSupportedLanguages = (req, res) => {
  const languages = [
    { code: "english", name: "English", nativeName: "English" },
    { code: "spanish", name: "Spanish", nativeName: "Español" },
    { code: "hindi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "portuguese", name: "Portuguese", nativeName: "Português" },
    { code: "chinese", name: "Chinese", nativeName: "中文" },
    { code: "french", name: "French", nativeName: "Français" },
  ];

  return res.status(200).json({
    languages,
  });
};

// Get translations (placeholder - will integrate with i18n library)
export const getTranslations = async (req, res) => {
  try {
    const { language } = req.query;

    if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        message: `Invalid language. Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`,
      });
    }

    // This is a simplified translation object
    // In production, you should use a proper i18n library like i18next
    const translations = {
      english: {
        welcome: "Welcome",
        login: "Login",
        signup: "Sign Up",
        logout: "Logout",
        profile: "Profile",
        settings: "Settings",
        questions: "Questions",
        answers: "Answers",
        publicSpace: "Public Space",
        rewards: "Rewards",
        subscription: "Subscription",
      },
      spanish: {
        welcome: "Bienvenido",
        login: "Iniciar sesión",
        signup: "Registrarse",
        logout: "Cerrar sesión",
        profile: "Perfil",
        settings: "Configuración",
        questions: "Preguntas",
        answers: "Respuestas",
        publicSpace: "Espacio Público",
        rewards: "Recompensas",
        subscription: "Suscripción",
      },
      hindi: {
        welcome: "स्वागत है",
        login: "लॉगिन करें",
        signup: "साइन अप करें",
        logout: "लॉगआउट करें",
        profile: "प्रोफाइल",
        settings: "सेटिंग्स",
        questions: "सवाल",
        answers: "जवाब",
        publicSpace: "सार्वजनिक स्थान",
        rewards: "पुरस्कार",
        subscription: "सदस्यता",
      },
      portuguese: {
        welcome: "Bem-vindo",
        login: "Entrar",
        signup: "Cadastre-se",
        logout: "Sair",
        profile: "Perfil",
        settings: "Configurações",
        questions: "Perguntas",
        answers: "Respostas",
        publicSpace: "Espaço Público",
        rewards: "Recompensas",
        subscription: "Assinatura",
      },
      chinese: {
        welcome: "欢迎",
        login: "登录",
        signup: "注册",
        logout: "登出",
        profile: "个人资料",
        settings: "设置",
        questions: "问题",
        answers: "答案",
        publicSpace: "公共空间",
        rewards: "奖励",
        subscription: "订阅",
      },
      french: {
        welcome: "Bienvenue",
        login: "Connexion",
        signup: "S'inscrire",
        logout: "Déconnexion",
        profile: "Profil",
        settings: "Paramètres",
        questions: "Questions",
        answers: "Réponses",
        publicSpace: "Espace Public",
        rewards: "Récompenses",
        subscription: "Abonnement",
      },
    };

    return res.status(200).json({
      language,
      translations: translations[language] || translations["english"],
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error fetching translations", error: error.message });
  }
};

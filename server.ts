import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let adminInitError: string | null = null;
if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
  try {
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (privateKey) {
      // Bulletproof PEM reconstruction:
      // 1. Remove headers, footers, quotes, and ALL whitespace/newlines
      let keyBody = privateKey
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/["']/g, '')
        .replace(/\\n/g, '')
        .replace(/\s+/g, '');
      
      // 2. Reconstruct the PEM format with proper 64-character line breaks
      if (keyBody.length > 0) {
        const matchedLines = keyBody.match(/.{1,64}/g);
        if (matchedLines) {
          privateKey = `-----BEGIN PRIVATE KEY-----\n${matchedLines.join('\n')}\n-----END PRIVATE KEY-----`;
        }
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error: any) {
    adminInitError = error.message;
    console.error("Firebase Admin initialization error:", error);
  }
} else {
  adminInitError = "FIREBASE_ADMIN_PROJECT_ID is missing";
  console.warn("FIREBASE_ADMIN_PROJECT_ID not found. OTP system will not work.");
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

function getBackendError() {
  const missing = [];
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) missing.push('FIREBASE_ADMIN_PROJECT_ID');
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) missing.push('FIREBASE_ADMIN_CLIENT_EMAIL');
  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) missing.push('FIREBASE_ADMIN_PRIVATE_KEY');
  
  if (missing.length > 0) {
    return `Missing Secrets: ${missing.join(', ')}. Please add them in AI Studio Settings -> Secrets.`;
  } else {
    return `Firebase Init Error: ${adminInitError || 'Unknown error'}. Please check if the Private Key is copied exactly.`;
  }
}

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function startServer() {
  const app = express();
  // Use process.env.PORT for Render, fallback to 3000 for local dev
  const PORT = process.env.PORT || 3000;

  // Enable CORS so Android app can communicate with this API
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/auth/request-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!auth || !db) return res.status(500).json({ error: getBackendError() });

    try {
      // Check if user exists
      await auth.getUserByEmail(email);

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in Firestore
      await db.collection("otps").doc(email).set({
        email,
        code: otp,
        type: 'password-reset',
        expiresAt: expiresAt.toISOString(),
      });

      // Send Email
      await transporter.sendMail({
        from: `"Muslim Sathi" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Password Reset OTP - Muslim Sathi",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #059669; text-align: center;">Muslim Sathi</h2>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p>আপনার পাসওয়ার্ড রিসেট করার জন্য নিচের ওটিপি (OTP) কোডটি ব্যবহার করুন:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; padding: 15px 30px; background: #f0fdf4; border-radius: 8px; display: inline-block; border: 1px solid #dcfce7;">
                ${otp}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">এই কোডটি আগামী ১০ মিনিটের জন্য কার্যকর থাকবে।</p>
            <p style="color: #666; font-size: 14px;">আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই ইমেইলটি ইগনোর করুন।</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="text-align: center; color: #999; font-size: 12px;">&copy; 2026 Muslim Sathi. All rights reserved.</p>
          </div>
        `,
      });

      res.json({ message: "OTP sent successfully" });
    } catch (error: any) {
      console.error("OTP Error:", error);
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/send-verification-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!auth || !db) return res.status(500).json({ error: getBackendError() });

    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store OTP in Firestore
      await db.collection("otps").doc(`verify_${email}`).set({
        email,
        code: otp,
        type: 'email-verification',
        expiresAt: expiresAt.toISOString(),
      });

      // Send Email
      await transporter.sendMail({
        from: `"Muslim Sathi" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Email Verification OTP - Muslim Sathi",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #059669; text-align: center;">Muslim Sathi</h2>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p>আপনার অ্যাকাউন্ট ভেরিফাই করার জন্য নিচের ওটিপি (OTP) কোডটি ব্যবহার করুন:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; padding: 15px 30px; background: #f0fdf4; border-radius: 8px; display: inline-block; border: 1px solid #dcfce7;">
                ${otp}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">এই কোডটি আগামী ১৫ মিনিটের জন্য কার্যকর থাকবে।</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="text-align: center; color: #999; font-size: 12px;">&copy; 2026 Muslim Sathi. All rights reserved.</p>
          </div>
        `,
      });

      res.json({ message: "Verification OTP sent successfully" });
    } catch (error: any) {
      console.error("Verification OTP Error:", error);
      res.status(500).json({ error: "Failed to send verification OTP" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    const { email, otp, uid } = req.body;
    if (!email || !otp || !uid) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!auth || !db) return res.status(500).json({ error: getBackendError() });

    try {
      const otpDoc = await db.collection("otps").doc(`verify_${email}`).get();
      if (!otpDoc.exists) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      const data = otpDoc.data();
      if (data?.code !== otp || new Date(data?.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Mark email as verified in Firebase Auth
      await auth.updateUser(uid, { emailVerified: true });

      // Delete OTP
      await db.collection("otps").doc(`verify_${email}`).delete();

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Verification Error:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!auth || !db) return res.status(500).json({ error: getBackendError() });

    try {
      const otpDoc = await db.collection("otps").doc(email).get();
      if (!otpDoc.exists) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      const data = otpDoc.data();
      if (data?.code !== otp || new Date(data?.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Update password in Firebase Auth
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password: newPassword });

      // Delete OTP
      await db.collection("otps").doc(email).delete();

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset Error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.post("/api/auth/reset-password-phone", async (req, res) => {
    const { idToken, newPassword } = req.body;
    if (!idToken || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!auth || !db) return res.status(500).json({ error: getBackendError() });

    try {
      // Verify the ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Invalid token: No phone number found" });
      }

      // Find the user in Firestore by phone number
      const usersSnapshot = await db.collection("users").where("phoneNumber", "==", phoneNumber).get();
      
      if (usersSnapshot.empty) {
        // Try without +88 just in case
        const localPhone = phoneNumber.replace('+88', '');
        const localUsersSnapshot = await db.collection("users").where("phoneNumber", "==", localPhone).get();
        
        if (localUsersSnapshot.empty) {
          return res.status(404).json({ error: "User not found with this phone number" });
        }
        
        const userDoc = localUsersSnapshot.docs[0];
        await auth.updateUser(userDoc.id, { password: newPassword });
      } else {
        const userDoc = usersSnapshot.docs[0];
        await auth.updateUser(userDoc.id, { password: newPassword });
      }

      // Delete the temporary Phone Auth user to prevent clutter
      try {
        await auth.deleteUser(decodedToken.uid);
      } catch (deleteErr) {
        console.error("Failed to delete temp phone auth user:", deleteErr);
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset Error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

import { Request, Response } from "express";
import { AuthService } from "../../application/services/auth.service";
import { UserModel } from "../../infrastructure/database/models/user.model";
import jwt from "jsonwebtoken"
import { createAccessToken } from "../../utils/jwt";

export const AuthController = {
  register: async (req: Request, res: Response) => {
    try {
      console.log("register", req.body);

      const user = await AuthService.register(req.body);
      res.status(201).json({ message: "User registered", user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  login: async (req: Request, res: Response) => {

    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login(email, password);
      console.log(req.body);
      console.log("refreshToken", refreshToken);

      // store JWT in cookie
      // res.cookie("refreshToken", refreshToken, {
      //   httpOnly: true,
      //   // secure: true,
      //   // sameSite: "none",
      //   secure: false,      // 🔑 MUST be false on HTTP
      //   sameSite: "lax",    // 🔑 MUST NOT be "none" on HTTP
      //   path: "/", // important
      //   maxAge: 7 * 24 * 60 * 60 * 1000,
      // });
      const isProd = process.env.NODE_ENV === "production";

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log("user", user);

      res.status(200).json({
        message: "Login successful",
        user, accessToken
      });
    } catch (error: any) {
      console.log("error.message", error.message);

      res.status(400).json({ message: error.message });
    }
  },
  verifyOtp: async (req: Request, res: Response) => {
    console.log("verifyOtp", req.body);
    try {
      const { email, otp } = req.body;

      const result = await AuthService.verifyOtp(email, otp);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  // Get current user
  getMe: async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const accessToken = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as { id: string };
      const user = await UserModel.findById(decoded.id).select("-password");
      console.log("getmeuser", user);

      return res.json({ user });
    } catch (error: any) {
      return res.status(401).json({ message: "Access Token expired" });
    }
  },
  // Get current user
  refresh: async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string };
      console.log("decoded", decoded);

      const user = await UserModel.findById(decoded.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      const newAccessToken = createAccessToken({
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        branchId: user.branchId,
      });


      return res.json({ accessToken: newAccessToken, user: { id: user._id, name: user.username, email: user.email, role: user.role, branchId: user.branchId } });
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
  },

  logout: (req: Request, res: Response) => {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    res.status(200).json({ message: "Logged out successfully" });
  },
};

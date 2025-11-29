import { Router } from "express";
import { AuthController } from "../controllers/authcontroller";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/verify-otp", AuthController.verifyOtp);
router.get("/me", AuthController.getMe);
router.get("/refresh", AuthController.refresh);


export default router;

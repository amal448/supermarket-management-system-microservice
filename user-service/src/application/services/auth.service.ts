import bcrypt from "bcryptjs";
import { UserRepository } from "../../infrastructure/repositories/auth.repositories";
// import { redis } from "../../infrastructure/database/redis";
import type { UserEntity } from "../../domain/entities/user.entity";
import { createAccessToken, createRefreshToken } from "../../utils/jwt";

const OTP_EXPIRY = 5 * 60; // 5 minutes
export const AuthService = {

    async register(data: UserEntity) {
        const existingUser = await UserRepository.findByEmail(data.email);
        if (existingUser) throw new Error("Email already registered");

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const newUser = await UserRepository.create({
            ...data,
            password: hashedPassword,
            isActive: false
        });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const key = `otp:${newUser.email.toLowerCase().trim()}`;
        // await redis.set(key, otp, "EX", OTP_EXPIRY);
        console.log("otp",otp);
        
        console.log("OTP saved under key:", key);


        // you’d send this via email — for dev, just log
        return { message: "User registered. Please verify OTP.", email: newUser.email };

    },

    async verifyOtp(email: string, otp: string) {
        const key = `otp:${email.toLowerCase().trim()}`;
        // const storedOtp = await redis.get(key);
        // console.log("storedOtp",storedOtp);
        
        console.log("Verifying using key:", key);


        // if (!storedOtp) throw new Error("OTP expired or invalid");
        // if (storedOtp !== otp) throw new Error("Incorrect OTP");

        const user = await UserRepository.findByEmail(email);
        if (!user) throw new Error("User not found");

        user.isActive = true;
        await user.save();

        // await redis.del(`otp:${email}`);
        return { message: "Email verified successfully" };
    },

    async login(email: string, password: string) {
        const user = await UserRepository.findByEmail(email);
        if (!user) throw new Error("Invalid email or password");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid email or password");

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        return {
            user: {
                id: user._id,
                name: user.username,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        };





    },
    
}